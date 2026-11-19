+++
title = "Valkey 9.1 Cuts Sorted Set Memory Another 11%"
date = 2026-10-07 01:01:01
description = "See how Valkey’s steady memory optimizations are making large sorted sets smaller, faster, and cheaper to run at scale."
authors = ["khawaja"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
+++

Last fall I [benchmarked Valkey 8.1 against 8.0](https://valkey.io/blog/50-million-zsets/) by pushing 50 million members into a sorted set and watching the memory counters. The result was a 22% reduction in memory and a meaningful bump in throughput, from a minor version upgrade. I closed that post by saying the smallest efficiencies compound into massive savings when you run infrastructure at scale.

Two releases later, I wanted to know whether that was a one-time win or a trend. So I ran the same benchmark again, this time across five versions: 7.2, 8.0, 8.1, 9.0, and the new 9.1. Same tool ([sorted-set-benchmark](https://github.com/momentohq/sorted-set-benchmark)), same workload: 50 million members (`m:{i}`, score `i`) inserted into a single ZSET via pipelined ZADD, ten repetitions per version with a flush in between, official docker images with persistence off, on a Graviton4 r8g.4xlarge.

It's a trend.

## The numbers

| Version | used_memory | Bytes per member | Inserts/sec (median) | Memory vs 8.0 |
|---------|-------------|------------------|----------------------|---------------|
| 7.2     | 4.83 GB     | ~97              | 516k/s               | same          |
| 8.0     | 4.83 GB     | ~97              | 533k/s               | baseline      |
| 8.1     | 3.77 GB     | ~75              | 590k/s               | -22%          |
| 9.0     | 3.77 GB     | ~75              | 571k/s               | -22%          |
| 9.1     | **3.34 GB** | **~67**          | **647k/s**           | **-31%**      |

A few things stand out. The memory numbers are exact, not averaged: all ten runs of every version landed on identical byte counts, with fragmentation at 1.01x throughout, so `used_memory` and RSS tell the same story here. The 8.1 numbers reproduced my original results to the hundredth of a gigabyte, a year later, on different hardware. That kind of determinism made this comparison easy to trust.

And then there's 9.1. Another 11% off the 8.1 footprint, and the fastest insert rate I've measured on this workload. Stacked against 8.0, that's 31% less memory and 21% more throughput for the exact same data. There was no announcement. It's one line in the 9.1.0-rc1 release notes: "Optimize zset memory usage by embedding element in skiplist."

## Where the savings come from

A big part of the 8.1 win came from the redesigned dictionary, which embeds key data in the hash table entry instead of storing a pointer to a separate allocation. The main 9.1 change relevant to this workload applies the same idea to the other half of the sorted set. A ZSET past 128 elements is backed by two structures: a hash table for lookups and a skiplist for ordering. In [PR #2508](https://github.com/valkey-io/valkey/pull/2508), the element string is embedded directly inside the skiplist node instead of hanging off a pointer.

The PR describes the structural saving as 7 bytes per element: an eight-byte pointer removed, one offset byte added. My measured delta against 8.1 is about 8.6 bytes per member. I read the difference as the second-order effect of eliminating a separate allocation per element, and the allocator rounding that went with it, though I haven't isolated that piece. Either way, the direction and rough magnitude line up with the patch.

Pointer-heavy layouts don't just cost memory; every pointer is a potential trip to a different cache line. I'd expect the inline layout to explain some of the throughput gain too, though I'll treat the 647k/s as an end-to-end result rather than proof of a single cause. (A related 9.1 change, [PR #2867](https://github.com/valkey-io/valkey/pull/2867), embeds the skiplist header to cut pointer chasing on queries. I didn't isolate its contribution, and it shouldn't affect the per-member memory math.)

## Why I keep writing about this

At Momento, Valkey remains one of the primary storage engines we operate, and sorted sets are the workhorse behind feeds, rankings, and priority queues, including the Raider.IO leaderboards I wrote about last time. For fleets where ZSET data is what fills the box, a 31% smaller footprint is not a benchmark curiosity. It's fewer nodes, smaller instances, and more headroom for the traffic spike you didn't plan for.

The usual caveats apply: this is one large skiplist-encoded ZSET with short members and integer scores, measured with the allocator's own accounting. Your data shape will land somewhere else. The pattern, though, is what I want to call out. 8.1 embedded the dict key. 9.1 embedded the skiplist element. Careful, unglamorous memory layout work, contributed, reviewed, and shipped release after release. As an operator, this is exactly the kind of release note I care about: boring changes that lower the bill.

The benchmark code is [open source](https://github.com/momentohq/sorted-set-benchmark). Last time I promised you'd be pleasantly surprised if you ran it yourself. The promise still holds; only the numbers got better.
