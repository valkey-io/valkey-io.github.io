+++
title = "Valkey Large Object module: 400 Gbps and 108 TB from one node"
date = 2026-11-17 01:01:01
description = "The Valkey Large Object module stores values of tens to hundreds of megabytes outside the Valkey heap, moves them over RDMA, and tiers them to NVMe, so large values stop slowing down every other client."

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-03.webp"
+++

## Where this fits

A large language model reads the whole prompt before it answers.
For every token, at every layer, it computes a key vector and a value vector that later tokens use to decide what to pay attention to.
Those saved vectors are the KV cache.
If a later request starts with the same text, such as a shared system prompt, a long document or the earlier turns of a conversation, the inference engine can load the saved KV cache and skip the work of computing it again.
That saves GPU time and shortens the time to the first token.

GPU memory is too small to keep every cache, so inference stacks keep them in tiers: GPU memory, then the host's memory, then a shared store that every GPU server can read.
Tools such as [LMCache](https://github.com/LMCache/LMCache) manage the tiers.
Valkey can be that shared store, and a Valkey cluster scales its capacity independently of the GPU servers.
[KV caching on Valkey](https://valkey.io/blog/kv-caching-on-valkey/) shows what that does for a fleet of GPU servers.

What the shared store has to hold is large.
LMCache splits a prompt into chunks of 256 tokens and stores each chunk as one object.
The size depends on the model:

| Model | Cache per token | One 256-token chunk |
| --- | --- | --- |
| Llama 3.1 8B | 128 KiB | 32 MiB |
| Llama 3.1 70B | 320 KiB | 80 MiB |
| Llama 3.1 405B | 504 KiB | 126 MiB |

A cache hit moves many objects of tens to over a hundred megabytes, quickly.
The Valkey Large Object module is built for that.
It is not specific to KV cache: it stores any large binary value, and this is the use that drove its design.

## What changes when values reach hundreds of megabytes

Valkey is built for small values, typically a few hundred bytes.
Out of the box a string value is capped at 512 MB (`proto-max-bulk-len`; a `SET` of 512 MiB plus one byte returns `invalid bulk length`), a command's own work, such as storing a value, runs on the main thread while other clients wait, and every byte goes through the TCP stack and the server's network buffers.

We measured stock Valkey (commit `c86f6ee51`) over TCP, with every value in DRAM: `GET`s over a 64 GiB hot set plus `SET`s of new keys from a billion-key space, so memory fills and every `SET` then evicts.
A separate connection sent one `PING` every 10 ms to show how long an unrelated small command waits.
The figures are the last 10 minutes of about 15 at the memory limit.
The server ran with `maxmemory 640gb`, `allkeys-lru` and 8 I/O threads on an i8ge.48xlarge, and two c8gn.16xlarge clients ran cachecannon with 16 threads and a 10-second request timeout.

| Object size | GET only (Gbps) | SET only, at memory limit (Gbps) | GET and SET together, at memory limit (Gbps) | GET p50 / p99 | SET p50 / p99 | PING p99 / max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 207.8 | 199-211 | 310.7 | 2.6 / 6.0 ms | 6.7 / 21 ms | 218 / 670 ms |
| 8 MiB | 207.9 | 119 | 218.2 | 42 / 60 ms | 122 / 213 ms | 36 / 268 ms |
| 32 MiB | 207.9 | 116 | 210.4 | 186 / 232 ms | 426 ms / 1.03 s | 50 / 287 ms |
| 64 MiB | 208.0 | 111 | 184.8 | 237 / 290 ms | 395 ms / 0.94 s | 55 / 283 ms |
| 256 MiB | 128 | 72-76 | 150.8 | 329 / 420 ms | 608 ms / 1.28 s | 50 / 104 ms |
| 500 MiB | 141 | 71-75 | 142.6 | 698 / 902 ms | 1.1-1.3 / 2.2-2.4 s | 71 / 149 ms |

- **Reads and writes:** reads alone hit the hosts' TCP ceiling of about 208 Gbps up to 64 MiB. Writes alone held 111-119 Gbps at the limit from 8 to 64 MiB and 72-76 Gbps at 256 and 500 MiB.
- **Other clients wait:** a `PING` took 36-218 ms at p99 and up to 670 ms, against 0.05 ms when idle, because the main thread ran at 99.8-99.9% CPU copying values.
- **Capacity:** stock Valkey held 640 GiB in DRAM before evicting.

## What the module is

The Valkey Large Object module (`libvalkey_large_object.so`) is a Valkey module written in Rust.
It adds a value type and a small set of commands for large binary values, and it keeps those values outside the Valkey heap.
It needs Valkey 8.0 or later on Linux (x86_64 or aarch64).
Release 0.1 is out.
It is a 0.x version, so commands, replies and configuration can change before 1.0.

It has four layers:

```text
Commands    parse the command and resolve the key to an object
   |
Engine      chooses the path by mode (Dram or Tiered) and transport (TCP or RDMA)
   |
Storage     DRAM segments, disk staging buffers, io_uring, object files
   |
Transport   libfabric: RDMA reads and writes against client memory
```

**Data type.** Each object is one Valkey key, whatever its size. The keyspace holds a small descriptor: an object ID, the length, and a CRC32C checksum. The bytes live elsewhere. Nothing is split across keys and nothing needs reassembling. In `Tiered` mode objects are immutable: writing a key again creates a new object, and the old one is freed when its last reader finishes.

**Engine.** Every `GET` and `SET`, in every mode and over every transport, blocks only the client that sent it. The module hands the transfer to its own pool of worker threads (8 by default, `largeobj.worker-threads`) and replies when the transfer finishes, while the Valkey main thread keeps serving everyone else. One streaming driver handles all eight combinations of `Dram` or `Tiered`, `GET` or `SET`, TCP or RDMA. It moves an object in chunks (1 MiB by default, `largeobj.chunk-size`), up to 64 buffers at a time (`largeobj.max-buffers-per-op`), and hands each chunk to its target as soon as the source has produced it. A 256 MiB value never needs a 256 MiB buffer, and network and disk transfers overlap.

**Storage.** Object bytes live in segments: large blocks of memory (1 GB each by default, `largeobj.segment-size`) that the module reserves once and sub-allocates. Registering memory with the network card costs 300 to 500 microseconds per call, which would ruin throughput on the data path, so the module registers each segment once, with the network card and, in `Tiered` mode, with io_uring. In `Dram` mode every object lives in DRAM segments, up to the core `maxmemory` setting. In `Tiered` mode every object is a file on local NVMe disk, and DRAM is a read cache:

- Files sit in `largeobj.disk-dir`, spread over 1,024 subdirectories by object ID so creates and deletes don't serialize on one directory lock. XFS is the only supported file system.
- Reads and writes use io_uring with registered buffers and `O_DIRECT`, through DRAM staging buffers. A dedicated thread owns each io_uring ring.
- An object is copied into the DRAM cache on its first read by default (`largeobj.promote-min-hits`). When the cache is full, the module drops a cached copy with a low least-frequently-used score (the lowest in a small random sample); the object stays on disk.
- When the disk limit (`largeobj.disk-maxmemory`) or `maxmemory` is reached, a write evicts the least recently used large objects, as long as `maxmemory-policy` is an `allkeys-*` policy. With `noeviction` the write fails with `OOM`.

**Transport.** The RDMA commands use [libfabric](https://ofiwg.github.io/libfabric/). A client opens a session once per connection with `BLOB.RDMA_HELLO`, sending its libfabric endpoint address, and the reply lists the server's addresses. After that, `BLOB.RDMA_GET key rkey addr len ...` names regions of client memory the client has registered, and the server writes the object straight into them. `BLOB.RDMA_SET` is the reverse. The object bytes never travel on the Valkey connection, which carries only the command, the key, the regions and a short reply. The server registers its memory for local access only, and it starts every transfer, so a client cannot read or write server memory. The TCP commands, `BLOB.TCP_SET` and `BLOB.TCP_GET`, carry the bytes on the normal connection and work with any client.

**Integrity.** The server calculates a CRC32C checksum for every stored object. `BLOB.RDMA_SET` can send one, and the server rejects the write if the bytes don't match. `BLOB.RDMA_GET` returns the stored checksum along with the length, so the client can check what it received.

## What it supports

|  | Supported |
| --- | --- |
| Operating modes | `Dram` (default): all objects in DRAM. `Tiered`: every object on NVMe, DRAM as a read cache. |
| Transports | TCP (`BLOB.TCP_SET`, `BLOB.TCP_GET`): any Valkey client. RDMA (`BLOB.RDMA_*`): a client that implements the libfabric flow, and EFA hardware for the default `EfaDirect` provider. `Emulated` runs libfabric over TCP sockets for developing RDMA clients; it is not faster than the TCP commands. |
| Object size | Up to `largeobj.max-object-size` (512 MB by default). In `Dram` mode an object must fit in one segment. |
| Eviction | Least recently used, controlled by the core `maxmemory-policy`. |
| Requirements | Valkey 8.0 or later. Linux on x86_64 or aarch64. libfabric 2.0 or later to build, also for TCP only. `Tiered` mode: Linux 5.1 or later and XFS. |

## How fast it runs

All numbers here are for the RDMA path over AWS Elastic Fabric Adapter (EFA), in `Tiered` mode.
We have not measured the module over TCP.

One i8ge.48xlarge server ran the module with a 108 TB disk limit on 16 instance-store NVMe drives striped under XFS. Two c8gn.16xlarge clients drove it with cachecannon over EFA. Each client machine used the number of `GET` and `SET` connections shown in the table (4 each at 256 and 500 MiB, up to 16 each at 1 and 8 MiB), so the total is twice that.
Each size ran `GET`s over a 64 GiB hot set and `SET`s of new keys at the same time.
The run first filled the disk to its limit and then ran for 2 hours at the limit, where every `SET` evicts the oldest objects to make room.
The stock Valkey numbers are the ones from the table above, from a separate test bed with the same instance types, over TCP.

Stock Valkey against the module, GET + SET together:

| Object size | Stock Valkey total (Gbps) | Module total (Gbps) | Module / stock | GET p99, stock / module | SET p99, stock / module | PING p99, stock / module |
| --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 310.7 | 372.2 | 1.2x | 6.0 ms / 2.10 ms | 21 ms / 2.75 ms | 218 ms / 0.23 ms |
| 8 MiB | 218.2 | 399.3 | 1.8x | 60 ms / 15.2 ms | 213 ms / 16.2 ms | 36 ms / 0.23 ms |
| 32 MiB | 210.4 | 388.7 | 1.8x | 232 ms / 37.5 ms | 1.03 s / 41.2 ms | 50 ms / 0.36 ms |
| 64 MiB | 184.8 | 377.9 | 2.0x | 290 ms / 54.5 ms | 0.94 s / 56.1 ms | 55 ms / 0.35 ms |
| 256 MiB | 150.8 | 372.3 | 2.5x | 420 ms / 101 ms | 1.28 s / 105 ms | 50 ms / 0.33 ms |
| 500 MiB | 142.6 | 371.9 | 2.6x | 902 ms / 193 ms | 2.2-2.4 s / 195 ms | 71 ms / 0.32 ms |

The module in detail.
Each of the two client machines used the number of `GET` and `SET` connections shown:

| Object size | Connections per client, GET / SET | GET Gbps (egress) | SET Gbps (ingress) | Total (Gbps) | GET p50 / p99 | SET p50 / p99 | PING p99 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 16 / 16 | ~203 | ~169 | 372.2 | 1.27 / 2.10 ms | 1.53 / 2.75 ms | 0.23 ms |
| 8 MiB | 16 / 16 | ~208 | ~191 | 399.3 | 10.6 / 15.2 ms | 10.8 / 16.2 ms | 0.23 ms |
| 32 MiB | 12 / 12 | ~201 | ~188 | 388.7 | 31.5 / 37.5 ms | 34.3 / 41.2 ms | 0.36 ms |
| 64 MiB | 8 / 8 | ~193 | ~185 | 377.9 | 43.8 / 54.5 ms | 45.6 / 56.1 ms | 0.35 ms |
| 256 MiB | 4 / 4 | ~191 | ~182 | 372.3 | 88.6 / 101 ms | 95.4 / 105 ms | 0.33 ms |
| 500 MiB | 4 / 4 | ~188 | ~184 | 371.9 | 178 / 193 ms | 185 / 195 ms | 0.32 ms |

The stock Valkey p50 and p99 for every size are in the first table above.

- With reads and writes together, the module moved 1.8x to 2.6x the throughput of stock Valkey from 8 MiB up (stock Valkey moved 38-55% of the module's), and 1.2x at 1 MiB. Its total stayed between 372 and 399 Gbps at every size.
- The module evicted between 319 thousand (500 MiB) and 131 million (1 MiB) objects at the limit [validate], and rejected no `SET` at any size.
- A `PING` from a separate client waited at most 0.36 ms at p99 with the module, against 36-218 ms with stock Valkey.
- The module node held 108 TB on NVMe, against 640 GiB of DRAM for stock Valkey.
- Run alone for 3 minutes, `GET`s reached 215-216 Gbps from NVMe and 204-216 Gbps from DRAM, so the disk tier doesn't cost read bandwidth. `SET`s reached 193 Gbps.
- At 1 MiB the total was 372.2 Gbps, 7% below 8 MiB (399.3). From 8 MiB up the total stays within 8% of the best size.
- The module ran over RDMA on a separate test bed and stock Valkey ran over TCP, so the table compares whole setups, not one variable.

## Try it

```bash
git clone https://github.com/valkey-io/valkey-large-object
cd valkey-large-object
cargo build --release      # target/release/libvalkey_large_object.so
```

The build needs libfabric 2.0 or later with development files, `clang` and `libclang-dev`.
Then start Valkey in `Tiered` mode:

```bash
valkey-server --port 6379 \
  --maxmemory 4gb \
  --maxmemory-policy allkeys-lru \
  --loadmodule ./target/release/libvalkey_large_object.so \
  --largeobj.operating-mode Tiered \
  --largeobj.disk-dir /mnt/nvme/largeobj \
  --largeobj.disk-maxmemory 10gb \
  --largeobj.segment-size 64mb \
  --largeobj.max-object-size 32mb \
  --largeobj.disk-staging-size 64mb
```

In `Tiered` mode the module deletes `largeobj.disk-dir` and everything in it at startup and at shutdown, then creates it again.
Give it a new, empty directory on XFS that only the module uses, never a mount point or a directory with other data.

| Setting | Default | Meaning |
| --- | --- | --- |
| `largeobj.operating-mode` | `Dram` | `Dram` or `Tiered` |
| `largeobj.disk-dir` | none | Dedicated directory for object files, on XFS. Required in `Tiered` mode |
| `largeobj.disk-maxmemory` | 0 (no limit) | Disk space limit. At the limit, writes evict the least recently used objects |
| `largeobj.segment-size` | 1 GB | Size of each DRAM segment, 1 MB to 1 GB |
| `largeobj.max-object-size` | 512 MB | Largest value accepted |
| `largeobj.fabric-provider` | `EfaDirect` | `EfaDirect` (EFA hardware) or `Emulated` (libfabric over TCP, for developing RDMA clients) |

Try the TCP commands with `valkey-cli`:

```text
BLOB.TCP_SET mykey "hello"
BLOB.TCP_GET mykey
BLOB.INFO mykey
```

The RDMA commands need a client that registers its memory with libfabric and follows the flow in the [RDMA overview](https://github.com/valkey-io/valkey-large-object/blob/main/docs/COMMANDS.md#rdma-overview); the repository has no RDMA client library.
The [command reference](https://github.com/valkey-io/valkey-large-object/blob/main/docs/COMMANDS.md) and [getting started guide](https://github.com/valkey-io/valkey-large-object/blob/main/docs/GETTING_STARTED.md) cover the rest.

The module is open source and release 0.1 is out.
File issues and pull requests at [valkey-io/valkey-large-object](https://github.com/valkey-io/valkey-large-object).
