+++
title = "Reducing Memory Overhead in Valkey 9.1"
date = 2026-06-24
description = "With Valkey 9.1, per-key memory overhead is quietly cut by up to 20% for strings and 7 bytes per sorted set member, without changing a single command or configuration."
authors = ["dragosandriciuc"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
+++

## Reducing Memory Overhead in Valkey 9.1

Valkey 9.1 introduces two behind the scenes optimizations that reduce the per-key memory overhead without requiring any new commands or configuration changes.

The two conceptual changes delivered across three PR's below happen deep within Valkey's C data structures, reducing the memory required to store strings and sorted sets, by up to 20% overhead for string keys and 7 bytes for every sorted set member. These changes compound quickly when millions of keys are in use.

This blog explores these changes, and what they mean for your real-world deployments.

## The Cost of Internal Recordkeeping

In Valkey, the values live inside `robj`, a C structure Redis Object. This structure represents not only your data, but also metadata, flags, reference counts and a pointer to the actual value. In the case of `embstr` encoding, the optimized memory encoding for small strings, the string data is immediately allocated after the `robj` header under the form of a contiguous block of memory instead of having two separate memory allocations (for metadata and string value). The simplified layout before Valkey 9.1:

![embstr memory before](embstr_memory_before_9.1.svg)

The `ptr` field pointed to the string data that followed the header, however the pointer's value was always deterministic due to the `embstr` encoding guaranteeing that the string is always adjacent to the header, storing this data was redundant.

### Eliminating the Redundant Pointer

After the changes in Valkey 9.1, the `ptr` field is removed from the embedded string layout by reusing its 8-byte slot to store the beginning of the embedded string itself. Because the string's location is deterministic, Valkey now computes its address on demand using pointer arithmetic instead of storing an explicit pointer. The new layout looks like this:

![embstr memory after](embstr_memory_after_9.1.svg)

The practical result is that every value stored with `embstr` encoding now saves 8 bytes of overhead. For a workload using 16-byte keys and 16-byte values, this represents roughly a 20% reduction in per-item memory overhead.

### Raising the Embstr Threshold from 64 to 128 Bytes

Removing the above redundant pointer reduced the size of every embedded string object. Because the robj header itself got smaller, this means the same total allocation budget now accommodates more actual string content.

Raising this threshold to 128 bytes (including key, expiry metadata, and value) is additive and this allows the following general benefits:

- fewer allocations per object
- lower overhead
- more workloads benefit automatically

Any key returning `embstr` benefits from both of the above optimizations with no extra configuration required.

### Optimizing Sorted Sets to Reduce Overhead

The final improvement in Valkey 9.1 targets Sorted Sets (ZSETs), where the sets also received a memory reduction for workloads that use the `skiplist` representation.

Once a sorted set grows beyond 128 elements, Valkey stores it internally as a `skiplist`. Before Valkey 9.1, each `skiplist` node contained a pointer to a separately allocated SDS string representing the member:

```txt
+------------------+-------+------------------+---------+-----+---------+
| element pointer  | score | backward pointer | level-0 | ... | level-N |
+------------------+-------+------------------+---------+-----+---------+
        |
        +-------> element SDS
```

In Valkey 9.1 however, the SDS representation is embedded directly inside the `skiplist` node instead of being stored a separate pointer:

```txt
+-------+------------------+---------+-----+---------+--------------+
| score | backward pointer | level-0 | ... | level-N | embedded SDS |
+-------+------------------+---------+-----+---------+--------------+
```

For sorted sets with thousands or millions of members, this compounds significantly. A `ZSET` with 100,000 members saves roughly 700KB (arithmetic estimate) of memory from this change alone. This change produces a net saving of 7 bytes per sorted set member by removing the pointer.

## Quantifying the Impact

The above improvements effectiveness vary by workload, key sizes and data type mixes. However, as a practical reference:

| Change | Affected encoding | Saving per item |
|--------|--------------------|----------------:|
| Remove `robj->ptr` | `embstr` strings | 8 bytes |
| Raise `embstr` threshold to 128 bytes | Strings 65–128 bytes (newly eligible for `embstr`) | 8 bytes (newly applies) |
| Embed element SDS inside skiplist node | ZSET members (skiplist encoding) | 7 bytes |

## What This Means for Production

These improvements are transparent and you do not need to change your configuration, commands, or application code. The savings activate automatically on upgrade to Valkey 9.1.

For clusters that are operating near memory limits, these no configuration required reductions may bring you back into having a comfortable headroom. However the impact is most pronounced for workloads dominated by small strings or large sorted sets.

With Valkey 9.1 available already, this is the right time to re-examine the `MEMORY USAGE` command and baselines on representative keys and compare them against your 9.0 measurements. The differences will tell you exactly what your specific workload reclaimed.

## Key Takeaways

Valkey 9.1 reduces per-key memory overhead through two targeted internal changes. Embstr-encoded strings shed 8 bytes by eliminating a redundant pointer, and the threshold for embstr encoding doubles from 64 to 128 bytes, letting more values benefit from the compact layout. The sorted set skiplist nodes eliminate a separate heap allocation per member, saving 7 bytes each. None of these changes require configuration changes or application modifications, they take effect immediately on upgrade.

[Valkey 9.1 is available now](https://valkey.io/download/releases/v9-1-0/).

## Reference PRs

- [PR 2516 — Remove redundant robj->ptr for embstr encoding](https://github.com/valkey-io/valkey/pull/2516)
- [PR 3397 — Raise embstr threshold from 64 to 128 bytes](https://github.com/valkey-io/valkey/pull/3397)
- [PR 2508 — Embed ele in skiplist node for ZSET members](https://github.com/valkey-io/valkey/pull/2508)
