---
title: "MEMORY STATS"
description: "MEMORY STATS command reference documentation"
---

The `MEMORY STATS` command returns an @array-reply about the memory usage of the
server.

The information about memory usage is provided as metrics and their respective
values. The following metrics are reported:

*   `peak.allocated`: Peak memory consumed by Valkey in bytes (see `INFO`'s
     `used_memory_peak`)
*   `total.allocated`: Total number of bytes allocated by Valkey using its
     allocator (see [`INFO`](info.md)'s `used_memory`)
*   `startup.allocated`: Initial amount of memory consumed by Valkey at startup
     in bytes (see `INFO`'s `used_memory_startup`)
*   `replication.backlog`: Memory usage by replication backlog (see `INFO`'s `mem_replication_backlog`)
*   `replicas.repl.buffer`: Memory usage by replicas replication buffer (see `INFO`'s `mem_replicas_repl_buffer`). Added in Valkey 9.1.
*   `clients.slaves`: The total size in bytes of all replicas overheads (output
     and query buffers, connection contexts)
*   `clients.normal`: The total size in bytes of all clients overheads (output
     and query buffers, connection contexts)
*   `cluster.links`: Memory usage by cluster links (see `INFO`'s `mem_cluster_links`).
*   `aof.buffer`: The summed size in bytes of AOF related buffers.
*   `lua.caches`: the summed size in bytes of the overheads of the Lua scripts'
     caches
*   `functions.caches`: the summed size in bytes of the overheads of the Function scripts'
     caches
*   `dbXXX`: For each of the server's databases, the overheads of the main and
     expiry dictionaries (`overhead.hashtable.main` and
    `overhead.hashtable.expires`, respectively) are reported in bytes
*   `overhead.db.hashtable.lut`: Total overhead of dictionary buckets in databases (Added in Valkey 8.0)
*   `overhead.db.hashtable.rehashing`: Temporary memory overhead of database dictionaries currently being rehashed (Added in Valkey 8.0) 
*   `overhead.total`: The sum of all overheads, i.e. `startup.allocated`,
     `replication.backlog`, `clients.slaves`, `clients.normal`, `aof.buffer` and
     those of the internal data structures that are used in managing the
     Valkey keyspace (see `INFO`'s `used_memory_overhead`)
*   `db.dict.rehashing.count`: Number of DB dictionaries currently being rehashed (Added in Valkey 8.0)
*   `keys.count`: The total number of keys stored across all databases in the
     server
*   `keys.bytes-per-key`: The ratio between `dataset.bytes` and `keys.count`
*   `dataset.bytes`: The size in bytes of the dataset, i.e. `overhead.total`
     subtracted from `total.allocated` (see `INFO`'s `used_memory_dataset`)
*   `dataset.percentage`: The percentage of `dataset.bytes` out of the total
     memory usage
*   `peak.percentage`: The percentage of `total.allocated` out of
     `peak.allocated`
*   `allocator.allocated`: See `INFO`'s `allocator_allocated`
*   `allocator.active`: See `INFO`'s `allocator_active`
*   `allocator.resident`: See `INFO`'s `allocator_resident`
*   `allocator.muzzy`: See `INFO`'s `allocator_muzzy`
*   `allocator-fragmentation.ratio`: See `INFO`'s `allocator_frag_ratio`
*   `allocator-fragmentation.bytes`: See `INFO`'s `allocator_frag_bytes`
*   `allocator-rss.ratio`: See `INFO`'s `allocator_rss_ratio`
*   `allocator-rss.bytes`: See `INFO`'s `allocator_rss_bytes`
*   `rss-overhead.ratio`: See `INFO`'s `rss_overhead_ratio`
*   `rss-overhead.bytes`: See `INFO`'s `rss_overhead_bytes`
*   `fragmentation`: See `INFO`'s `mem_fragmentation_ratio`
*   `fragmentation.bytes`: See `INFO`'s `mem_fragmentation_bytes`

**A note about the word slave used in this man page**: If not for backward compatibility, the Valkey project no longer uses the words "master" and "slave". Unfortunately in the given commands these words are part of the protocol, so we'll be able to remove such occurrences only when this API will be naturally deprecated.
