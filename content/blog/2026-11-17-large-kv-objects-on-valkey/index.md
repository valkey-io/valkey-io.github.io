+++
title = "Large KV objects on Valkey: 400 Gbps and 108 TB from a single node"
date = 2026-11-17 01:01:01
description = "KV cache values are tens to hundreds of megabytes, and stock Valkey is built for a few hundred bytes. The Valkey Large Object module stores them outside the heap, moves them over RDMA, and tiers them to NVMe: one node moved about 400 Gbps with its 108 TB disk full."
authors = ["karthiksubbarao", "cnuthalapati"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-03.webp"
+++

When an LLM serves a long prompt, it builds a large working memory called the KV cache.
Saving that memory outside the GPU lets the next request skip the work of rebuilding it.
[KV caching on Valkey](/blog/kv-caching-on-valkey/) showed what a shared Valkey tier does for a GPU fleet, and ended on the work still ahead: handling large KV objects and improving the network transport.
This post covers that work.
Each saved piece of KV cache is tens to hundreds of megabytes, and a general-purpose cache isn't built for values that big.
The open-source Valkey Large Object module is.
This post explains the problem, what the module does, how fast it runs, and how to try it.

## 1. Why KV cache values strain a datastore

### What the KV cache is

A language model reads your prompt one token at a time.
For every token, at every layer, it computes two vectors, a key and a value, that later tokens use to decide what to pay attention to.
Those saved vectors are the KV cache: the model's working memory of the prompt so far.

If the cache is lost, the model has to recompute it from the whole prompt before it can answer.
For a long prompt that's seconds of GPU time, and the time to first token (TTFT) suffers.
If the cache is kept, a later request that starts with the same text, such as a shared system prompt, a long document, or an earlier turn of the conversation, loads it and skips the work.

GPU memory is too small to keep every cache.
Tools like [LMCache](https://github.com/LMCache/LMCache) move caches out of the GPU, first to CPU memory and then to a shared store that any GPU server can read.
Valkey can be that store.

### How big one cached piece gets

LMCache splits a prompt into chunks of 256 tokens (its default) and stores each chunk as one object.
The size depends on the model.
Per token, the cache holds `2 (key and value) x layers x KV heads x head size x 2 bytes`.

| Model | Cache per token | One 256-token chunk | Per GPU at tensor-parallel 8 |
| --- | --- | --- | --- |
| Llama 3.1 8B | 128 KiB | 32 MiB | not needed |
| Llama 3.1 70B | 320 KiB | 80 MiB | 10 MiB |
| Llama 3.1 405B | 504 KiB | 126 MiB | 15.75 MiB |

These are computed from the published model configurations (405B: 126 layers, 8 KV heads, head size 128, 16-bit values).
A 405B prompt of 131,072 tokens is 63 GiB of KV cache in 512 chunks.
A 10,000-token prompt is 4.8 GiB.
So a cache hit means moving many objects of 10 to 130 MiB each, quickly.

### How stock Valkey handles values this size

Valkey is built for small values, typically a few hundred bytes.
Out of the box a string value is capped at 512 MB (`proto-max-bulk-len`; a `SET` of 512 MiB plus one byte returns `invalid bulk length`), a command's own work, such as storing a value, runs on the main thread while other clients wait, and every byte goes through the TCP stack and the server's network buffers.

We measured stock Valkey (commit `c86f6ee51`) over TCP, with every value in DRAM, on the same workload as the module test in section 3.5: GETs over a 64 GiB hot set plus SETs of new keys from a billion-key space, so memory fills and every `SET` then evicts.
A separate connection sent one `PING` every 10 ms to show how long an unrelated small command waits.
The figures are the last 10 minutes of about 15 at the memory limit; the setup is in the first appendix.

| Object size | `GET` only (Gbps) | `SET` only, at memory limit (Gbps) | `GET` and `SET` together, at memory limit (Gbps) | `GET` p50 / p99 | `SET` p50 / p99 | `PING` p99 / max | Module, same mixed test at disk limit (Gbps) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 207.8 | 199-211 | 310.7 | 2.6 / 6.0 ms | 6.7 / 21 ms | 218 / 670 ms | 348-386 |
| 8 MiB | 207.9 | 119 | 218.2 | 42 / 60 ms | 122 / 213 ms | 36 / 268 ms | 402.1-403.3 |
| 32 MiB | 207.9 | 116 | 210.4 | 186 / 232 ms | 426 ms / 1.03 s | 50 / 287 ms | 369.0-371.8 |
| 64 MiB | 208.0 | 111 | 184.8 | 237 / 290 ms | 395 ms / 0.94 s | 55 / 283 ms | 372.1-373.2 |
| 256 MiB | 128 | 72-76 | 150.8 | 329 / 420 ms | 608 ms / 1.28 s | 50 / 104 ms | 367.5-368.2 |
| 500 MiB | 141 | 71-75 | 142.6 | 698 / 902 ms | 1.1-1.3 / 2.2-2.4 s | 71 / 149 ms | 367.0-367.8 |

- **Reads and writes together:** stock Valkey moved 39-57% of the module's throughput from 8 MiB up (218 against 402 Gbps at 8 MiB, 143 against 367 Gbps at 500 MiB), and 311 against 348-386 Gbps at 1 MiB.
  Reads alone hit the hosts' TCP ceiling of about 208 Gbps up to 64 MiB.
  Writes alone held 111-119 Gbps at the limit from 8 to 64 MiB and 72-76 Gbps at 256 and 500 MiB.
- **Other clients wait:** a `PING` took 36-218 ms at p99 and up to 670 ms, against 0.05 ms when idle, because the main thread ran at 99.8-99.9% CPU copying values.
  With the module, `PING` took 0.39-2.3 ms at p99 and never more than about 4.3 ms.
- **Capacity:** stock Valkey held 640 GiB in DRAM before evicting; the module node held 108 TB on NVMe.

The module ran on a separate test bed with the same layout (one server, two clients) and RDMA instead of TCP, so the two columns compare whole setups, not one variable.
The appendices explain why 1 MiB writes speed up once memory fills; we haven't explained the 6.3% `GET` misses at 1 MiB or the 10% drift at 256 and 500 MiB.

### How LMCache copes today

LMCache's Valkey adapter stores each chunk as one key, whose name is built from the model, the GPU rank, and a hash of the chunk's tokens.
Its documentation puts the chunk at roughly 10 MB for a 70B model at tensor-parallel 8, which matches the table above.
It uses the Valkey GLIDE client in a copy-reduced mode so that a multi-megabyte value isn't copied again in the client.

That leaves the server side as the limit: values go through the socket and the main thread, and each `GET` or `SET` competes with every other client for the main thread.

## 2. What the Large Object Module changes

The module adds a value type built for objects this large, as a single Valkey module (`libvalkey_large_object.so`) written in Rust.
Each object is one Valkey key, whatever its size.
The bytes live outside the Valkey heap, in large pre-registered memory segments or in one file per object on local NVMe, and the keyspace holds only a small descriptor (an object ID, the length and a CRC32C checksum), so nothing is split across keys.
A `GET` or `SET` blocks only the client that sent it: the module hands the transfer to its own background I/O threads while the Valkey main thread keeps serving everyone else.
Data moves in chunks of 1 MiB by default, so a 256 MiB value never needs a 256 MiB buffer in one piece; while one node moved about 256 Gbps of 256 MiB reads and writes, a `PING` from a separate client took 0.08 ms at the median, 0.23 ms at p99 and never more than 0.5 ms.
Over RDMA (Elastic Fabric Adapter, EFA, on AWS), the client sends a small command that describes its memory, and the server moves the bytes straight between its registered buffers and that memory, GPU memory included, without passing through the socket or the Valkey reply buffer; the same commands also work over plain TCP for development.
In `Tiered` mode every object is written to NVMe and DRAM acts as a read cache: an object moves to DRAM on its first read, the coldest cached copies are dropped when DRAM reaches the server's `maxmemory`, and once the disk reaches its configured limit each new write evicts the least recently used objects, so the node keeps accepting new KV cache at full disk.
In `Dram` mode objects live only in memory.
A write can carry a CRC32C, and every read returns the object's length and checksum, so the client can verify what landed in GPU memory.

### The commands

| Command | What it does |
| --- | --- |
| `BLOB.RDMA_HELLO <client_rdma_addr_hex>` | Opens an RDMA session for this connection |
| `BLOB.RDMA_SET key total_len [CRC crc32c] rkey addr len ...` | The server reads the value from the client's memory by RDMA |
| `BLOB.RDMA_GET key rkey addr len ...` | The server writes the value into the client's memory by RDMA and replies `[len, crc32c]` |
| `BLOB.TCP_SET key <data>` / `BLOB.TCP_GET key` | The same over plain TCP |
| `BLOB.INFO key [LEN\|CRC\|TIER]` | Object metadata |
| `DEL key` | Standard Valkey delete; frees the object's disk and memory |

### The main settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `operating-mode` | `Dram` | `Dram` (memory only) or `Tiered` (NVMe with a DRAM read cache) |
| `disk-dir` | none | Directory for object files; required in Tiered mode |
| `disk-maxmemory` | 0 (no limit) | Disk space limit; at the limit, writes evict the oldest objects |
| `segment-size` | 1 GiB | Size of each DRAM pool and disk staging segment; 1 MiB to 1 GiB, at least twice `chunk-size` |
| `disk-staging-size` | 1 GiB | DRAM buffer for disk reads and writes |
| `max-object-size` | 512 MiB | Largest value accepted. In Dram mode an object must fit in one segment |
| `max-promote-size` | 256 MiB | Largest object promoted from NVMe to DRAM; 0 turns promotion off |
| `chunk-size` | 1 MiB | Unit of streaming I/O |
| `fabric-provider` | `EfaDirect` | `EfaDirect` (EFA RDMA) or `Emulated` (libfabric over TCP, runs anywhere) |
| `promote-min-hits` | 1 | Reads before an object is promoted from NVMe to DRAM |

The full list is in the [README](https://github.com/valkey-io/valkey-large-object#configuration).

## 3. Results and how to reproduce them

### 3.1 How we tested

Sections 3.2 to 3.4 come from GPU tests: real models served by vLLM with LMCache, on p6-b300.48xlarge and p6-b200.48xlarge servers (8 GPUs each).
LMCache keeps KV cache in GPU memory, then in host memory, then in a shared tier that every GPU server can read.
LMCache calls that shared tier the L2.
In most runs the L2 was one self-managed Valkey node running the module on a separate server, reached over RDMA (EFA).
We compared it against the same servers with no L2, with a Valkey cluster running on the GPU servers themselves, with LMCache's own tier on each server's local NVMe, with Lustre, and with an object store.

We ran two kinds of GPU test, and each answers a different question.

- **One request at a time.** Server A gets a new prompt, computes it, and stores its KV cache in the L2.
  Then server B gets the same prompt and loads the KV cache instead of computing it.
  Nothing else runs on either server, so this is the best case for one load.
  It answers: how much sooner does one user see the first token?
  The result is the TTFT cut, 1 minus (TTFT with the load) / (TTFT with the compute).
  The test repo calls these "isolated pairs".
- **Many users at once.** An hour of real agent sessions (multi-turn conversations from a public agent trace, or the GitHub Copilot coding agent trace) is replayed at a fixed number of concurrent sessions per server: 16, 32, 64 and more.
  It answers: how many users can one server carry, and at what cost?
  The results are requests served per hour, TTFT percentiles, and how many sessions fit within a TTFT limit.
  The test repo calls these "load tests".
  They follow the AgentX method.

Read every number in 3.2 to 3.4 with these limits in mind:

- Each result is one run.
  The only repeats are runs with the two servers swapped, which matched within 1-2%.
- The Valkey node ran a pre-release build with TLS on and encryption at rest off.
  Encryption at rest slows the first read of an object (one 6.16 MB object took 3.8 ms with it on, 1.3 ms with it off), so a node with it on will show smaller cuts.
  On Qwen3-235B we estimated about 2 points less at 200K-262K tokens (83% against 85%).
- The runs follow the AgentX method but are not certified AgentX submissions.
- Cost per million tokens counts the GPU servers only, not the Valkey node.

### 3.2 Does a cache hit make the first token faster?

These are one-request-at-a-time results on 2 x p6-b300.48xlarge, with self-managed Valkey as the L2.
Each cell is the median TTFT cut for 20 prompts in that length range.
DeepSeek-V4-Pro ran on 4 GPUs per copy (TP4) with lean reads: LMCache's `--separate-object-groups` flag, which makes each load read only the bytes that hit needs.
Hy4-preview-FP8 ran on 8 GPUs (TP8).

| Prompt length | DeepSeek-V4-Pro | Hy4-preview-FP8 |
| --- | --- | --- |
| 10K-20K tokens | 77.9% | 87.8% |
| 30K-40K | 87.9% | 91.5% |
| 50K-60K | 89.9% | 92.7% |
| 90K-100K | 91.9% | 93.5% |
| 200K-500K | 94.8% | 95.0% |
| 500K-1M | 96.3% | 96.5% |

The cut grows with prompt length because compute time grows with the prompt, while a load is mostly a transfer plus a small fixed cost.
For Hy4-preview, a 500K-1M token prompt took a median 148 s to compute and 5.2 s to load.
The two models differ in KV size, compute cost and GPU count, so read the columns as two separate measurements, not a ranking.

Short prompts gain too.
For Hy4-preview, loading beat computing at every length tested from 512 to 32K tokens, in two runs that agreed within about 3%:

| Prompt tokens (median) | Compute | Load from self-managed Valkey |
| --- | --- | --- |
| 733 | 0.145 s | 0.121 s |
| 3,112 | 0.412 s | 0.148 s |
| 12,731 | 1.482 s | 0.281 s |
| 22,895 | 2.682 s | 0.405 s |

In the DeepSeek-V4-Pro run with the default layout and Valkey on the GPU servers (3.4), the L2 read was fast enough that copying the loaded KV cache from host memory into GPU memory took 36-53% of the hit time, the largest part from 20K tokens up.
On one model with a compressed KV format (Kimi K2.7) that copy ran about 4 times slower on 7 of its 8 GPUs, because LMCache issues many small copies.
We have not measured the fix yet, so it is not in these numbers.

### 3.3 Does it let the same servers carry more users?

These are many-users-at-once results for Hy4-preview-FP8 on one p6-b300.48xlarge per setting, replaying one hour of a public agent trace.
Each row compares a server with self-managed Valkey as the L2 against a server with only GPU and host memory (204 GB).

| Concurrent sessions per server | Requests served, with self-managed Valkey | Without | Difference |
| --- | --- | --- | --- |
| 16 | 1,124 | 1,133 | same |
| 24 | 1,567 | 1,520 | +3% |
| 32 | 2,163 | 1,960 | +10% (+13% with the servers swapped) |
| 48 | 2,441 | 1,100 | 2.2x |
| 64 | 2,484 | 998 | 2.5x (repeated with the servers swapped); $1.05 against $2.83 per million tokens |
| 96 | 2,298 | 884 | 2.6x; $1.19 against $3.66 per million tokens |

The reason shows in the cache share.
At 64 sessions, 93% of prompt tokens came from cache with self-managed Valkey, against 54% without, because host memory alone can't hold every session's history.
Each miss means computing the prompt again, and the queue grows.

Both settings miss the AgentX 6 s p99 TTFT limit at every session count we tried from 4 to 32, because the first turn of each session is uncached and long.
Both also miss the 175 ms p99 limit per output token from 24 sessions up.
So this table measures throughput and cost, not whether a server stays within the latency limits.
At 128 sessions both broke down: about 15% of requests failed in each, when they waited longer than LMCache's 300 s read-lock lifetime.

Against a latency target, on the GitHub Copilot trace with Hy4-preview, one server held 48 sessions with 95.6% of requests within 30 s TTFT with self-managed Valkey.
Without it, 48 sessions reached only 45.7%, and the server passed at 40 sessions (92.3%).

**Where it does not help.** A shared tier costs a transfer for every hit.
When GPU and host memory already hold the working set, that cost is pure overhead.
At 16 sessions both settings served the same requests.
On one model that stores 65,536 bytes of KV cache per token, the server without self-managed Valkey passed the 6 s p99 TTFT limit at 32 sessions, while the one with self-managed Valkey failed it.
The node wasn't the limit: it answered about 1,200 large-object commands per second at about 2 ms each.
LMCache's transfer workers spent about 13 ms per 2 MB object inside the server, against 3.2 ms for the same client running alone.
Larger LMCache chunks (2,048 tokens instead of 256) raised that model's load rate from 2.7 to 9.9 GB/s.

### 3.4 Where should the cache live?

Sections 3.2 and 3.3 used one self-managed Valkey node on a separate server.
Here are the alternatives, each with what we measured.

| Option | Speed of one load | Shared between servers | Survives a server failure | Extra cost |
| --- | --- | --- | --- | --- |
| Self-managed Valkey on a separate node | Baseline | Yes | Yes | A separate node |
| Valkey on the GPU servers | Faster with LMCache's default layout, the same with lean reads | Yes, if the servers form one cluster | No: a shard dies with its server | None beyond the GPU servers |
| LMCache's own tier on each server's NVMe | Not measured one request at a time | No | No | None |
| Lustre | Same as self-managed Valkey, up to 32K tokens | Yes | Yes | A file system |
| Other object stores | About 2.7x slower than self-managed Valkey | Yes | Yes | Storage and requests |

We have no measured dollar figures for any option.
The extra-cost column says what has to be paid for beyond the GPU servers, not a measured saving.

**Valkey on the GPU servers against remote Valkey: speed**

We repeated the DeepSeek-V4-Pro run with a Valkey 9.1.2 cluster running the module on the two GPU servers themselves (one primary each, disk-backed, TLS off, no replicas, no persistence).
About half the reads were local.
The separate self-managed Valkey node had TLS on.

| LMCache read layout | Self-managed Valkey on a separate node, cut at 30K-50K | Valkey on the GPU servers, cut at 30K-50K |
| --- | --- | --- |
| Default (96,411 bytes per hit token) | 72.3-73.1% | 78.0-78.8% |
| Lean reads | 87.9-89.0% | 87.8-89.3% |

With the default layout, the cluster on the GPU servers read about twice as fast (43-48 GB/s against 21-23 GB/s), and the cut rose 3 to 6 points.
With lean reads the two land within 0.4 points in every length range, because the L2 read is only 6-13% of a lean hit.
Once LMCache reads fewer bytes, a faster L2 stops helping one request.
Valkey on the GPU servers also shares CPU, memory, disk and the network adapter with inference.
We did not test that contention under load.

**Lustre and object stores: speed**

On 2 x p6-b200.48xlarge (Hy4-preview-FP8, TP8), three runs used the same 36 one-request-at-a-time prompts from 512 to 32K tokens within 95 minutes.
Every prompt in each run was a full read from the tier.

| Prompt tokens (median) | Compute | Self-managed Valkey load | Lustre load | Object store load |
| --- | --- | --- | --- | --- |
| 733 | 0.151 s | 0.118 s | 0.116 s | 0.305 s |
| 3,112 | 0.427 s | 0.140 s | 0.130 s | 0.340 s |
| 12,731 | 1.536 s | 0.267 s | 0.255 s | 0.685 s |
| 22,895 | 2.766 s | 0.389 s | 0.365 s | 1.049 s |
| Read rate at 22,895 tokens |  | 3.16 GB/s | 3.39 GB/s | 1.16 GB/s |

For one read at a time up to 32K tokens, self-managed Valkey and Lustre perform the same, and both cut median TTFT by about 86% at 22,895 tokens.
The object store loaded about 2.7 times slower and beat computing only above about 1,560 tokens.
We have no many-users-at-once result for Lustre: the one run we tried was voided when the GPU server's vLLM engine hung, and Lustre response times in the logs looked normal up to that point.

**Sharing and failover**

One-request-at-a-time tests can't show sharing or failover, because nothing else runs and no server fails.
These many-users-at-once tests can.

| Test | Shared tier | Each server on its own | What it shows |
| --- | --- | --- | --- |
| 5 x p6-b300, Hy4-preview, sessions pinned to servers by a load balancer, 30 s TTFT target | 240 sessions met the target | 160 sessions, each server with its own local NVMe tier | 1.5x the sessions on the same servers. The likely reason, not measured on its own, is that a prefix stored by one server is read by another |
| 2 x p6-b200, Hy4-preview, one server stopped and restarted empty | 63.3% of requests within 30 s while it was down | 36.1%, with no L2 | The surviving server reads the stopped server's prefixes |
| Same test, the first request of each session moved to the surviving server | median 4.6 s | median 23.3 s | A moved session doesn't compute its history again |

Without self-managed Valkey, the share of requests within 30 s took 17 minutes to return to 90% after the failure, against 0 minutes with it.

When a session stays on one server and nothing fails, a local tier on that server holds the same prefixes a shared tier does, and serves the same requests.
The gain from sharing comes when a session's next request lands on another server, when the router moves it, or when a server restarts.

In simulation (KVTrace, not measured on GPUs), a fleet sharing one tier gained more as it grew on a coding trace whose sessions share content: up to 26% more tier reads at 3 and 4 servers than per-server scaling predicts.

### 3.5 The module on its own, without a GPU

These tests measure what one node running the module can move, with plain client load and no GPU in the loop.

**Setup.** One i8ge.48xlarge server running Valkey with the module (Tiered mode, 108 TB disk limit, 16 instance-store NVMe drives striped under XFS), and two c8gn.16xlarge clients driving load with cachecannon over EFA RDMA.
Bandwidth is the server's own byte counters.

**Reads and writes on their own.** With each operation run alone for 3 minutes, GETs reached 215-216 Gbps from NVMe and 204-216 Gbps from DRAM, so the disk tier doesn't cost read bandwidth, and SETs reached 193 Gbps.

**Reads and writes together, with the disk full.** A cache that fills up has to keep accepting writes.
Each size ran GETs over a 64 GiB hot set and SETs of new keys at the same time, first filling the disk to its 108 TB limit and then running 2 hours at the limit, where every `SET` evicts the oldest objects to make room.

| Size | `GET` / `SET` connections per client | Fill (Gbps) | At the disk limit (Gbps) | `GET` + `SET` at the limit (Gbps) | Evictions | Rejected SETs | Client errors | `GET` p50 / p99 | `SET` p50 / p99 | `PING` p50 / p99 / max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 48 / 64 | 397.6 | 348-386 | 209 + 178 | 131.2M | 0 | 0 | 3.9 / 6.5 ms | 5.7-5.8 / 10.8-11.0 ms | 0.24 / 2.3 / ~4.3 ms |
| 8 MiB | 48 / 64 | 403.5 | 402.1-403.3 | 211 + 193 | 21.2M | 0 | 0 | 30.4 / 37.2 ms | 44.6 / 51.9 ms | 0.29 / 0.42 / 2.83 ms |
| 32 MiB | 48 / 64 | 372.4 | 369.0-371.8 | 177 + 193 | 5.38M | 0 | 122 `SET` timeouts, all in one second | 144 / 168 ms | 178-179 / 192 ms | 0.37 / 0.42 / 2.51 ms |
| 64 MiB | 24 / 32 | 371.3 | 372.1-373.2 | 180 + 193 | 2.70M | 0 | 0 | 144 / 158 ms | 178-179 / 186 ms | 0.35 / 0.40 / 1.85 ms |
| 256 MiB | 8 / 8 | 368.0 | 367.5-368.2 | 195 + 180 | 613k | 0 | 0 | 185 / 199 ms | 190 / 203 ms | 0.34 / 0.39 / 0.79 ms |
| 500 MiB | 8 / 8 | 367.7 | 367.0-367.8 | 190 + 182 | 319k | 0 | 0 | 367 / 388 ms | 365 / 384 ms | 0.34 / 0.40 / 0.62 ms |

- **The node kept serving reads and writes at full speed with the disk full.** At the limit it moved 348-403 Gbps, split roughly evenly between `GET` and `SET`, and no `SET` was rejected at any size.
- **Other clients didn't wait.** A `PING` from a separate client took 0.24-0.37 ms at the median and never more than about 4.3 ms.
  No event on the Valkey main thread took over 100 ms under load.
- **The clients weren't the limit.** They were about 50% idle under load.
- **A repeat run matched.** `GET` and `SET` throughput in a second run landed within about 6% of these at every size.
- At 1 MiB the node loses up to 12% at the limit.
  That's the filesystem waiting to reuse space that was just freed, which shows up when about 18,000 files are deleted and created every second.
  From 8 MiB up there's no dip.
- At 32 MiB, 122 SETs hit the client's 1-second timeout in a single second.
  We haven't found the cause.

### 3.6 Run it yourself

- **Module benchmark script:** `bench.sh` and [BENCHMARK.md](https://github.com/valkey-io/valkey-large-object/blob/main/BENCHMARK.md) in the module repository.

## 4. Getting started and contributing

### Build and start the module

```bash
git clone https://github.com/valkey-io/valkey-large-object.git
cd valkey-large-object
cargo build --release          # produces target/release/libvalkey_large_object.so

valkey-server --port 6379 --maxmemory 64gb --maxmemory-policy allkeys-lru \
  --loadmodule ./target/release/libvalkey_large_object.so \
  --largeobj.operating-mode Tiered \
  --largeobj.disk-dir /mnt/nvme-data \
  --largeobj.disk-maxmemory 10240gb \
  --largeobj.fabric-provider EfaDirect
```

- Set each module setting by its full name, `--largeobj.<setting>`, the way you would in `valkey.conf`.
  Valkey checks each value against the setting's allowed range.
  Sizes accept memory notation such as `64gb`, up to `gb`.
- `--maxmemory` bounds the module's DRAM cache.
  With 0, it grows without limit.
- `--maxmemory-policy allkeys-lru` lets writes evict the oldest objects when the disk reaches `disk-maxmemory`.

### Point LMCache at it

You need `valkey-glide-sync` 2.6.0 or later (the first release with RDMA) and libfabric 2.4 or later on the client (the EFA installer provides it on AWS).
Use LMCache from the `dev` branch; no LMCache release includes the RDMA transport yet.
Then start the LMCache server with `--no-l1-use-lazy`, so its whole memory arena is allocated before the workers register it with EFA, and add the adapter:

```bash
--l2-adapter '{
    "type": "valkey",
    "transport": "rdma",
    "startup_nodes": "kv.internal:6379",
    "num_workers": 8
}'
```

To try it without EFA, run the module in `Dram` mode with `--largeobj.fabric-provider Emulated --largeobj.fabric-interfaces lo`, and add `"rdma_provider": "tcp"` to the adapter config.

### Known limits

- **A restart loses the data.** The module doesn't write objects to RDB or AOF, and it doesn't replicate them.
  Treat the tier as a cache: after a restart or a failover, LMCache recomputes.
- **Each object lives on one node.** LMCache can spread keys across a Valkey Cluster, but there's no copy of an object on a second node.
- **A missing value is a cache miss.** If a key was evicted or never written, LMCache recomputes that chunk.
- **RDMA registration limit.** Each LMCache worker registers its whole memory arena with EFA, so the number of workers times the arena size must fit the card's limit on registered memory, 384 GiB on c8gn instances.
- **Versions:** LMCache `dev` (no release yet), `valkey-glide-sync` 2.6.0 or later, libfabric 2.4 or later.

### Where to help

- Replication of large objects to replicas
- Persistence across restarts
- Object IDs that stay unique across cluster nodes (today each node numbers its objects on its own, and two nodes can produce the same ID)
- Higher write throughput for very large values when they are being read from DRAM
- More client integrations beyond LMCache

---

## Appendix: stock Valkey on the same workload, full results

These are the per-phase results behind the stock Valkey table in section 1.

**Setup**

- Machines: one server and two clients on a separate test bed from the module runs (osstest2).
  The hosts' TCP ceiling, measured with iperf3, is about 208-212 Gbps (see the TCP-limit appendix).
- Server: Valkey commit `c86f6ee51`, no module loaded, started under `numactl --cpunodebind=0 --membind=0` with `maxmemory 640gb` (687,194,767,360 bytes), `maxmemory-policy allkeys-lru`, `io-threads 8` and `latency-monitor-threshold 100`.
- Clients: cachecannon commit `1f55756` on both clients, 16 threads, pipeline depth 1, 5-second warm-up, 10-second request timeout.
- Keys: GETs read a 64 GiB hot set (65,536 / object size in MiB keys).
  SETs write new keys of 17 bytes drawn uniformly from 1,000,000,000 keys, so they never overwrite.
- Connections per client: `GET` 48 and `SET` 64 at 1, 8 and 32 MiB; `GET` 24 and `SET` 32 at 64 MiB; `GET` 8 and `SET` 8 at 256 and 500 MiB.
- Order per size, largest size first: prefill the hot set and run 60 s of GETs to warm it; `GET` only for 90 s; flush; `SET` only for 60 s from empty; prefill and warm again; `GET` and `SET` together for 20 minutes, which fills memory in 1-3 minutes and then runs at the limit.
- Server throughput comes from `INFO` sampled every 10 s on the server.
  Request rates and latencies come from the two clients.
- `PING` probe: a separate connection from client 1 sends one `PING` every 10 ms during each phase and records each round trip.
  With no load a `PING` takes 0.04-0.05 ms.
  In a 90-second A/B at 1 MiB, `GET` throughput was 207.8 Gbps with and without the probe, so the probe adds no measurable load.
- Errors: 0 client errors and 0 timeouts in every phase.

**`GET` only** (90 s, every `GET` a hit)

| Size | Server (Gbps) | Requests/s, both clients | `GET` p50 | `GET` p99 | `GET` max | `PING` p50 / p99 / max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 207.8 | 24.8K | 2.6-3.9 ms | 8.9-9.9 ms | 11-46 ms | 0.18 / 0.52 / 1.4 ms |
| 8 MiB | 207.9 | 3.1K | 21 ms | 94-141 ms | 268-279 ms | 0.18 / 0.93 / 31.9 ms |
| 32 MiB | 207.9 | 774 | 78-103 ms | 470-489 ms | 0.81-1.12 s | 2.79 / 5.57 / 39.9 ms |
| 64 MiB | 208.0 | 386 | 103 ms | 325-344 ms | 526-763 ms | 0.19 / 1.97 / 3.3 ms |
| 256 MiB | 128 | 58 | 228-229 ms | 562-587 ms | 705-721 ms | 0.07 / 3.71 / 6.3 ms |
| 500 MiB | 141 | 32 | 440-459 ms | 625-700 ms | 797-805 ms | 0.23 / 1.17 / 14.8 ms |

Where a cell shows a range, the two clients differed.
At 256 and 500 MiB, 16 connections in total aren't enough to fill the link at these latencies.

**`SET` only** (60 s from empty, new keys)

| Size | Server before the limit (Gbps) | Server at the limit (Gbps) | Evictions/s at the limit | Requests/s, both clients | `SET` p50 | `SET` p99 | `SET` max | `PING` p50 / p99 / max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | 124 | 199-211 | 21.7K-25.1K | 19.8K | 3.2 ms | 36 ms | 1.67-3.34 s | 1.73 / 218 / 447 ms |
| 8 MiB | 128 | 119-120 | 1.7K-1.8K | 1.8K | 66 ms | 154-157 ms | 482-575 ms | 6.53 / 12.1 / 224 ms |
| 32 MiB | 130 | 116-118 | 431-439 | 458 | 255-257 ms | 709-717 ms | 1.28-1.48 s | 10.6 / 27.8 / 265 ms |
| 64 MiB | 126-132 | 111-118 | 134-207 | 224 | 271-273 ms | 537-545 ms | 1.23-1.28 s | 8.88 / 31.8 / 225 ms |
| 256 MiB | 124-127 | 72-76 | 32-34 | 45 | 233-348 ms | 830-877 ms | 0.99-1.17 s | 0.38 / 23.6 / 41.8 ms |
| 500 MiB | 130 | 71-75 | 17-18 | 25 | 501-510 ms | 1.14-1.46 s | 1.42-1.82 s | 2.14 / 32.2 / 99.1 ms |

Memory filled after 40-50 s at every size, so each run spent its last 10-20 s at the limit.

**`GET` and `SET` together** (20 minutes; figures for the last 10 minutes, at the memory limit)

| Size | Server while filling (Gbps) | Server at the limit: `GET` + `SET` = total (Gbps) | Evictions/s | `GET` p50 / p99 | `SET` p50 / p99 / max | `PING` p50 / p99 / max | Over 10 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 MiB | about 214 | 167.9 + 142.7 = 310.7 | 17,006 | 2.6 / 6.0 ms | 6.7 / 21 ms / 2.84 s | 2.11 / 218 / 670 ms | 2.2% |
| 8 MiB | 218-231 | 151.8 + 66.4 = 218.2 | 989 | 42 / 60 ms | 122 / 211-214 / 545 ms | 29.5 / 35.8 / 268 ms | 100% |
| 32 MiB | 205-218 | 136.9 + 73.5 = 210.4 | 274 | 185-187 / 231-233 ms | 422-430 ms / 1.01-1.05 s / 3.47 s | 35.1 / 49.7 / 287 ms | 100% |
| 64 MiB | 180-195 | 107.7 + 77.1 = 184.8 | 144 | 237-238 / 287-292 ms | 392-398 / 889-994 ms / 3.77 s | 29.1 / 55.5 / 283 ms | 100% |
| 256 MiB | about 166 | 100.1 + 50.6 = 150.8 | 23 | 325-333 / 409-432 ms | 608 ms / 1.28 s / 1.69 s | 6.59 / 50.4 / 104 ms | 44% |
| 500 MiB | about 159 | 92.3 + 50.2 = 142.6 | 12 | 696-700 / 898-906 ms | 1.09-1.27 / 2.20-2.37 / 7.45 s | 5.38 / 71.4 / 149 ms | 25% |

- `GET` hit rate was 100% at 8, 256 and 500 MiB, 99.8% at 32 MiB, 97.8% at 64 MiB and 93.7% at 1 MiB.
  A miss means LRU evicted a hot-set key, and it returns a short reply.
- The Valkey main thread was at 99.8-99.9% CPU at the limit (measured at 8, 32 and 64 MiB).
  The I/O threads also read about 99.9%, but they spin while waiting, so that figure doesn't show how busy they are.
- At the end of the mixed runs `used_memory` sat at the 687 GB limit.
  Resident memory was 545-554 GB (fragmentation ratio 0.80-0.81) from 1 to 256 MiB and 663 GB (ratio 0.98) at 500 MiB.

## Appendix: why stock Valkey writes 1 MiB values faster once memory is full

In the stock Valkey runs of the previous appendix, 1 MiB SETs speed up once memory reaches the limit and eviction starts: `SET` alone goes from about 124 Gbps to 199-211 Gbps, and the mixed run from about 214 to 311 Gbps.
Values of 8 MiB and larger don't speed up.
We traced this to how the memory allocator (jemalloc, bundled with Valkey) handles freed memory, and confirmed it with four `SET`-only tests.

**What happens in Valkey.** For any value of 32 KiB or more, the I/O thread reads the value straight into a buffer sized for it, and that buffer becomes the stored value without a copy.
So the cost of a `SET` is the memory the value lands in.
If that memory has never been used, the kernel must map and zero every 4 KiB page the first time it is written (a page fault).
A 1 MiB value is 256 pages.

**What jemalloc does with freed memory.** When eviction frees a value, jemalloc keeps the pages of a 1 MiB value for reuse (10 seconds by default), and the next `SET` reuses them with no page faults.
Allocations of 8 MiB or more (`oversize_threshold`, default 8 MiB) go to a separate "huge" arena that gives freed memory back to the operating system immediately, so the next `SET` faults in fresh pages again.

**The tests.** Each test ran `SET` only for 120 seconds from an empty server, with the same server and client settings as the stock Valkey appendix.
Only the jemalloc setting changed.
The settings were passed to the server in the `JE_MALLOC_CONF` environment variable.

| Test | Object size | jemalloc setting | `SET` before the limit | `SET` at the limit | Page faults per second, I/O threads: before the limit, then at the limit |
| --- | --- | --- | --- | --- | --- |
| A | 1 MiB | default | 117 Gbps | 210.7 Gbps | 3.6M, then 30-40K |
| B | 1 MiB | `dirty_decay_ms:0,muzzy_decay_ms:0` (freed memory returned at once) | 117 Gbps | 92-106 Gbps | not captured |
| C | 8 MiB | default | 121 Gbps | 110-116 Gbps | 3.7M, then 3.5M |
| D | 8 MiB | `oversize_threshold:0` (no huge arena) | 124 Gbps | 210.8 Gbps | 3.8M, then 60-140K |

- Turning reuse off at 1 MiB (B) removes the speedup.
  Turning reuse on at 8 MiB (D) creates it.
  About 14,000 SETs per second at 256 pages each matches the 3.6M faults per second before the limit.
- 210 Gbps is the TCP ceiling of these hosts (next section), so `SET` reaches the network limit once page faulting stops.
- In every test the Valkey main thread ran at 99.9-100% CPU, and the page faults happened in the I/O threads.
- Not measured: the larger drop at 256 and 500 MiB.
  It probably comes from the huge arena returning memory to the operating system on the main thread, but we haven't tested that.
  We also haven't tested `oversize_threshold:0` on `GET` or mixed runs, or its effect on memory fragmentation.

## Appendix: the TCP limit of the test hosts

The server (i8ge.48xlarge) is rated at 300 Gbps and each client (c8gn.16xlarge) at 200 Gbps.
We measured the TCP ceiling directly with iperf3: 16 server processes, 8 per client, 4 streams each, 1 MiB writes, 20 seconds.

| Direction | Client 1 | Client 2 | Total |
| --- | --- | --- | --- |
| Clients send to server | 104.1 Gbps | 107.5 Gbps | 211.6 Gbps |
| Server sends to clients | 104.3 Gbps | 104.1 Gbps | 208.4 Gbps |

The server's ENA counters (`bw_in_allowance_exceeded`, `bw_out_allowance_exceeded`, `pps_allowance_exceeded`) stayed at 0, so AWS wasn't throttling the instance.
The cause of the 208-212 Gbps ceiling, below the 300 Gbps rating, is not identified.
Stock Valkey `GET` reached 207.8-208.0 Gbps at 1 to 64 MiB, which is this same ceiling.
The module's 367-403 Gbps combined results use RDMA over EFA on a separate test bed and are not bound by this TCP limit.
