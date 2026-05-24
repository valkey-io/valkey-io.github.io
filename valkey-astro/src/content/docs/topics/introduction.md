---
title: Introduction
description: Learn about the Valkey open source project
---

Valkey is an open source (BSD licensed), in-memory __data structure store__ used as a database, cache, message broker, and streaming engine. Valkey provides [data structures](data-types.md) such as
[strings](strings.md), [hashes](hashes.md), [lists](lists.md), [sets](sets.md), [sorted sets](sorted-sets.md) with range queries, [bitmaps](bitmaps.md), [hyperloglogs](hyperloglogs.md), [geospatial indexes](geospatial.md), and [streams](streams-intro.md). Valkey has built-in [replication](replication.md), [Lua scripting](eval-intro.md), [LRU eviction](lru-cache.md), [transactions](transactions.md), and different levels of [on-disk persistence](persistence.md), and provides high availability via [Valkey Sentinel](sentinel.md) and automatic partitioning with [Valkey Cluster](cluster-tutorial.md).

You can run __atomic operations__
on these types, like [appending to a string](../commands/append.md);
[incrementing the value in a hash](../commands/hincrby.md); [pushing an element to a
list](../commands/lpush.md); [computing set intersection](../commands/sinter.md),
[union](../commands/sunion.md) and [difference](../commands/sdiff.md);
or [getting the member with highest ranking in a sorted set](../commands/zrange.md).

To achieve top performance, Valkey works with an
**in-memory dataset**. Depending on your use case, Valkey can persist your data either
by periodically [dumping the dataset to disk](persistence.md#snapshotting)
or by [appending each command to a disk-based log](persistence.md#append-only-file). You can also disable persistence if you just need a feature-rich, networked, in-memory cache.

Valkey supports [asynchronous replication](replication.md), with fast non-blocking synchronization and auto-reconnection with partial resynchronization on net split.

Valkey also includes:

* [Transactions](transactions.md)
* [Pub/Sub](pubsub.md)
* [Lua scripting](../commands/eval.md)
* [Keys with a limited time-to-live](../commands/expire.md)
* [LRU eviction of keys](lru-cache.md)
* [Automatic failover](sentinel.md)

You can use Valkey from most programming languages. See [clients](../clients/).

Valkey is written in **ANSI C 11** with Atomics and a few GCC/Clang built-ins like `__builtin_clz()`.
It works on most POSIX systems like Linux, \*BSD and MacOS, without external dependencies.
Linux and MacOS are the two operating systems where Valkey is developed and tested the most, and we **recommend using Linux for deployment**.
Valkey may work on Solaris-derived systems like Illumos, but support is *best effort*.
Supported hardware includes x86-64 (AKA amd64), x86 (32-bit) and AArch64 (64-bit ARM).
It is also known to work on IBM z/Architecture like s390x and builds for this system are available from the Fedora distro.
There is no official support for Windows builds.
