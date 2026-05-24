---
title: "INFO"
description: "INFO command reference documentation"
---

The `INFO` command returns information and statistics about the server in a
format that is simple to parse by computers and easy to read by humans.

The optional parameter can be used to select a specific section of information:

*   `server`: General information about the Valkey server
*   `clients`: Client connections section
*   `memory`: Memory consumption related information
*   `persistence`: RDB and AOF related information
*   `stats`: General statistics
*   `replication`: primary/replica replication information
*   `cpu`: CPU consumption statistics
*   `commandstats`: Valkey command statistics
*   `latencystats`: Valkey command latency percentile distribution statistics
*   `sentinel`: Valkey Sentinel section (only applicable to Sentinel instances)
*   `cluster`: Valkey Cluster section
*   `modules`: Modules section
*   `keyspace`: Database related statistics
*   `errorstats`: Valkey error statistics

It can also take the following values:

*   `all`: Return all sections (excluding module generated ones)
*   `default`: Return only the default set of sections
*   `everything`: Includes `all` and `modules`

When no parameter is provided, the `default` option is assumed.

```
127.0.0.1:6379> INFO
# Server
redis_version:7.2.4
server_name:valkey
valkey_version:255.255.255
redis_git_sha1:b0d5a0f5
redis_git_dirty:1
redis_build_id:1cadaf78f6168f2d
server_mode:standalone
os:Linux 6.1.0-18-amd64 x86_64
arch_bits:64
monotonic_clock:POSIX clock_gettime
multiplexing_api:epoll
atomicvar_api:c11-builtin
gcc_version:12.2.0
process_id:982599
process_supervised:no
run_id:e0abe2248cad0c6d9cb2445d8e6b73448f567f74
tcp_port:6379
server_time_usec:1714701488527373
uptime_in_seconds:94798
uptime_in_days:1
hz:10
configured_hz:10
lru_clock:3425456
executable:/home/viktor/repos/valkey/src/./valkey-server
config_file:
io_threads_active:0
availability_zone:
listener0:name=tcp,bind=*,bind=-::*,port=6379

# Clients
connected_clients:1
cluster_connections:0
maxclients:10000
client_recent_max_input_buffer:20480
client_recent_max_output_buffer:0
blocked_clients:0
tracking_clients:0
pubsub_clients:0
watching_clients:0
clients_in_timeout_table:0
total_watched_keys:0
total_blocking_keys:0
total_blocking_keys_on_nokey:0
paused_reason:none
paused_actions:none
paused_timeout_milliseconds:0

# Memory
used_memory:4757704
used_memory_human:4.54M
used_memory_rss:13221888
used_memory_rss_human:12.61M
used_memory_peak:4777616
used_memory_peak_human:4.56M
used_memory_peak_perc:99.58%
used_memory_overhead:989344
used_memory_startup:988648
used_memory_dataset:3768360
used_memory_dataset_perc:99.98%
allocator_allocated:4789624
allocator_active:5042176
allocator_resident:9252864
allocator_muzzy:0
total_system_memory:33280372736
total_system_memory_human:30.99G
used_memory_lua:31744
used_memory_vm_eval:31744
used_memory_lua_human:31.00K
used_memory_scripts_eval:0
number_of_cached_scripts:0
number_of_functions:0
number_of_libraries:0
used_memory_vm_functions:33792
used_memory_vm_total:65536
used_memory_vm_total_human:64.00K
used_memory_functions:184
used_memory_scripts:184
used_memory_scripts_human:184B
maxmemory:0
maxmemory_human:0B
maxmemory_policy:noeviction
allocator_frag_ratio:1.05
allocator_frag_bytes:252552
allocator_rss_ratio:1.84
allocator_rss_bytes:4210688
rss_overhead_ratio:1.43
rss_overhead_bytes:3969024
mem_fragmentation_ratio:2.80
mem_fragmentation_bytes:8504448
mem_not_counted_for_evict:0
mem_replication_backlog:0
mem_total_replication_buffers:0
mem_replicas_repl_buffer:0
mem_clients_slaves:0
mem_clients_normal:0
mem_cluster_links:0
mem_aof_buffer:0
mem_allocator:jemalloc-5.3.0
mem_overhead_db_hashtable_rehashing:0
active_defrag_running:0
lazyfree_pending_objects:0
lazyfreed_objects:0

# Persistence
loading:0
async_loading:0
current_cow_peak:0
current_cow_size:0
current_cow_size_age:0
current_fork_perc:0.00
current_save_keys_processed:0
current_save_keys_total:0
rdb_changes_since_last_save:0
rdb_bgsave_in_progress:0
rdb_last_save_time:1714701488
rdb_last_bgsave_status:ok
rdb_last_bgsave_time_sec:0
rdb_current_bgsave_time_sec:-1
rdb_saves:1
rdb_last_cow_size:229376
rdb_last_load_keys_expired:0
rdb_last_load_keys_loaded:0
aof_enabled:0
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_rewrite_time_sec:-1
aof_current_rewrite_time_sec:-1
aof_last_bgrewrite_status:ok
aof_rewrites:0
aof_rewrites_consecutive_failures:0
aof_last_write_status:ok
aof_last_cow_size:0
module_fork_in_progress:0
module_fork_last_cow_size:0

# Stats
total_connections_received:3081
total_commands_processed:3080
instantaneous_ops_per_sec:91
total_net_input_bytes:134722
total_net_output_bytes:686934
total_net_repl_input_bytes:0
total_net_repl_output_bytes:0
instantaneous_input_kbps:4.14
instantaneous_output_kbps:1.55
instantaneous_input_repl_kbps:0.00
instantaneous_output_repl_kbps:0.00
rejected_connections:0
sync_full:0
sync_partial_ok:0
sync_partial_err:0
expired_keys:0
expired_stale_perc:0.00
expired_time_cap_reached_count:0
expire_cycle_cpu_milliseconds:1829
evicted_keys:0
evicted_clients:0
evicted_scripts:0
total_eviction_exceeded_time:0
current_eviction_exceeded_time:0
keyspace_hits:877
keyspace_misses:98
pubsub_channels:0
pubsub_patterns:0
pubsubshard_channels:0
latest_fork_usec:832
total_forks:5
migrate_cached_sockets:0
slave_expires_tracked_keys:0
active_defrag_hits:0
active_defrag_misses:0
active_defrag_key_hits:0
active_defrag_key_misses:0
total_active_defrag_time:0
current_active_defrag_time:0
tracking_total_keys:0
tracking_total_items:0
tracking_total_prefixes:0
unexpected_error_replies:0
total_error_replies:55
dump_payload_sanitizations:0
total_reads_processed:6160
total_writes_processed:3085
io_threaded_reads_processed:0
io_threaded_writes_processed:0
client_query_buffer_limit_disconnections:0
client_output_buffer_limit_disconnections:0
reply_buffer_shrinks:3
reply_buffer_expands:0
eventloop_cycles:710861
eventloop_duration_sum:261482066
eventloop_duration_cmd_sum:4662723
instantaneous_eventloop_cycles_per_sec:283
instantaneous_eventloop_duration_usec:595
acl_access_denied_auth:0
acl_access_denied_cmd:0
acl_access_denied_key:0
acl_access_denied_channel:0
acl_access_denied_tls_cert:0

# Replication
role:master
connected_slaves:0
replicas_waiting_psync:0
master_failover_state:no-failover
master_replid:488d931b7e08f8e091f674ea64480165971a25f1
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:0
second_repl_offset:-1
repl_backlog_active:0
repl_backlog_size:1048576
repl_backlog_first_byte_offset:0
repl_backlog_histlen:0

# CPU
used_cpu_sys:68.476389
used_cpu_user:219.408941
used_cpu_sys_children:0.003157
used_cpu_user_children:0.008264
used_cpu_sys_main_thread:68.478353
used_cpu_user_main_thread:219.404508
used_active_time_main_thread:192.003980

# Modules

# Errorstats
errorstat_ERR:count=55

# Cluster
cluster_enabled:0

# Keyspace
```

## Notes

Please note depending on the version of Valkey some of the fields have been
added or removed. A robust client application should therefore parse the
result of this command by skipping unknown properties, and gracefully handle
missing fields.

Here is the description of fields.


Here is the meaning of all fields in the **server** section:

*   `redis_version`: Redis OSS version this Valkey server is compatible with
*   `valkey_version`: Valkey version number (e.g. 7.2.5)
*   `valkey_release_stage`: The status of the Valkey version: "ga" for generally available versions; "rc1", "rc2", etc. for release candidates; "dev" for development versions. Added in 8.1.
*   `redis_git_sha1`:  Git SHA1
*   `redis_git_dirty`: Git dirty flag
*   `redis_build_id`: The build id
*   `redis_mode`: The server's mode ("standalone", "sentinel" or "cluster")
*   `os`: Operating system hosting the Valkey server
*   `arch_bits`: Architecture (32 or 64 bits)
*   `multiplexing_api`: Event loop mechanism used by Valkey
*   `atomicvar_api`: Atomicvar API used by Valkey
*   `gcc_version`: Version of the GCC compiler used to compile the Valkey server
*   `process_id`: PID of the server process
*   `process_supervised`: Supervised system ("upstart", "systemd", "unknown" or "no")
*   `run_id`: Random value identifying the Valkey server (to be used by Sentinel
     and Cluster)
*   `tcp_port`: TCP/IP listen port
*   `server_time_usec`: Epoch-based system time with microsecond precision
*   `uptime_in_seconds`: Number of seconds since Valkey server start
*   `uptime_in_days`: Same value expressed in days
*   `hz`: The server's current frequency setting
*   `configured_hz`: The server's configured frequency setting
*   `clients_hz`: Current frequency for client maintenance
*   `lru_clock`: Clock incrementing every minute, for LRU management
*   `executable`: The path to the server's executable
*   `config_file`: The path to the config file
*   `io_threads_active`: Flag indicating if I/O threads are active
*   `availability_zone`: Inform Valkey of the Availability zone if running in a cloud environment, see `availability-zone` config for more details. Added in Valkey 8.0.
*   `shutdown_in_milliseconds`: The maximum time remaining for replicas to catch up the replication before completing the shutdown sequence.
    This field is only present during shutdown.

Here is the meaning of all fields in the **clients** section:

*   `connected_clients`: Number of client connections (excluding connections
     from replicas)
*   `cluster_connections`: An approximation of the number of sockets used by the
     cluster's bus
*   `maxclients`: The value of the `maxclients` configuration directive. This is
    the upper limit for the sum of `connected_clients`, `connected_slaves` and
    `cluster_connections`.
*   `client_recent_max_input_buffer`: Biggest input buffer among current client connections
*   `client_recent_max_output_buffer`: Biggest output buffer among current client connections
*   `blocked_clients`: Number of clients pending on a blocking call ([`BLPOP`](blpop.md)),
     [`BRPOP`](brpop.md), [`BRPOPLPUSH`](brpoplpush.md), [`BLMOVE`](blmove.md), [`BZPOPMIN`](bzpopmin.md), [`BZPOPMAX`](bzpopmax.md))
*   `tracking_clients`: Number of clients being tracked ([`CLIENT TRACKING`](client-tracking.md))
*   `pubsub_clients`: Number of clients in pubsub mode ([`SUBSCRIBE`](subscribe.md), [`PSUBSCRIBE`](psubscribe.md), [`SSUBSCRIBE`](ssubscribe.md)). Added in Valkey 8.0
*   `watching_clients`: Number of clients in watching mode ([`WATCH`](watch.md)). Added in Valkey 8.0
*   `clients_in_timeout_table`: Number of clients in the clients timeout table
*   `total_watched_keys`: Number of watched keys. Added in Valkey 8.0.
*   `total_blocking_keys`: Number of blocking keys.
*   `total_blocking_keys_on_nokey`: Number of blocking keys that one or more clients that would like to be unblocked when the key is deleted.
*   `paused_reason`: The current paused reason of the instance: "client_pause" means trigger by [`CLIENT PAUSE`](client-pause.md),
    "shutdown_in_progress", "failover_in_progress" and "none" means no clients are paused. Added in Valkey 8.1.
*   `paused_actions`: The current paused actions of the instance: "all" means all clients are paused,
    "write" means clients executing write commands are paused,
    and "none" means no clients are paused. Added in Valkey 8.1.
*   `paused_timeout_milliseconds`: The remaining time of the paused actions. Added in Valkey 8.1.

Here is the meaning of all fields in the **memory** section:

*   `used_memory`: Total number of bytes allocated by Valkey using its
     allocator (either standard **libc**, **jemalloc**, or an alternative
     allocator such as [**tcmalloc**][hcgcpgp])
*   `used_memory_human`: Human readable representation of previous value
*   `used_memory_rss`: Number of bytes that Valkey allocated as seen by the
     operating system (a.k.a resident set size). This is the number reported by
     tools such as `top(1)` and `ps(1)`
*   `used_memory_rss_human`: Human readable representation of previous value
*   `used_memory_peak`: Peak memory consumed by Valkey (in bytes)
*   `used_memory_peak_human`: Human readable representation of previous value
*   `used_memory_peak_perc`: The percentage of `used_memory_peak` out of
     `used_memory`
*   `used_memory_overhead`: The sum in bytes of all overheads that the server
     allocated for managing its internal data structures
*   `used_memory_startup`: Initial amount of memory consumed by Valkey at startup
     in bytes
*   `used_memory_dataset`: The size in bytes of the dataset
     (`used_memory_overhead` subtracted from `used_memory`)
*   `used_memory_dataset_perc`: The percentage of `used_memory_dataset` out of
     the net memory usage (`used_memory` minus `used_memory_startup`)
*   `total_system_memory`: The total amount of memory that the Valkey host has
*   `total_system_memory_human`: Human readable representation of previous value
*   `used_memory_lua`: Number of bytes used by the Lua engine for EVAL scripts. Deprecated, renamed to `used_memory_vm_eval`
*   `used_memory_vm_eval`: Number of bytes used by the script VM engines for EVAL framework (not part of used_memory).
*   `used_memory_lua_human`: Human readable representation of previous value. Deprecated.
*   `used_memory_scripts_eval`: Number of bytes overhead by the EVAL scripts (part of used_memory).
*   `number_of_cached_scripts`: The number of EVAL scripts cached by the server.
*   `number_of_functions`: The number of functions.
*   `number_of_libraries`: The number of libraries.
*   `used_memory_vm_functions`: Number of bytes used by the script VM engines for Functions framework (not part of used_memory).
*   `used_memory_vm_total`: `used_memory_vm_eval` + `used_memory_vm_functions` (not part of used_memory).
*   `used_memory_vm_total_human`: Human readable representation of previous value.
*   `used_memory_functions`: Number of bytes overhead by Function scripts (part of used_memory).
*   `used_memory_scripts`: `used_memory_scripts_eval` + `used_memory_functions` (part of used_memory).
*   `used_memory_scripts_human`: Human readable representation of previous value
*   `maxmemory`: The value of the `maxmemory` configuration directive
*   `maxmemory_human`: Human readable representation of previous value
*   `maxmemory_policy`: The value of the `maxmemory-policy` configuration
     directive
*   `mem_fragmentation_ratio`: Ratio between `used_memory_rss` and `used_memory`.
    Note that this doesn't only includes fragmentation, but also other process overheads (see the `allocator_*` metrics), and also overheads like code, shared libraries, stack, etc.
*   `mem_fragmentation_bytes`: Delta between `used_memory_rss` and `used_memory`.
    Note that when the total fragmentation bytes is low (few megabytes), a high ratio (e.g. 1.5 and above) is not an indication of an issue.
*   `allocator_frag_ratio:`: Ratio between `allocator_active` and `allocator_allocated`. This is the true (external) fragmentation metric (not `mem_fragmentation_ratio`).
*   `allocator_frag_bytes` Delta between `allocator_active` and `allocator_allocated`. See note about `mem_fragmentation_bytes`.
*   `allocator_rss_ratio`: Ratio between `allocator_resident` and `allocator_active`. This usually indicates pages that the allocator can and probably will soon release back to the OS.
*   `allocator_rss_bytes`: Delta between `allocator_resident` and `allocator_active`
*   `rss_overhead_ratio`: Ratio between `used_memory_rss` (the process RSS) and `allocator_resident`. This includes RSS overheads that are not allocator or heap related.
*   `rss_overhead_bytes`: Delta between `used_memory_rss` (the process RSS) and `allocator_resident`
*   `allocator_allocated`: Total bytes allocated form the allocator, including internal-fragmentation. Normally the same as `used_memory`.
*   `allocator_active`: Total bytes in the allocator active pages, this includes external-fragmentation.
*   `allocator_resident`: Total bytes resident (RSS) in the allocator, this includes pages that can be released to the OS (by [`MEMORY PURGE`](memory-purge.md), or just waiting).
*   `allocator_muzzy`: Total bytes of 'muzzy' memory (RSS) in the allocator. Muzzy memory is memory that has been freed, but not yet fully returned to the operating system. It can be reused immediately when needed or reclaimed by the OS when system pressure increases.
*   `mem_not_counted_for_evict`: Used memory that's not counted for key eviction. This is basically transient replica and AOF buffers.
*   `mem_clients_slaves`: Memory used by replica clients - Replica buffers share memory with the replication backlog, so this field can show 0 when replicas don't trigger an increase of memory usage.
*   `mem_clients_normal`: Memory used by normal clients
*   `mem_cluster_links`: Memory used by links to peers on the cluster bus when cluster mode is enabled.
*   `mem_aof_buffer`: Transient memory used for AOF and AOF rewrite buffers
*   `mem_replication_backlog`: Memory used by replication backlog
*   `mem_total_replication_buffers`: Total memory consumed for replication buffers. Starting with Valkey 9.1, it also includes `mem_replicas_repl_buffer`.
*   `mem_replicas_repl_buffer`: Total memory consumed by the replicas replication buffer on replica side during the dual channel replication. Added in Valkey 9.1.
*   `mem_allocator`: Memory allocator, chosen at compile time.
*   `mem_overhead_db_hashtable_rehashing`: Temporary memory overhead of database dictionaries currently being rehashed - Added in 8.0.
*   `active_defrag_running`: When `activedefrag` is enabled, this indicates whether defragmentation is currently active, and the CPU percentage it intends to utilize.
*   `lazyfree_pending_objects`: The number of objects waiting to be freed (as a
     result of calling [`UNLINK`](unlink.md), or [`FLUSHDB`](flushdb.md) and [`FLUSHALL`](flushall.md) with the **ASYNC**
     option)
*   `lazyfreed_objects`: The number of objects that have been lazy freed.

Ideally, the `used_memory_rss` value should be only slightly higher than
`used_memory`.
When rss >> used, a large difference may mean there is (external) memory fragmentation, which can be evaluated by checking
`allocator_frag_ratio`, `allocator_frag_bytes`.
When used >> rss, it means part of Valkey memory has been swapped off by the
operating system: expect some significant latencies.

Because Valkey does not have control over how its allocations are mapped to
memory pages, high `used_memory_rss` is often the result of a spike in memory
usage.

When Valkey frees memory, the memory is given back to the allocator, and the
allocator may or may not give the memory back to the system. There may be
a discrepancy between the `used_memory` value and memory consumption as
reported by the operating system. It may be due to the fact memory has been
used and released by Valkey, but not given back to the system. The
`used_memory_peak` value is generally useful to check this point.

Additional introspective information about the server's memory can be obtained
by referring to the [`MEMORY STATS`](memory-stats.md) command and the [`MEMORY DOCTOR`](memory-doctor.md).

Here is the meaning of all fields in the **persistence** section:

*   `loading`: Flag indicating if the load of a dump file is on-going
*   `async_loading`: Currently loading replication data-set asynchronously while serving old data. This means `repl-diskless-load` is enabled and set to `swapdb`.
*   `current_cow_peak`: The peak size in bytes of copy-on-write memory
     while a child fork is running
*   `current_cow_size`: The size in bytes of copy-on-write memory
     while a child fork is running
*   `current_cow_size_age`: The age, in seconds, of the `current_cow_size` value.
*   `current_fork_perc`: The percentage of progress of the current fork process. For AOF and RDB forks it is the percentage of `current_save_keys_processed` out of `current_save_keys_total`.
*   `current_save_keys_processed`: Number of keys processed by the current save operation
*   `current_save_keys_total`: Number of keys at the beginning of the current save operation
*   `rdb_changes_since_last_save`: Number of changes since the last RDB file save
*   `rdb_bgsave_in_progress`: Flag indicating a RDB save is on-going, including a diskless replication RDB save
*   `rdb_last_save_time`: Epoch-based timestamp of last successful RDB file save
*   `rdb_last_bgsave_status`: Status of the last RDB file save operation
*   `rdb_last_bgsave_time_sec`: Duration of the last RDB save operation in seconds, including a diskless replication RDB save
*   `rdb_current_bgsave_time_sec`: Duration of the on-going RDB save operation if any, including a diskless replication RDB save
*   `rdb_last_cow_size`: The size in bytes of copy-on-write memory during
     the last RDB save operation
*   `rdb_last_load_keys_expired`: Number of volatile keys deleted during the last RDB loading.
*   `rdb_last_load_keys_loaded`: Number of keys loaded during the last RDB loading.
*   `aof_enabled`: Flag indicating AOF logging is activated
*   `aof_rewrite_in_progress`: Flag indicating a AOF rewrite operation is
     on-going
*   `aof_rewrite_scheduled`: Flag indicating an AOF rewrite operation
     will be scheduled once the on-going RDB save is complete.
*   `aof_last_rewrite_time_sec`: Duration of the last AOF rewrite operation in
     seconds
*   `aof_current_rewrite_time_sec`: Duration of the on-going AOF rewrite
     operation if any
*   `aof_last_bgrewrite_status`: Status of the last AOF rewrite operation
*   `aof_last_write_status`: Status of the last write operation to the AOF
*   `aof_last_cow_size`: The size in bytes of copy-on-write memory during
     the last AOF rewrite operation
*   `module_fork_in_progress`: Flag indicating a module fork is on-going
*   `module_fork_last_cow_size`: The size in bytes of copy-on-write memory
     during the last module fork operation
*   `aof_rewrites`: Number of AOF rewrites performed since startup
*   `rdb_saves`: Number of RDB snapshots performed since startup

`rdb_changes_since_last_save` refers to the number of operations that produced
some kind of changes in the dataset since the last time either [`SAVE`](save.md) or
[`BGSAVE`](bgsave.md) was called.

If AOF is activated, these additional fields will be added:

*   `aof_current_size`: AOF current file size
*   `aof_base_size`: AOF file size on latest startup or rewrite
*   `aof_pending_rewrite`: Flag indicating an AOF rewrite operation
     will be scheduled once the on-going RDB save is complete.
*   `aof_buffer_length`: Size of the AOF buffer
*   `aof_pending_bio_fsync`: Number of fsync pending jobs in background I/O
     queue
*   `aof_delayed_fsync`: Delayed fsync counter

If a load operation is on-going, these additional fields will be added:

*   `loading_start_time`: Epoch-based timestamp of the start of the load
     operation
*   `loading_total_bytes`: Total file size
*   `loading_rdb_used_mem`: The memory usage of the server that had generated
    the RDB file at the time of the file's creation
*   `loading_loaded_bytes`: Number of bytes already loaded
*   `loading_loaded_perc`: Same value expressed as a percentage
*   `loading_eta_seconds`: ETA in seconds for the load to be complete

Here is the meaning of all fields in the **stats** section:

*   `total_connections_received`: Total number of connections accepted by the
     server
*   `total_commands_processed`: Total number of commands processed by the server
*   `instantaneous_ops_per_sec`: Number of commands processed per second
*   `total_net_input_bytes`: The total number of bytes read from the network
*   `total_net_output_bytes`: The total number of bytes written to the network
*   `total_net_repl_input_bytes`: The total number of bytes read from the network for replication purposes
*   `total_net_repl_output_bytes`: The total number of bytes written to the network for replication purposes
*   `instantaneous_input_kbps`: The network's read rate per second in KB/sec
*   `instantaneous_output_kbps`: The network's write rate per second in KB/sec
*   `instantaneous_input_repl_kbps`: The network's read rate per second in KB/sec for replication purposes
*   `instantaneous_output_repl_kbps`: The network's write rate per second in KB/sec for replication purposes
*   `rejected_connections`: Number of connections rejected because of
     `maxclients` limit
*   `sync_full`: The number of full resyncs with replicas
*   `sync_partial_ok`: The number of accepted partial resync requests
*   `sync_partial_err`: The number of denied partial resync requests
*   `expired_keys`: Total number of key expiration events
*   `expired_stale_perc`: The percentage of keys probably expired
*   `expired_time_cap_reached_count`: The count of times that active expiry cycles have stopped early
*   `expire_cycle_cpu_milliseconds`: The cumulative amount of time spent on active expiry cycles
*   `evicted_keys`: Number of evicted keys due to `maxmemory` limit
*   `evicted_clients`: Number of evicted clients due to `maxmemory-clients` limit.
*   `evicted_scripts`: Number of evicted EVAL scripts due to LRU policy, see [`EVAL`](eval.md) for more details. Added in Valkey 8.0.
*   `total_eviction_exceeded_time`:  Total time `used_memory` was greater than `maxmemory` since server startup, in milliseconds
*   `current_eviction_exceeded_time`: The time passed since `used_memory` last rose above `maxmemory`, in milliseconds
*   `keyspace_hits`: Number of successful lookup of keys in the main dictionary
*   `keyspace_misses`: Number of failed lookup of keys in the main dictionary
*   `pubsub_channels`: Global number of pub/sub channels with client
     subscriptions
*   `pubsub_patterns`: Global number of pub/sub pattern with client
     subscriptions
*   `pubsubshard_channels`: Global number of pub/sub shard channels with client subscriptions.
*   `latest_fork_usec`: Duration of the latest fork operation in microseconds
*   `total_forks`: Total number of fork operations since the server start
*   `migrate_cached_sockets`: The number of sockets open for `MIGRATE` purposes
*   `slave_expires_tracked_keys`: The number of keys tracked for expiry purposes
     (applicable only to writable replicas)
*   `active_defrag_hits`: Number of value reallocations performed by active the
     defragmentation process
*   `active_defrag_misses`: Number of aborted value reallocations started by the
     active defragmentation process
*   `active_defrag_key_hits`: Number of keys that were actively defragmented
*   `active_defrag_key_misses`: Number of keys that were skipped by the active
     defragmentation process
*   `total_active_defrag_time`: Total time memory fragmentation was over the limit, in milliseconds
*   `current_active_defrag_time`: The time passed since memory fragmentation last was over the limit, in milliseconds
*   `tracking_total_keys`: Number of keys being tracked by the server
*   `tracking_total_items`: Number of items, that is the sum of clients number for
     each key, that are being tracked
*   `tracking_total_prefixes`: Number of tracked prefixes in server's prefix table
    (only applicable for broadcast mode)
*   `unexpected_error_replies`: Number of unexpected error replies, that are types
    of errors from an AOF load or replication
*   `total_error_replies`: Total number of issued error replies, that is the sum of
    rejected commands (errors prior command execution) and
    failed commands (errors within the command execution)
*   `dump_payload_sanitizations`: Total number of dump payload deep integrity validations (see `sanitize-dump-payload` config).
*   `total_reads_processed`: Total number of read events processed
*   `total_writes_processed`: Total number of write events processed
*   `io_threaded_reads_processed`: Number of read events processed by the I/O threads.
*   `io_threaded_writes_processed`: Number of write events processed by the I/O threads.
*   `io_threaded_total_prefetch_batches`: Indicate how many prefetch batches were executed in order to prefetch keys before executing commands.
*   `io_threaded_total_prefetch_entries`: The total number of dict entries that were prefetched. Each batch can contain multiple entries, the ratio entries/batches indicates how many entries were prefetched per batch on average.
*   `io_threaded_poll_processed`: Total poll system calls performed by the I/O threads.
*   `io_threaded_freed_objects`: The total number of objects freed by the I/O threads.
*   `client_query_buffer_limit_disconnections`: Total number of disconnections due to client reaching query buffer limit
*   `client_output_buffer_limit_disconnections`: Total number of disconnections due to client reaching output buffer limit
*   `reply_buffer_shrinks`: Total number of output buffer shrinks
*   `reply_buffer_expands`: Total number of output buffer expands
*   `eventloop_cycles`: Total number of eventloop cycles
*   `eventloop_duration_sum`: Total time spent in the eventloop in microseconds (including I/O and command processing)
*   `eventloop_duration_cmd_sum`: Total time spent on executing commands in microseconds
*   `instantaneous_eventloop_cycles_per_sec`: Number of eventloop cycles per second
*   `instantaneous_eventloop_duration_usec`: Average time spent in a single eventloop cycle in microseconds
*   `acl_access_denied_auth`: Number of authentication failures
*   `acl_access_denied_cmd`: Number of commands rejected because of access denied to the command
*   `acl_access_denied_key`: Number of commands rejected because of access denied to a key
*   `acl_access_denied_channel`: Number of commands rejected because of access denied to a channel 
*   `acl_access_denied_tls_cert`: Number of failed authentications using automatic TLS clients authentication feature. Added in Valkey 9.0.

Here is the meaning of all fields in the **replication** section:

*   `role`: Value is "master" if the instance is replica of no one, or "slave" if the instance is a replica of some primary instance.
     Note that a replica can be primary of another replica (chained replication).
*   `replicas_waiting_psync`: The number of replicas waiting for partial resynchronization during the dual-channel replication. Added in Valkey 8.0.
*   `master_failover_state`: The state of an ongoing failover, if any.
*   `master_replid`: The replication ID of the Valkey server.
*   `master_replid2`: The secondary replication ID, used for PSYNC after a failover.
*   `master_repl_offset`: The server's current replication offset
*   `second_repl_offset`: The offset up to which replication IDs are accepted
*   `repl_backlog_active`: Flag indicating replication backlog is active
*   `repl_backlog_size`: The value of the replication backlog buffer `repl-backlog-size` configuration item
*   `repl_backlog_first_byte_offset`: Replication "primary offset" of first byte in the replication backlog buffer
*   `repl_backlog_histlen`: Size in bytes of the data in the replication backlog
     buffer

If the instance is a replica, these additional fields are provided:

*   `master_host`: Host or IP address of the primary
*   `master_port`: Primary listening TCP port
*   `master_link_status`: Status of the link (up/down)
*   `master_last_io_seconds_ago`: Number of seconds since the last interaction
     with primary
*   `master_sync_in_progress`: Indicate the primary is syncing to the replica
*   `slave_read_repl_offset`: The read replication offset of the replica instance.
*   `slave_repl_offset`: The replication offset of the replica instance
*   `replicas_repl_buffer_size`: Currently accumulated replication stream data in bytes during the dual-channel replication. Added in Valkey 8.0.
*   `replicas_repl_buffer_peak`: Peak number of bytes accumulated replication stream data during the lifetime of this instance. Added in Valkey 8.0.
*   `slave_priority`: The priority of the instance as a candidate for failover
*   `slave_read_only`: Flag indicating if the replica is read-only
*   `replica_announced`: Flag indicating if the replica is announced by Sentinel.

If a SYNC operation is on-going, these additional fields are provided:

*   `master_sync_total_bytes`: Total number of bytes that need to be
    transferred. this may be 0 when the size is unknown (for example, when
    the `repl-diskless-sync` configuration directive is used)
*   `master_sync_read_bytes`: Number of bytes already transferred
*   `master_sync_left_bytes`: Number of bytes left before syncing is complete
    (may be negative when `master_sync_total_bytes` is 0)
*   `master_sync_perc`: The percentage `master_sync_read_bytes` from
    `master_sync_total_bytes`, or an approximation that uses
    `loading_rdb_used_mem` when `master_sync_total_bytes` is 0
*   `master_sync_last_io_seconds_ago`: Number of seconds since last transfer I/O
     during a SYNC operation

If the link between primary and replica is down, an additional field is provided:

*   `master_link_down_since_seconds`: Number of seconds since the link is down

The following field is always provided:

*   `connected_slaves`: Number of connected replicas

If the server is configured with the `min-replicas-to-write` directive, an additional field is provided:

*   `min_slaves_good_slaves`: Number of replicas currently considered good

For each replica, the following line is added:

*   `slaveXXX:ip=xxx,port=xxx,state=xxx,offset=xxx,lag=xxx,type=xxx`

`state` represents the state of the replica client and can be one of the following strings.

*   `wait_bgsave`: The replica is waiting for the primary to generate the RDB file.
*   `send_bulk`: Primary is sending the RDB file to replica.
*   `online`: RDB file transmitted, sending just updates.
*   `rdb_transmitted`: RDB file transmitted, this state is used for the rdb-channel during dual-channel replication when the RDB transfer is complete but the replica has not yet established its main connection. Added in Valkey 9.1.
*   `bg_transfer`: Main channel of a replica during dual-channel replication. Changes to `online` once sync is complete. Added in Valkey 8.0.

`type` added in Valkey 8.0, represents the type of the replica client and can be one of the following strings.

*   `replica`: Normal replica client.
*   `main-channel`: Main channel of a replica which uses dual-channel replication. Once dual channel replication is complete, the type will become `replica`.
*   `rdb-channel`: RDB channel of a replica which uses dual-channel replication. Once dual channel replication is complete, the replica client will disconnect.

Here is the meaning of all fields in the **cpu** section:

*   `used_cpu_sys`: System CPU consumed by the Valkey server, which is the sum of system CPU consumed by all threads of the server process (main thread and background threads)
*   `used_cpu_user`: User CPU consumed by the Valkey server, which is the sum of user CPU consumed by all threads of the server process (main thread and background threads)
*   `used_cpu_sys_children`: System CPU consumed by the background processes
*   `used_cpu_user_children`: User CPU consumed by the background processes
*   `used_cpu_sys_main_thread`: System CPU consumed by the Valkey server main thread
*   `used_cpu_user_main_thread`: User CPU consumed by the Valkey server main thread
*   `used_active_time_main_thread`: Clock time the Valkey server main thread has spent on actual work,
    excluding time waiting for work.
*   `used_active_time_io_thread_N` (where *N* is a number from 1 to the configured number of I/O threads):
    Clock time each I/O thread spends doing actual work, excluding time waiting for work.

The fields `used_active_time_main_thread` and `used_active_time_io_thread_N`
were added in Valkey 9.1. They are a better indication than the CPU time metrics
of the spare capacity of each thread, because Valkey uses busy-waiting when I/O
threads are used, which makes the CPU time appear to be near 100% even if the
server has spare capacity for handling more commands.

The active time fields grow linearly with the server load. To understand how to
interpret them, consider this example: If the main thread's used active time
increases 5 seconds between two INFO calls 10 seconds apart, it means the main
thread has spent half of the time executing commands and the other half waiting.
It means that it's running at 50% of its capacity.

The **commandstats** section provides statistics based on the command type,
 including the number of calls that reached command execution (not rejected),
 the total CPU time consumed by these commands, the average CPU consumed
 per command execution, the number of rejected calls
 (errors prior command execution), and the number of failed calls
 (errors within the command execution).

For each command type, the following line is added:

*   `cmdstat_XXX`: `calls=XXX,usec=XXX,usec_per_call=XXX,rejected_calls=XXX,failed_calls=XXX`

The **latencystats** section provides latency percentile distribution statistics based on the command type.

 By default, the exported latency percentiles are the p50, p99, and p999.
 If you need to change the exported percentiles, use `CONFIG SET latency-tracking-info-percentiles "50.0 99.0 99.9"`.

 This section requires the extended latency monitoring feature to be enabled (by default it's enabled).
 If you need to enable it, use [`CONFIG SET latency-tracking yes`](config-set.md).

For each command type, the following line is added:

*   `latency_percentiles_usec_XXX: p<percentile 1>=<percentile 1 value>,p<percentile 2>=<percentile 2 value>,...`

The **errorstats** section enables keeping track of the different errors that occurred within Valkey,
 based upon the reply error prefix ( The first word after the "-", up to the first space. Example: `ERR` ).

For each error type, the following line is added:

*   `errorstat_XXX`: `count=XXX`

The **sentinel** section is only available in Valkey Sentinel instances. It consists of the following fields:

*   `sentinel_masters`: Number of Valkey primaries monitored by this Sentinel instance
*   `sentinel_tilt`: A value of 1 means this sentinel is in TILT mode
*   `sentinel_tilt_since_seconds`: Duration in seconds of current TILT, or -1 if not TILTed.
*   `sentinel_total_tilt`: The number of times this sentinel has been in TILT mode since running. Added in 9.0.
*   `sentinel_running_scripts`: The number of scripts this Sentinel is currently executing
*   `sentinel_scripts_queue_length`: The length of the queue of user scripts that are pending execution
*   `sentinel_simulate_failure_flags`: Flags for the `SENTINEL SIMULATE-FAILURE` command

The **cluster** section currently only contains a unique field:

*   `cluster_enabled`: Indicate Valkey cluster is enabled

The **modules** section contains additional information about loaded modules if the modules provide it. The field part of properties lines in this section is always prefixed with the module's name.

The **keyspace** section provides statistics on the main dictionary of each
database.
The statistics are the number of keys, and the number of keys with an expiration.

For each database, the following line is added:

*   `dbXXX`: `keys=XXX,expires=XXX`

The **debug** section contains experimental metrics, which might change or get removed in future versions.
It won't be included when `INFO` or `INFO ALL` are called, and it is returned only when `INFO DEBUG` is used.

*   `eventloop_duration_aof_sum`: Total time spent on flushing AOF in eventloop in microseconds
*   `eventloop_duration_cron_sum`: Total time consumption of cron in microseconds (including serverCron and beforeSleep, but excluding IO and AOF flushing)
*   `eventloop_duration_max`: The maximal time spent in a single eventloop cycle in microseconds
*   `eventloop_cmd_per_cycle_max`: The maximal number of commands processed in a single eventloop cycle

[hcgcpgp]: http://code.google.com/p/google-perftools/

**A note about the word slave used in this man page**: If not for backward compatibility, the Valkey project no longer uses the words "master" and "slave". Unfortunately in the given commands these words are part of the protocol, so we'll be able to remove such occurrences only when this API will be naturally deprecated.

**Modules generated sections**: Starting with Valkey 6, modules can inject their info into the `INFO` command, these are excluded by default even when the `all` argument is provided (it will include a list of loaded modules but not their generated info fields). To get these you must use either the `modules` argument or `everything`.,
