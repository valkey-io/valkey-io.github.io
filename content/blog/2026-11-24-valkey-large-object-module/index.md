+++
title = "Introducing the Valkey Large Object Module: As Fast as Your Hardware"
date = 2026-11-24 01:01:01
description = "The Valkey Large Object module keeps values of tens to hundreds of megabytes off the main thread and streams them in chunks, so a node's throughput follows its network and storage bandwidth, not Valkey's CPU."
authors = ["karthiksubbarao", "kevinmcgehee", "cnuthalapati", "smkher"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/valkey-large-object-module.png"
+++

Large objects show up in a wide range of applications, from video and audio files to, more recently, the KV attention states of large language models (LLMs).
An LLM reads the whole prompt before it answers.
For every token, at every layer, it computes a key vector and a value vector that later tokens use to decide what to pay attention to.
Those saved vectors are the KV cache.
If a later request starts with the same text, such as a shared system prompt, a long document or the earlier turns of a conversation, the inference engine can load the saved KV cache instead of computing it again, which saves GPU time and shortens the time to the first token.

GPU memory is too small to keep every cache, so inference stacks keep them in tiers: GPU memory, then the host's memory, then a shared store that every GPU server can read, managed by tools such as [LMCache](https://github.com/LMCache/LMCache).
Valkey can be that shared store, and a Valkey cluster scales its capacity independently of the GPU servers, as [KV caching on Valkey](https://valkey.io/blog/kv-caching-on-valkey/) shows for a fleet of GPU servers.

LMCache splits a prompt into chunks, 256 tokens by default, and stores each chunk as one object.
The size depends on the model and the chunk size:

| Model | Cache per token | 256-token chunk | 2,048-token chunk | 256-token chunk, per GPU across 8 GPUs | 2,048-token chunk, per GPU across 8 GPUs |
| --- | --- | --- | --- | --- | --- |
| Kimi K2.7-Code (FP8) | 34.3 KiB | 8.6 MiB | 69 MiB | 8.6 MiB | 69 MiB |
| Qwen3-235B-A22B (FP8) | 94 KiB | 23.5 MiB | 188 MiB | 5.9 MiB | 47 MiB |
| Mistral-Medium-3.5-128B (FP8) | 176 KiB | 44 MiB | 352 MiB | 5.5 MiB | 44 MiB |

Larger chunks mean fewer, bigger objects per prompt, and a cache hit has to move many of them quickly.
The [Valkey Large Object module](https://github.com/valkey-io/valkey-large-object) is built for that.
In [our benchmark](#how-fast-it-runs), one node sustained 372 to 399 Gbps of reads and writes at every object size. This allows all the models in the table above to set up distributed KV caching workloads that retrieve KV objects with a median latency under 1 ms for 1 MiB objects and about 10 ms for 32 and 64 MiB objects.
However, the module is not limited to only KV caching: it optimally stores any large binary value.

This is the first of three posts on distributed KV caching with Valkey.
It covers what changes in in-memory key-value datastores when values reach hundreds of megabytes, and how the Valkey Large Object module improves performance for such large objects.

## What changes when values reach hundreds of megabytes

Valkey is built for small values, typically a few hundred bytes.
Commands run on the main thread while other clients wait, and every byte goes through the TCP stack and the server's network buffers.
With small values, the Valkey CPU is typically not the bottleneck as it's able to serve each request quickly.

We measured stock Valkey 9.2.0 over TCP, with every value held in DRAM, on one i8ge.48xlarge (`maxmemory 640gb`, `allkeys-lru`, 8 I/O threads).

Two c8gn.16xlarge clients drove it with [cachecannon](https://github.com/cachecannon/cachecannon) and a 10-second request timeout.
They used the same number of `GET` and `SET` connections per client as the module runs below: 16 each at 1 and 8 MiB, 12 at 32 MiB, 8 at 64 MiB, and 4 at 256 and 500 MiB.

The workload:

- `GET`s read a 64 GiB hot set that was filled beforehand, so almost every `GET` finds its key.
- `SET`s always write new keys, picked from a billion-key space, so none overwrites an existing value.
- The `SET`s first filled memory to the limit. The measurement then ran with the server at the limit, with continuous evictions.
- A separate connection sent a `PING` every 10 ms to show how long an unrelated small command waits.

| Object size | Total Gbps (GET + SET) | GET p50 / p99 | SET p50 / p99 | PING p99 / max | Evictions per second |
| --- | --- | --- | --- | --- | --- |
| 1 MiB | 305.3 (144.5 + 160.8) | 1.00 / 1.55 ms | 1.36 / 3.54 ms | 1.23 / 440 ms | 18,795 |
| 8 MiB | 213.4 (147.9 + 65.5) | 13.8 / 22.3 ms | 32.0 / 52.2 ms | 10.4 / 228 ms | 955 |
| 32 MiB | 201.9 (136.7 + 65.2) | 46.1 / 64.7 ms | 83.4 / 208 ms | 17.4 / 239 ms | 238 |
| 64 MiB | 171.4 (110.2 + 61.2) | 77.1 / 105 ms | 134 / 189 ms | 19.5 / 226 ms | 112 |
| 256 MiB | 94.2 (47.6 + 46.6) | 352 / 396 ms | 373 / 430 ms | 37.6 / 97 ms | 21 |
| 500 MiB | 89.1 (44.1 + 45.0) | 751 / 973 ms | 751 / 830 ms | 48.5 / 253 ms | 11 |

- **Network:** run alone, `GET`s reached the hosts' TCP ceiling of about 208 Gbps up to 32 MiB, so the network is not what limits stock Valkey here.
- **Other clients:** while the server was evicting, a `PING` from another connection took 1.2-48 ms at p99 and up to 440 ms.

## What the module is

The Valkey Large Object module is a Valkey module written in Rust that adds a data type and commands optimized for large binary values.
It needs Valkey 8.0 or later on Linux.

Here is the path of one `GET` or `SET` through the module:

![Request path through the module. A client sends a command to the Valkey main thread, which blocks only that client and hands the transfer to a streaming task. The streaming task moves the object as a window of chunks in parallel, for both SET and GET. Chunks move between two kinds of segment pools, DRAM cache segments (four shown) and disk staging segments (two shown). Each segment has its own talc allocator and is registered with both EFA and io_uring. Bytes cross the network by RDMA directly between those segments and the client's EFA-registered memory. Each segment pool has its own io_uring engine to the object files on XFS: the DRAM cache engine reads objects into the cache, and the staging engine reads and writes them.](request_path.svg)

**Data type.** A Large Object data type holds a small descriptor, not the object's bytes: an object ID, the length and a CRC32C checksum.
The bytes live in the module's segments or in a file, depending on the operating mode.
An object can be up to `largeobj.max-object-size` (512 MiB by default, configurable), and in `Dram` mode it must fit in one segment.
Like a String, this is a single value data type.

**Engine.** Every `GET` and `SET` blocks only the client that issues the command, in every storage and transport mode.
The module moves the data on its own worker threads (8 by default, `largeobj.worker-threads`) while the Valkey main thread keeps serving everyone else.
Objects are streamed in chunks (1 MiB by default, `largeobj.chunk-size`), up to 64 at a time (`largeobj.max-buffers-per-op`), and each chunk moves on as soon as its source has produced it, so network and disk transfers overlap.
In `Tiered` mode the chunks pass through a bounded window of reused staging buffers, so a transfer never allocates the whole object.

**Memory.** Data sent or received over EFA must sit in memory registered with the EFA network card, and registering is too slow to do on every transfer.
So the module allocates memory from Valkey in large segments (1 GiB each by default, `largeobj.segment-size`), which count toward `used_memory` and `maxmemory`, and registers each segment when it is created.
In `Tiered` mode the segments are registered with io_uring as well, for performance, so the kernel pins their pages once instead of on every disk read and write, and one buffer serves the network and the disk without a copy.
Inside each segment, the module's own allocator hands out exact-sized, 4 KiB-aligned slots.
The DRAM cache pool starts with one segment and adds more as it fills, up to `maxmemory`.
In `Dram` mode it holds every object, and in `Tiered` mode it acts as a read cache, next to the fixed-size disk staging segment pool described below.

**Disk.** In `Tiered` mode every object is a file on block storage, such as local NVMe or network-attached block storage like Amazon EBS, and DRAM is a read cache:

- The module expects an XFS file system and Linux 5.1 or later. Files sit in `largeobj.disk-dir`, spread over 1,024 subdirectories by object ID so creates and deletes don't serialize on one directory lock.
- Each segment pool has its own io_uring engine, which runs on its own thread. The engines read and write files with `O_DIRECT`, using registered buffers whenever a segment is io_uring registered. Writes and cache misses pass through the fixed-size disk staging segment pool, which totals `largeobj.disk-staging-size` of DRAM. Staging buffers and the DRAM cache live in separate segment pools, so short-lived staging buffers don't leave holes between long-lived cached objects.
- An object is copied into the DRAM cache on its first read by default (`largeobj.promote-min-hits`). When the cache is full, a cached copy with a low least-frequently-used score is dropped, and the object stays on disk.
- When the disk limit (`largeobj.disk-maxmemory`) or `maxmemory` is reached, a write evicts the least recently used large objects that `maxmemory-policy` allows, as core Valkey does.

**Transport.** The RDMA commands use [libfabric](https://ofiwg.github.io/libfabric/).
A client sends `BLOB.RDMA_HELLO` once per connection with its libfabric endpoint address, and the reply lists the server's addresses.
Each `BLOB.RDMA_GET` or `BLOB.RDMA_SET` then lists one or more remote addresses in the client's registered memory, each with its memory key and length, in one registered region or several, and the server writes to or reads from them directly.
The object bytes never travel on the Valkey TCP connection, which carries only the command and the transfer details.
The server starts every transfer, so a client never gets access to server memory.
`BLOB.TCP_SET` and `BLOB.TCP_GET` carry the bytes on the normal connection and work with any client.
The default `EfaDirect` provider needs EFA hardware.

**Integrity.** `BLOB.RDMA_SET` can send a CRC32C checksum that the server verifies, and `BLOB.RDMA_GET` returns the stored checksum and the length so the client can verify what it received.

## How fast it runs

The module kept 372-399 Gbps of combined `GET` and `SET` throughput at every object size from 1 MiB to 500 MiB, 1.2x to 4.2x stock Valkey, while a `PING` to the same server stayed under 0.36 ms at p99.
These are results from one i8ge.48xlarge server in `Tiered` mode over RDMA with AWS Elastic Fabric Adapter (EFA), measured at the disk limit where every `SET` evicts the oldest objects.

![Grouped bar chart of GET and SET combined throughput in Gbps by object size. Stock Valkey: 305 at 1 MiB, 213 at 8 MiB, 202 at 32 MiB, 171 at 64 MiB, 94 at 256 MiB and 89 at 500 MiB. The module: 372, 399, 389, 378, 372 and 372.](throughput_stock_vs_module.svg)

| Object size | Throughput (Gbps), stock → module | GET p50 (ms), stock → module | GET p99 (ms), stock → module | SET p50 (ms), stock → module | SET p99 (ms), stock → module | PING p99 (ms), stock → module |
| --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 305 → 372 (1.2x) | 1.00 → 1.27 | 1.55 → 2.10 | 1.36 → 1.53 | 3.54 → 2.75 | 1.23 → 0.23 |
| 8 MiB | 213 → 399 (1.9x) | 13.8 → 10.6 | 22.3 → 15.2 | 32.0 → 10.8 | 52.2 → 16.2 | 10.4 → 0.23 |
| 32 MiB | 202 → 389 (1.9x) | 46.1 → 31.5 | 64.7 → 37.5 | 83.4 → 34.3 | 208 → 41.2 | 17.4 → 0.36 |
| 64 MiB | 171 → 378 (2.2x) | 77.1 → 43.8 | 105 → 54.5 | 134 → 45.6 | 189 → 56.1 | 19.5 → 0.35 |
| 256 MiB | 94 → 372 (4.0x) | 352 → 88.6 | 396 → 101 | 373 → 95.4 | 430 → 105 | 37.6 → 0.33 |
| 500 MiB | 89 → 372 (4.2x) | 751 → 178 | 973 → 193 | 751 → 185 | 830 → 195 | 48.5 → 0.32 |

- The module moved 1.9x to 4.2x the throughput of stock Valkey from 8 MiB up, and 1.2x at 1 MiB. Its total stayed between 372 and 399 Gbps at every size, while stock Valkey's fell from 305 Gbps at 1 MiB to 89 Gbps at 500 MiB.
- A `PING` from a separate client waited at most 0.36 ms at p99 with the module, against 1.2-48 ms with stock Valkey.
- From 8 MiB up the module evicted 2.8 to 3.9 times faster than stock Valkey, because it accepted that many more `SET`s, and it rejected none at any size.
- On the same instance type, the module node held 108 TB on NVMe, about 150 times the 640 GiB that stock Valkey held in DRAM.
- With the DRAM cache turned off, so that every `GET` reads from NVMe, `GET`s reached the same 215-216 Gbps as cache hits from DRAM, because the 16 local NVMe drives can read faster than the network can carry. The cache matters when storage is the limit, for example on network-attached block storage, where reads and writes share one bandwidth limit: every `GET` served from DRAM leaves that bandwidth to `SET`s.

How we measured: the server had a 108 TB disk limit on 16 instance-store NVMe drives striped under XFS. Two c8gn.16xlarge clients drove it with [cachecannon](https://github.com/cachecannon/cachecannon) over EFA, using the same per-client `GET` and `SET` connections as the stock run, with `GET`s over a 64 GiB hot set and `SET`s of new keys at the same time. The run filled the disk to its limit first and then ran at the limit. The stock results come from the [earlier section](#what-changes-when-values-reach-hundreds-of-megabytes). These numbers are capped by the test instances' network and storage bandwidth, so machines with higher limits can go further.

At lower concurrency, with the same two clients each running 4 `GET` and 4 `SET` connections at 1 to 32 MiB, 2 and 2 at 64 and 256 MiB, and 1 and 1 at 500 MiB, the module's latency drops further:

| Object size | `GET` p50 / p99 | `SET` p50 / p99 |
| --- | --- | --- |
| 1 MiB | 0.33 / 0.53 ms | 0.51 / 0.76 ms |
| 8 MiB | 2.6 / 3.9 ms | 3.0 / 4.6 ms |
| 32 MiB | 10.4 / 13.7 ms | 11.6 / 15.5 ms |
| 64 MiB | 10.3 / 13.8 ms | 13.0 / 17.7 ms |
| 256 MiB | 41.7 / 49 ms | 51 / 62 ms |
| 500 MiB | 59 / 73 ms | 68 / 82 ms |

## Try it

To read and write your first large object, start with the [getting started guide](https://valkey.io/topics/large-object-getting-started/).
It walks you through building the module and running your first commands.
The [configuration guide](https://valkey.io/topics/large-object-configuration/) covers storage and monitoring settings, and the [use cases](https://valkey.io/topics/large-object-use-cases/) show where else the module fits.

The benchmark above ran with this command, on an i8ge.48xlarge with its 16 NVMe drives striped under XFS:

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

The TCP commands work with any client.
The RDMA commands need a client that implements the libfabric flow; Valkey GLIDE's Python sync client supports them from `valkey-glide-sync` 2.6.0.
The Valkey Large Object module is open source, and [Valkey Large Object 0.1](https://github.com/valkey-io/valkey-large-object/releases/tag/0.1) is available now.
Thanks to everyone who helped build and test the module.

The second post in this series compares Valkey deployments for KV caching, over the network and on the GPU servers themselves, and shows how each performs against object stores and shared file systems.
The third goes deeper into model and inference architectures and how to configure Valkey for your inference setup.
