+++
title = "Valkey Large Object Module: as fast as your hardware"
date = 2026-11-17 01:01:01
description = "The Valkey Large Object module keeps values of tens to hundreds of megabytes off the main thread and out of the heap, so a node's throughput follows its network and storage bandwidth, not Valkey's CPU."

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
If a later request starts with the same text, such as a shared system prompt, a long document or the 
earlier turns of a conversation, the inference engine can load the 
saved KV cache and skip the work of computing it again.
That saves GPU time and shortens the time to the first token.

GPU memory is too small to keep every cache, so inference stacks keep them in tiers: GPU memory, then the host's memory, then a shared store that every GPU server can 
read.
Tools such as [LMCache](https://github.com/LMCache/LMCache) manage the tiers.
Valkey can be that shared store, and a Valkey cluster scales its capacity independently of the GPU servers.
[KV caching on Valkey](https://valkey.io/blog/kv-caching-on-valkey/) shows what that does for a fleet of GPU servers.

What the shared store has to hold is large.
LMCache splits a prompt into chunks, 256 tokens by default, and stores each chunk as one object.
The size depends on the model and the chunk size:

| Model | Cache per token | 256-token chunk | 2,048-token chunk |
| --- | --- | --- | --- |
| Kimi K2.7-Code (FP8) | 34.3 KiB | 8.6 MiB | 69 MiB |
| Qwen3-235B-A22B (FP8) | 94 KiB | 23.5 MiB | 188 MiB |
| Mistral-Medium-3.5-128B (FP8) | 176 KiB | 44 MiB | 352 MiB |

Larger chunks mean fewer, bigger objects per prompt.
A cache hit moves many of these objects, quickly.
The Valkey Large Object module is built for that.
It is not specific to KV cache: it stores any large binary value, and this is the use that drove its design.

## What changes when values reach hundreds of megabytes

Valkey is built for small values, typically a few hundred bytes.
Out of the box a string value is capped at 512 MiB (`proto-max-bulk-len`), a command's own work, such as storing a value, runs on the main thread while other clients wait, and every byte goes through the TCP stack and the server's network buffers.

We measured stock Valkey 9.2 over TCP [validate: these numbers are from a pre-release build, rerun on 9.2.0 pending], with every value held in DRAM, on one i8ge.48xlarge (`maxmemory 640gb`, `allkeys-lru`, 8 I/O threads).

Two c8gn.16xlarge clients drove it with [cachecannon](https://github.com/cachecannon/cachecannon) and a 10-second request timeout.
They used the same number of `GET` and `SET` connections per client as the module runs below: 16 each at 1 and 8 MiB, 12 at 32 MiB, 8 at 64 MiB, and 4 at 256 and 500 MiB.

The workload:

- `GET`s read a 64 GiB hot set that was filled beforehand, so every `GET` finds its key.
- `SET`s always write new keys, picked from a billion-key space, so none overwrites an existing value. Once memory is full, every `SET` evicts an older key.
- We ran `GET`s alone, `SET`s alone, and then both together for 5 minutes, long enough for memory to fill.
- A separate connection sent a `PING` every 10 ms to show how long an unrelated small command waits.

| Object size | GET only (Gbps) | SET only (Gbps) | GET and SET together (Gbps) | GET p50 / p99 (together) | SET p50 / p99 (together) | PING p99 / max (together) | Evictions (together) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 208.1 | 159.4 | 290.8 (149.5 + 141.3) | 1.1 / 2.6 ms | 1.5 / 4.6 ms | 2.1 / 240 ms | 4.63M |
| 8 MiB | 207.9 | 119.0 | 225.6 (157.2 + 68.4) | 13 / 20 ms | 30-32 / 49-50 ms | 9.6 / 226 ms | 253K |
| 32 MiB | 201.3 | 112.2 | 217.6 (148.7 + 68.9) | 41-43 / 73 ms | 77-78 / 230-238 ms | 15 / 46 ms | 64K |
| 64 MiB | 134.0 | 104.9 | 181.0 (116.0 + 65.0) | 71-74 / 106-114 ms | 115 / 323-325 ms | 17 / 234 ms | 30K |
| 256 MiB | 71.9 | 72.7 | 107.6 (53.0 + 54.6) | 325-333 / 440-453 ms | 331 / 392-394 ms | 26 / 221 ms | 6.0K |
| 500 MiB | 74.7 | 76.1 | 104.8 (49.5 + 55.2) | 625-654 ms / 1.3-1.4 s | 633-638 ms / 0.7-1.2 s | 34 / 93 ms | 2.9K |

- **Reads and writes:** `GET`s alone reached 201-208 Gbps, the hosts' TCP ceiling, up to 32 MiB. With fewer connections from 64 MiB up, each connection waits longer for each value, so they reached 134, 72 and 75 Gbps. `SET`s alone reached 105-119 Gbps from 8 to 64 MiB and 73-76 Gbps at 256 and 500 MiB.
- **Other clients:** a `PING` from another connection took 2.1-34 ms at p99 and up to 240 ms, against 0.05 ms when idle.
- **Capacity:** stock Valkey held 640 GiB in DRAM before evicting.

## What the module is

The [Valkey Large Object module](https://github.com/valkey-io/valkey-large-object) is a Valkey module written in Rust.
It introduces a new module data type and a set of commands optimized for large binary values.
The module data type holds only a small descriptor, and the bytes live in memory segments the module manages itself, or in files on disk.
It needs Valkey 8.0 or later on Linux (x86_64 or aarch64).

Here is the path of one `GET` or `SET` through the module, with the two kinds of registered segments it uses:

![Request path through the module. A client sends a command to the Valkey main thread, which blocks only that client and hands the transfer to a streaming task. The streaming task moves the object as a window of chunks in parallel, for both SET and GET. Chunks move between two kinds of segment pools, DRAM cache segments (four shown) and disk staging segments (two shown), which have their own segment counts. Each segment has its own talc allocator and is registered with both EFA and io_uring. Bytes cross the network by RDMA directly between those segments and the client's registered memory. Disk reads and writes go through the io_uring engine to object files on XFS.](request_path.svg)

**Data type.** Each object is one Valkey key, whatever its size.
The keyspace holds a small descriptor (an object ID, the length and a CRC32C checksum) and the bytes live elsewhere, so nothing is split across keys or reassembled.
In `Tiered` mode objects are immutable: writing a key again creates a new object, and the old one is freed when its last reader finishes.
An object can be up to `largeobj.max-object-size` (512 MiB by default, configurable), and in `Dram` mode it must fit in one segment.

**Engine.** Every `GET` and `SET` blocks only the client that issues the command, in every storage and transport mode.
The module moves the data on its own worker threads (8 by default, `largeobj.worker-threads`) while the Valkey main thread keeps serving everyone else.
Objects are streamed in chunks (1 MiB by default, `largeobj.chunk-size`), up to 64 at a time (`largeobj.max-buffers-per-op`), and each chunk goes to its target as soon as the source has produced it, so network and disk transfers overlap.
In `Tiered` mode the chunks pass through a bounded window of reused staging buffers, so a transfer does not allocate the whole object, however large it is.

**Memory.** Object bytes live in segments: large blocks of memory (1 GiB each by default, `largeobj.segment-size`) that the module reserves once and carves up itself.
Each segment has its own allocator that hands out exact-sized, 4 KiB-aligned slots, so objects from tens of kilobytes to hundreds of megabytes waste no memory on fixed size classes.
Registering memory with the network card costs 300 to 500 microseconds per call, which would ruin throughput on the data path.
So the module registers each segment once, and in `Tiered` mode with io_uring as well.
A buffer registered both ways serves the network card and the disk without a copy in between.
In `Dram` mode every object lives in these segments, up to the core `maxmemory` setting.

**Disk.** In `Tiered` mode every object is a file on block storage, such as local NVMe or EBS, and DRAM is a read cache:

- The module expects an XFS file system and Linux 5.1 or later. Files sit in `largeobj.disk-dir`, spread over 1,024 subdirectories by object ID so creates and deletes don't serialize on one directory lock.
- An io_uring engine operates on those files, with `O_DIRECT`, registered buffers and a dedicated thread for each ring. Writes and cache misses pass through DRAM staging buffers (`largeobj.disk-staging-size`) that are registered with the network card, so an object reaches the network without a copy. Staging buffers and the DRAM cache live in separate segments, so short-lived buffers don't leave holes between long-lived cached objects.
- An object is copied into the DRAM cache on its first read by default (`largeobj.promote-min-hits`). When the cache is full, a cached copy with a low least-frequently-used score is dropped, and the object stays on disk.
- When the disk limit (`largeobj.disk-maxmemory`) or `maxmemory` is reached, a write evicts the least recently used large objects, as long as `maxmemory-policy` is an `allkeys-*` policy. With `noeviction` the write fails with `OOM`.

**Transport.** The RDMA commands use [libfabric](https://ofiwg.github.io/libfabric/). A client opens a session once per connection with `BLOB.RDMA_HELLO`, sending its 
libfabric endpoint address, and the reply lists the server's addresses. After that, `BLOB.RDMA_GET key rkey addr len ...` names regions of client memory the client has 
registered, and the server writes the object straight into them. `BLOB.RDMA_SET` is the reverse. The object bytes never travel on the Valkey connection, which carries 
only the command, the key, the regions and a short reply. The server registers its memory for local access only, and it starts every transfer, so a client cannot read or 
write server memory. The TCP commands, `BLOB.TCP_SET` and `BLOB.TCP_GET`, carry the bytes on the normal connection and work with any client.
RDMA needs a client that implements the libfabric flow and, for the default `EfaDirect` provider, EFA hardware. The `Emulated` provider runs libfabric over TCP sockets for developing RDMA clients, and it is not faster than the TCP commands.

**Integrity.** The server calculates a CRC32C checksum for every stored object. `BLOB.RDMA_SET` can send one, and the server rejects the write if the bytes don't match. 
`BLOB.RDMA_GET` returns the stored checksum along with the length, so the client can check what it received.

## How fast it runs

All numbers here are for the RDMA path over AWS Elastic Fabric Adapter (EFA), in `Tiered` mode.
We have not measured the module over TCP.

The throughput here is limited by the test instances' network card bandwidth and by their storage limits, the local NVMe rating or the EBS bandwidth.
The instance type is an example: on machines with higher bandwidth limits, performance can be well beyond these numbers. [TODO: Consider adding example]

One i8ge.48xlarge server ran the module with a 108 TB disk limit on 16 instance-store NVMe drives striped under XFS. Two c8gn.16xlarge clients drove it with cachecannon 
over EFA. Each client machine used the same `GET` and `SET` connections as the stock Valkey run above (16 each at 1 and 8 MiB, 12 at 32 MiB, 8 at 64 MiB and 4 at 256 and 
500 MiB), so the total is twice that.
Each size ran `GET`s over a 64 GiB hot set and `SET`s of new keys at the same time.
The run first filled the disk to its limit and then ran for 2 hours at the limit, where every `SET` evicts the oldest objects to make room.
The stock Valkey numbers are the ones from the table above, with the same instance types and the same connections per client, over TCP.
Stock Valkey's `GET`s and `SET`s together ran for 5 minutes, and the module's for 2 hours at the disk limit.

Stock Valkey against the module, GET + SET together, with the same connections per client:

![Grouped bar chart of GET and SET combined throughput in Gbps by object size. Stock Valkey: 291 at 1 MiB, 226 at 8 MiB, 218 at 32 MiB, 181 at 64 MiB, 108 at 256 MiB and 105 at 500 MiB. The module: 372, 399, 389, 378, 372 and 372.](throughput_stock_vs_module.svg)

| Object size | Stock Valkey total (Gbps) | Module total (Gbps) | Module / stock | GET p99, stock / module | SET p99, stock / module | PING p99, stock / module |
| --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 290.8 | 372.2 | 1.3x | 2.6 ms / 2.10 ms | 4.6 ms / 2.75 ms | 2.1 ms / 0.23 ms |
| 8 MiB | 225.6 | 399.3 | 1.8x | 20 ms / 15.2 ms | 49-50 ms / 16.2 ms | 9.6 ms / 0.23 ms |
| 32 MiB | 217.6 | 388.7 | 1.8x | 73 ms / 37.5 ms | 230-238 ms / 41.2 ms | 15 ms / 0.36 ms |
| 64 MiB | 181.0 | 377.9 | 2.1x | 106-114 ms / 54.5 ms | 323-325 ms / 56.1 ms | 17 ms / 0.35 ms |
| 256 MiB | 107.6 | 372.3 | 3.5x | 440-453 ms / 101 ms | 392-394 ms / 105 ms | 26 ms / 0.33 ms |
| 500 MiB | 104.8 | 371.9 | 3.5x | 1.3-1.4 s / 193 ms | 0.7-1.2 s / 195 ms | 34 ms / 0.32 ms |

- With reads and writes together, the module moved 1.8x to 3.5x the throughput of stock Valkey from 8 MiB up, and 1.3x at 1 MiB. Its total stayed between 372 and 399 Gbps at every size, while stock Valkey's fell from 291 Gbps at 1 MiB to 105 Gbps at 500 MiB.
- A `PING` from a separate client waited at most 0.36 ms at p99 with the module, against 2.1-34 ms with stock Valkey.
- The module evicted between 319 thousand (500 MiB) and 131 million (1 MiB) objects at the limit [validate], and rejected no `SET` at any size.
- The module node held 108 TB (about 98 TiB) on NVMe, against 640 GiB of DRAM for stock Valkey.
- In a separate 3-minute test, `GET`s read straight from NVMe (cache off) reached 215-216 Gbps, the same ceiling that cache hits from DRAM reach. `SET`s reached 193 Gbps. [validate]
- The module ran over RDMA on a separate test bed and stock Valkey ran over TCP, so the table compares whole setups, not one variable.

## Try it

```bash
git clone https://github.com/valkey-io/valkey-large-object
cd valkey-large-object
cargo build --release      # target/release/libvalkey_large_object.so
```

The build needs libfabric 2.0 or later with development files, `clang` and `libclang-dev`.
Then start Valkey in `Tiered` mode.
This is the command we used for the benchmark on an i8ge.48xlarge, with its 16 NVMe drives striped under XFS and mounted at `/mnt/bigobj-data`.
Size the disk and staging settings for your own hardware.

```bash
valkey-server \
  --port 6379 --save '' --appendonly no \
  --maxmemory-policy allkeys-lru \
  --loadmodule ./target/release/libvalkey_large_object.so \
  --largeobj.operating-mode Tiered \
  --largeobj.disk-dir /mnt/bigobj-data/lo \
  --largeobj.segment-size 1073741824 \
  --largeobj.disk-staging-size 17179869184 \
  --largeobj.disk-maxmemory 108000000000000 \
  --largeobj.fabric-provider EfaDirect
```

`maxmemory` is not set here. The DRAM cache grows in 1 GiB segments as needed, up to `maxmemory` when it is set.

The RDMA commands need a client that registers its memory with libfabric and follows the flow in the [RDMA overview](https://github.com/valkey-io/valkey-large-object/blob/main/docs/COMMANDS.md#rdma-overview).
Valkey GLIDE's Python sync client supports them from `valkey-glide-sync` 2.6.0.
The module also includes TCP variants of the commands for storing and retrieval.
You can refer to the [command reference](https://github.com/valkey-io/valkey-large-object/blob/main/docs/COMMANDS.md) and [getting started guide](https://github.com/valkey-io/valkey-large-object/blob/main/docs/GETTING_STARTED.md).

The module is open source and release 0.1 is available.
File issues and pull requests at [valkey-io/valkey-large-object](https://github.com/valkey-io/valkey-large-object).
