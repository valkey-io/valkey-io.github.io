+++
title = "Large objects ruin the party - Valkey 9 tames them"
date = 2026-08-17
description = "Tail latencies are where promises break. You can have a system that's fast 99% of the time, but that 1% is what users remember."
authors = ["khawaja"]

[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = false
featured_image = "/assets/media/featured/random-05.webp"
+++

Imagine you have a Valkey cluster humming along at 100K requests/second serving 1KB objects. Latency is tight. Then someone started fetching a few 10MB blobs. Ten requests per second. The small object workload fell apart.

10MB items are common in media use cases, like a live origin caching video segments, which is one of the workloads we run at [Momento](https://gomomento.com). We're sensitive to tail latencies in this kind of workload since a p99 spike means buffering for end users. This is particularly problematic in [multi-tenant systems](https://gomomento.com/blog/the-dark-art-of-multi-tenancy/) where one workflow's large items can affect the experience for everyone else.

## The Problem

Our baseline: 100K req/s total of 1KB `GET`s distributed across 256 connections, each pipelining 32 requests. Then we introduced 10 req/s of 10MB `GET`s as background traffic. Just 10 requests per second of large objects.

Here's what happened to the 1KB request latency on Valkey 8.1:

| 1KB Latency | p50 | p90 | p99 | p99.9 | p99.99 | max |
|---|---|---|---|---|---|---|
| 8.1 baseline | 295µs | 352µs | 416µs | 489µs | 578µs | 2.80ms |
| 8.1 + 10MB noise | 289µs | 350µs | 500µs | **26.2ms** | **30.1ms** | **37.2ms** |

p50, p90, and p99 barely moved. But tail latencies exploded. p99.9 went from 489µs to 26.2ms. That's 53x worse. A handful of large object fetches were destroying the experience for everyone else.

But wait. Valkey has I/O threads. We saw [throughput scale nearly linearly](https://gomomento.com/blog/valkey-turns-one-how-the-community-fork-left-redis-in-the-dust/) with I/O thread count. Shouldn't they handle the network traffic without blocking the main thread?

## The Hypothesis

We knew Valkey 9.0 shipped with [reply copy avoidance](https://github.com/valkey-io/valkey/pull/2078). The idea: instead of copying large objects into reply buffers on the main thread with `memcpy`, just pass a pointer reference and let the I/O threads handle the actual data transfer.

If the main thread was blocking on 10MB `memcpy` operations, that would explain why small requests were getting stuck. Remove the copy, remove the block, problem solved. That was the theory.

## How Copy Avoidance Works

Prior to 9.0, returning a large string meant the main thread copied the entire object into a reply buffer with `memcpy` before moving on. Two copies per `GET`:

**BEFORE (Valkey 8.1)**

![Flowchart of the Valkey 8.1 reply path. A 10MB object in the object store is copied by the main thread into the reply buffer with memcpy, making a full 10MB copy, and that buffer is then written to the socket by an I/O thread. Two full copies of the object before it reaches the client.](./copy-avoidance-8.webp)

*Total memory bandwidth: 20MB per `GET`.*

Valkey 9.0 flips the script. Instead of copying 10MB, the main thread writes a 16-byte reference and moves on:

**AFTER (Valkey 9.0)**

![Flowchart of the Valkey 9.0 reply path with copy avoidance. The main thread writes only a 16-byte bulkStrRef into the reply buffer instead of the object itself. An I/O thread builds an iovec from that reference and calls writev, so the 10MB payload travels straight from the object store to the socket along a zero-copy data path, never being copied into the reply buffer.](./copy-avoidance-9.webp)

*Main-thread copy bandwidth: ~0 — just pointer/reference management.*

The reply path builds an `iovec`, a pointer-and-length pair describing one region of memory, aimed straight at `obj->ptr`. It hands an array of them to [`writev()`](https://man7.org/linux/man-pages/man2/writev.2.html), which writes every region to the socket in a single syscall. No copy is performed because the 10MB object clears the size threshold. With I/O threads enabled, the write also moves off the main thread, so the heavy lifting overlaps command execution.

For reference, all of this lives in `networking.c`. [`isCopyAvoidPreferred()`](https://github.com/valkey-io/valkey/blob/df7cdc1d998bcc2f4ab86ac0e8a1c51fa0a7d6c1/src/networking.c#L253) decides whether a reply is eligible, [`_addBulkStrRefToBufferOrList()`](https://github.com/valkey-io/valkey/blob/df7cdc1d998bcc2f4ab86ac0e8a1c51fa0a7d6c1/src/networking.c#L753) writes the reference instead of the bytes, and [`writevToClient()`](https://github.com/valkey-io/valkey/blob/df7cdc1d998bcc2f4ab86ac0e8a1c51fa0a7d6c1/src/networking.c#L2711) performs the gather-write.

## Back to the Party

Would copy avoidance fix the noisy neighbor problem? We ran the mixed workload test on both versions:

| 1KB Latency | p50 | p90 | p99 | p99.9 | p99.99 | max |
|---|---|---|---|---|---|---|
| 8.1 baseline | 295µs | 352µs | 416µs | 489µs | 578µs | 2.80ms |
| 8.1 + 10MB noise | 289µs | 350µs | 500µs | **26.2ms** | **30.1ms** | **37.2ms** |
| 9.0 baseline | 291µs | 346µs | 403µs | 479µs | 557µs | 3.26ms |
| 9.0 + 10MB noise | 295µs | 360µs | 799µs | **3.10ms** | **5.80ms** | **11.9ms** |

In 9.0, the long tail holds up. p99.9 under noise drops from 26.2ms to 3.10ms, and max from 37.2ms to 11.9ms. The main thread isn't blocking on `memcpy`, so small requests keep flowing even when large ones are in flight. There's still a small cost (p99 goes from 403µs to 799µs) but it's marginal.

The party crashers got kicked out. Well, not really. They were ushered to the dance floor where they now play nicely with everyone else.

## The Secret Menu

You don't need to tune the copy avoidance configs to get these gains, though you do need I/O threads enabled (`io-threads` still defaults to 1). The optimization is controlled by three configs that aren't in the default config file. The [secret menu](https://github.com/valkey-io/valkey/blob/df7cdc1d998bcc2f4ab86ac0e8a1c51fa0a7d6c1/src/config.c#L3331), if you will. The defaults are sane:

| Config | Default | Effect |
|---|---|---|
| `min-io-threads-avoid-copy-reply` | 7 | With 7+ I/O threads, always use copy avoidance |
| `min-string-size-avoid-copy-reply` | 16KB | Size threshold in single-threaded mode |
| `min-string-size-avoid-copy-reply-threaded` | 64KB | Size threshold with I/O threads enabled |

The defaults work for most use-cases. But now you know where to look if you want to tune for your specific workload.

This is one of many community-driven optimizations in Valkey. Individually, they're incremental. Together, they compound. I'm excited about upcoming changes like [PR #2976](https://github.com/valkey-io/valkey/pull/2976), which offloads eligible read commands to worker threads in cluster mode, taking the main thread off the read path for those commands.

Large objects are not going away. If anything, they are becoming the common case. A 10MB blob looked like an outlier when we designed this benchmark, but now it describes an inference workload. Teams moving KV cache off the GPU and onto a shared tier will run this same experiment in production, with small reads and multi-megabyte blocks competing for the same main thread. Valkey 9.0 means they get to keep both. The party crashers can stay, and everybody keeps dancing. 🕺

## What to do next

If you are serving large objects out of Valkey today, the path is short. [Upgrade to 9.0](https://download.valkey.io/releases/), enable I/O threads, and re-run your own mixed workload watching p99.9 rather than p99. Start with the defaults values. The configs in the secret menu are there if you need them.

If your results look different from ours, the community wants to hear about it. Bring them to [Slack](https://valkey.io/slack) or the [community page](https://valkey.io/community/).

*Special thanks to [Madelyn Olson](https://www.linkedin.com/in/madelyn-olson-valkey/) for guidance on how parameters work and for technical feedback on benchmark methodology.*
