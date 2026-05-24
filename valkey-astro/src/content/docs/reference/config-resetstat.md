---
title: "CONFIG RESETSTAT"
description: "CONFIG RESETSTAT command reference documentation"
---

Resets the statistics reported by Valkey using the [`INFO`](info.md) and [`LATENCY HISTOGRAM`](latency-histogram.md) commands.

The following is a non-exhaustive list of values that are reset:

* Keyspace hits and misses
* Number of expired keys
* Command and error statistics
* Connections received, rejected and evicted
* Persistence statistics
* Active defragmentation statistics
