+++
title = "How Valkey 9.0 reduces the large object noisy neighbor problem"
date = 2026-10-28
description = "A few 10MB requests per second wrecked the tail latency of a 100K req/s workload on Valkey 8.1. Reply copy avoidance in Valkey 9.0 cuts p99.9 from 26.2ms to 3.10ms."
authors = ["khawaja"]

[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = false
featured_image = "/assets/media/featured/random-05.webp"
+++

Imagine you have a Valkey cluster handling 100K requests per second, each serving 1 KB objects. Latency is tight. Then a new workload begins fetching a few 10 MB blobs at ten requests per second. Suddenly, the small-object workload experiences a sharp increase in tail latency.

10MB items are common in media use cases, like a live origin caching video segments, which is [one of the workloads](https://www.gomomento.com/blog/a-new-live-streaming-origin-built-for-global-scale/) we run at [Momento](https://gomomento.com). We're sensitive to tail latencies in this kind of workload since a p99 spike means buffering for end users. This is particularly problematic in [multi-tenant systems](https://gomomento.com/blog/the-dark-art-of-multi-tenancy/) where one workflow's large items can affect the experience for everyone else.

## The Problem

Our baseline: 100K req/s total of 1KB [`GET`](https://valkey.io/commands/get/)s distributed across 256 connections, each pipelining 32 requests. Then we introduced 10 req/s of 10MB `GET`s as background traffic. Just 10 requests per second of large objects.

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

Prior to 9.0, returning a large string meant the main thread copied the entire object into a reply buffer with `memcpy` before moving on. A second copy would then copy the reply out to the network. Two copies per `GET`.

**BEFORE (Valkey 8.1)**

![Flowchart of the Valkey 8.1 reply path. A 10MB object in the object store is copied by the main thread into the reply buffer with memcpy, making a full 10MB copy, and that buffer is then written to the socket by an I/O thread. Two full copies of the object before it reaches the client.](./copy-avoidance-8.webp)

*Main-thread memory bandwidth: 10MB per `GET`.*

Valkey 9.0 flips the script. Instead of copying 10MB, the main thread writes a 16-byte reference and moves on:

**AFTER (Valkey 9.0)**

![Flowchart of the Valkey 9.0 reply path with copy avoidance. Instead of the object itself, the main thread writes only a 16-byte bulkStrRef into the reply buffer. An I/O thread builds an iovec from that reference and calls writev. A dashed line labeled "no reply-buffer copy" runs from the 10MB object in the object store directly to the socket: the payload is sent from where it already lives rather than being staged through the reply buffer.](./copy-avoidance-9.webp)

*Main-thread memory bandwidth: ~0 — just pointer/reference management.*

The reply path builds an `iovec`, a pointer-and-length pair describing one region of memory, aimed straight at the stored object itself. It hands an array of them to [`writev()`](https://man7.org/linux/man-pages/man2/writev.2.html), so the payload never gets copied into Valkey's reply buffer at all. The kernel still copies it to the socket, and [`writevToClient()`](https://github.com/valkey-io/valkey/blob/df7cdc1d998bcc2f4ab86ac0e8a1c51fa0a7d6c1/src/networking.c#L2711) loops over partial writes, yielding after 64KB per event so a single large reply can't monopolize the loop. With I/O threads enabled, that work also moves off the main thread and overlaps command execution.

## The Verdict

Would copy avoidance fix the noisy neighbor problem? We ran the mixed workload test on both versions:

| 1KB Latency | p50 | p90 | p99 | p99.9 | p99.99 | max |
|---|---|---|---|---|---|---|
| 8.1 baseline | 295µs | 352µs | 416µs | 489µs | 578µs | 2.80ms |
| 8.1 + 10MB noise | 289µs | 350µs | 500µs | **26.2ms** | **30.1ms** | **37.2ms** |
| 9.0 baseline | 291µs | 346µs | 403µs | 479µs | 557µs | 3.26ms |
| 9.0 + 10MB noise | 295µs | 360µs | 799µs | **3.10ms** | **5.80ms** | **11.9ms** |

In 9.0, the long tail holds up. p99.9 under noise drops from 26.2ms to 3.10ms, and max from 37.2ms to 11.9ms. The main thread isn't blocking on `memcpy`, so small requests keep flowing even when large ones are in flight.

The noisy neighbors are still there. They just stopped keeping everyone else awake.

## What To Do Next

If you are serving large objects out of Valkey today, the path is short.

[Move to at least Valkey 9.0](https://download.valkey.io/releases/), enable I/O threads, and re-run your own mixed workload watching p99.9 rather than p99.

If your results look different from ours, the community wants to hear about it. Bring them to [Slack](https://valkey.io/slack) or the [community page](https://valkey.io/community/).

*Special thanks to [Madelyn Olson](https://www.linkedin.com/in/madelyn-olson-valkey/) for guidance on how parameters work and for technical feedback on benchmark methodology.*
