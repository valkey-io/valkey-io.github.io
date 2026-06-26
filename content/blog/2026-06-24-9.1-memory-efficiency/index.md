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

In a world where speed matters and every byte counts, Valkey 9.1 introduces two behind the scenes optimizations that reduce the per-key memory overhead without requiring any new commands or configuration changes.

These improvements happen deep within Valkey's C data structures, reducing the memory required to store strings and sorted sets, by up to 20% overhead for string keys and 7 bytes for every sorted set member. These changes compound quickly when millions of keys are in use, leading to lower memory usage and better cache efficiency.

This blog explores these changes, why these optimizations were possible, and what they mean for your real-world deployments.

## The Cost of Internal Recordkeeping

In Valkey, the values live inside robj, a C structure Redis Object. This structure represents not only your data, but also metadata, flags, reference counts and a pointer to the actual value. In the case of embstr encoding, the optimized memory encoding for small strings, the string data is immediately allocated after the robj header under the form of a contiguous block of memory instead of having two separate memory allocations (for metadata and string value). Before Valkey 9.1, this was its simplified layout:

[image]

The ptr field points to the string data that follows the header. But because embstr encoding guarantees the string is always contiguous with the header, the pointer's value is fully deterministic — it's always (char *)robj + sizeof(robj). Storing it was redundant.

The ptr field pointed to the string data that followed the header, however the pointer's value was always deterministic due to the embstr encoding guaranteeing that the string is always adjacent to the header, storing this data was redundant.

## 

After the changes in Valkey 9.1 however

[image]

## [Section 3: What to do about it — decision or action]

[Config change, caveat, trade-off table]

## [Conclusion: CTA]

[One sentence takeaway. Link to next step.]

---

[Reference links]