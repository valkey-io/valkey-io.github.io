+++
title= "A new hash table"
date= 2025-03-20 00:00:00
description= "Designing a state-of-the art hash table implementation"
authors= [ "zuiderkwast", "SoftlyRaining"]
+++

Valkey is essentially a giant hash table attached to the network. A hash table
is the data structure that maps keys to values. When optimizing for latency, CPU
and memory usage, it's natural to look at the hash table internals. By replacing
the hash table with a different implementation, we have managed to reduce the
memory usage by roughly 20 bytes per key-value pair and improve the latency and
CPU usage by rougly 10% for instances without I/O threading.

Results
-------

Memory usage for keys of length N and value of length M bytes. TBD.

| Version    | Memory usage per key   |
|------------|------------------------|
| Valkey 7.2 | ? bytes                |
| Valkey 8.0 | ? bytes                |
| Valkey 8.1 | ? bytes                |

The benchmarks below were run using a key size of N and a value size of M bytes, without pipelining.

| Command                 | Valkey 7.2 | Valkey 8.0 | Valkey 8.1 |
|-------------------------|------------|------------|------------|
| SET                     | Xµs, Y QPS | ?          | ?          |
| GET                     | Xµs, Y QPS | ?          | ?          |
| ...                     | ...        | ?          | ?          |

The benchmark was run on an xxxx using yyyy, without I/O threads.

Background
----------

The slowest operation when looking up a key-value pair is by far reading from
the main RAM memory. A key point when optimizing a hash table is therefore to
make sure we have as few memory accesses as possible. Ideally, the memory
reading is already in the CPU cache, which is much faster memory that belong to
the CPU.

When optimizing for memory usage, we also want to minimize the number of
allocation and pointers between them, because a pointer is 8 bytes in a 64-bit
system. If we save one pointer per key-value pair, for 100 million keys that's
almost a gigabyte.

When a computer loads some data from the main memory into the CPU cache, it does
so in blocks of one cache line. The cache-line size is 64 bytes on almost all
modern hardware. Recent work on hash tables, such as "Swiss tables", are highly
optimized for cache lines. When looking up a key, if it's not found where you
first look for it (due to a hash collission), then it should ideally be found
within the same cache line. If it is, then it can be found very fast once this
cache line has been loaded into the CPU cache.

Required features
-----------------

Why not use an open-source state-of-the-art hash table implementation such as
Swiss tables? The answer is that we require some specific features, apart from
the basic operations like add, lookup, replace, delete:

* Incremental rehashing, so that when the hashtable is full, we don't freeze the
  server while the table is being resized.

* Scan, a way to iterate over the hash table even if the hash table is resized
  between the iterations. This is important to keep supporting the
  [SCAN](/commands/scan/) command.

* Random element sampling, for commands like [RANDOMKEY](/commands/randomkey/).

These are not standard features, so we could not pick an off-the-shelf hash
table. We had to design one ourselves.

The hash table used until Valkey 8.0, called "dict", has the following memory
layout:

```
+---------+
| dict    |          table
+---------+         +-----+-----+-----+-----+-----+-----+-----
| table 0 --------->|  x  |  x  |  x  |  x  |  x  |  x  | ...
| table 1 |         +-----+-----+--|--+-----+-----+-----+-----
+---------+                        |
                                   v
                             +-----------+         +-------+
                             | dictEntry |    .--->| "FOO" |
                             +-----------+   /     +-------+
                             |    key  -----'
                             |           |         +-------------------+
                             |   value ----------->| serverObject      |
                             |           |         +-------------------+
                             |   next    |         | type, encoding,   |
                             +-----|-----+         | ref-counter, etc. |
                                   |               | "BAR" (embedded)  |
                                   v               +-------------------+
                             +-----------+
                             | dictEntry |
                             +-----------+
                             |    key    |
                             |   value   |
                             |   next    |
                             +-----|-----+
                                   |
                                   v
                                  ...
```

The dict has two tables, called "table 0" and "table 1". Usually only one
exists, but both are used when incremental rehashing is in progress.

It is a chained hash table, so if multiple keys are hashed to the same slot in
the table, their key-value entries form a linked list. That's what the "next"
pointer in the dictEntry is for.

To lookup a key "FOO" and access the value "BAR", Valkey still had to read from
memory four times. If there is a hash collission, it has to follow two more
pointers for each hash collission and thus read twice more from memory (the key
and the next pointer).

In Valkey 8.0, an optimization was made to embed the key ("FOO" in the drawing
above) in the dictEntry, eliminating one pointer and one memory access.

Design
------

In the new hash table designed for Valkey 8.1, the table consists of buckets of
64 bytes, one cache line. Each bucket can store up to seven elements. Keys that
map to the same bucket are all stored in the same bucket. The bucket also has a
metadata section which contains a one byte secondary hash for each key. This is
used for quickly eliminating hash collissions when looking up a key. In this
way, we can avoid comparing the key for a mismatching key, except once in 256.

We eliminated the dictEntry and instead embed key and value in the serverObject,
along with other metadata for the key.

```
+-----------+
| hashtable |        bucket            bucket            bucket
+-----------+       +-----------------+-----------------+-----------------+-----
| table 0  -------->| m x x x x x x x | m x x x x x x x | m x x x x x x x | ...
| table 1   |       +-----------------+-----|-----------+-----------------+-----
+-----------+                               |
                                            v
                               +------------------------+
                               | serverObject           |
                               +------------------------+
                               | type, encoding,        |
                               | ref-counter, etc.      |
                               | "FOO" (embedded key)   |
                               | "BAR" (embedded value) |
                               +------------------------+
```

Assuming the hashtable and the table are already in the CPU cache, looking up
key-value entry now requires only two memory lookups: The bucket and the
serverObject. If there is a hash collission, the object we're looking for is
most likely in the same bucket, so no extra memory access is required.

If a bucket becomes full, the last element slots in the bucket is replaced by a
pointer to a child bucket. A child bucket has the same layout as a regular
bucket, but it's a separate allocation. Child buckets form a chain. There is
some probability of this happening, but long chains are very rare. Most of the
keys are stored in top-level buckets.

```
+-----------+
| hashtable |        bucket            bucket            bucket
+-----------+       +-----------------+-----------------+-----------------+-----
| table 0  -------->| m x x x x x x x | m x x x x x x c | m x x x x x x x | ...
| table 1   |       +-----------------+---------------|-+-----------------+-----
+-----------+                                         |
                                        child bucket  v
                                       +-----------------+
                                       | m x x x x x x c |
                                       +---------------|-+
                                                       |
                                         child bucket  v
                                        +-----------------+
                                        | m x x x x x x x |
                                        +-----------------+
```

Hashes, sets and sorted sets
----------------------------

The nested data types Hashes, Sets and Sorted sets also make use of the new hash
table. The memory usage is reduced by roughly 10-20 bytes per entry. Memory and
latency/throughput results are WIP.

Iterator prefetching
--------------------

Iterating over the elements in a hash table is done in various scenarios, for
example when a Valkey node needs to send all the keys to a newly connected
replica. The iterator functionality is improved by memory prefetching. This
means that when an element is going to be returned to the caller, the bucket and
its elements have already been loaded into CPU cache when the previous bucket
was being iterated. This makes the iterator 3.5 times faster than without
prefetching.