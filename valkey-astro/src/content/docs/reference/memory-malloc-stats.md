---
title: "MEMORY MALLOC STATS"
description: "MEMORY MALLOC STATS command reference documentation"
---

The `MEMORY MALLOC-STATS` command provides an internal statistics report from
the memory allocator.

This command is currently implemented only when using **jemalloc** as an
allocator, and evaluates to a benign NOOP for all others.
