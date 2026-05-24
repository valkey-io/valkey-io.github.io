---
title: "Valkey Search - Metrics and configurations"
description: Valkey Search Module INFO SEARCH
---

## Metrics - INFO SEARCH

### search_index_stats

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_number_of_attributes | Count | Total attributes across all search indexes |
| search_number_of_indexes | Count | Total number of search indexes |
| search_total_active_write_threads | Count | Active writer threads (0 if suspended) |
| search_total_indexed_documents | Count | Total documents indexed across all indexes |

### search_indexing

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_background_indexing_status | String | Background indexing status: IN_PROGRESS or NO_ACTIVITY |

### search_memory

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_index_reclaimable_memory | Bytes | Memory reclaimable after vector deletions |
| search_used_memory_bytes | Bytes | Total memory used by the module |
| search_used_memory_human | String | Total memory used by the module (human readable) |

### search_query

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_failure_requests_count | Count | Total failed query requests |
| search_hybrid_requests_count | Count | Hybrid queries (vector and non-vector) |
| search_inline_filtering_requests_count | Count | Queries using inline filtering |
| search_nonvector_requests_count | Count | Exclusively non-vector search queries |
| search_prefiltering_requests_count | Count | Queries using pre-filtering |
| search_result_record_dropped_count | Count | Records dropped when search results exceed limits |
| search_successful_requests_count | Count | Total successful query requests |
| search_vector_requests_count | Count | Query requests that include a vector component |

### search_rdb

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_rdb_load_failure_cnt | Count | Failed RDB load operations |
| search_rdb_load_success_cnt | Count | Successful RDB load operations |
| search_rdb_save_failure_cnt | Count | Failed RDB save operations |
| search_rdb_save_success_cnt | Count | Successful RDB save operations |

### search_string_interning

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_string_interning_store_size | Count | Unique strings in the interning store |

### search_thread-pool

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_query_queue_size | Count | Current reader thread pool queue size |
| search_reader_resumed_cnt | Count | Times the reader thread pool was resumed |
| search_used_read_cpu | Decimal fractions | Average CPU used by reader threads (-1 if unavailable) |
| search_used_write_cpu | Decimal fractions | Average CPU used by writer threads (-1 if unavailable) |
| search_worker_pool_suspend_cnt | Count | Times the worker thread pool was suspended |
| search_writer_queue_size | Count | Current writer thread pool queue size |
| search_writer_resumed_cnt | Count | Times the writer thread pool was resumed |
| search_writer_suspension_expired_cnt | Count | Times writer suspension expired due to timeout |

### search_vector_externing

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_vector_externing_deferred_entry_cnt | Count | Deferred entries in vector externalization |
| search_vector_externing_entry_count | Count | Total entries in the vector externalizer |
| search_vector_externing_generated_value_cnt | Count | Generated values during vector externalization |
| search_vector_externing_hash_extern_errors | Count | Errors during hash externalization |
| search_vector_externing_lru_promote_cnt | Count | LRU promotions in vector externalization |
| search_vector_externing_num_lru_entries | Count | Entries in the vector externalizer LRU cache |

### search_latency

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_flat_vector_index_search_latency_usec | Microseconds | Latency distribution for flat vector index searches |
| search_hnsw_vector_index_search_latency_usec | Microseconds | Latency distribution for HNSW vector index searches |

### search_coordinator

These metrics are only available when cluster mode is enabled.

| Metric Name | Unit | Description |
| :--- | :---: | :--- |
| search_coordinator_bytes_in | Bytes | Total incoming gRPC response bytes from remote nodes |
| search_coordinator_bytes_out | Bytes | Total outgoing gRPC request bytes to remote nodes |
| search_coordinator_client_get_global_metadata_failure_count | Count | Failed client requests to get global metadata |
| search_coordinator_client_get_global_metadata_failure_latency_usec | Microseconds | Latency for failed client metadata requests |
| search_coordinator_client_get_global_metadata_success_count | Count | Successful client requests to get global metadata |
| search_coordinator_client_get_global_metadata_success_latency_usec | Microseconds | Latency for successful client metadata requests |
| search_coordinator_client_search_index_partition_failure_count | Count | Failed client searches on index partitions |
| search_coordinator_client_search_index_partition_failure_latency_usec | Microseconds | Latency for failed partition searches |
| search_coordinator_client_search_index_partition_success_count | Count | Successful client searches on index partitions |
| search_coordinator_client_search_index_partition_success_latency_usec | Microseconds | Latency for successful partition searches |
| search_coordinator_server_get_global_metadata_failure_count | Count | Failed server requests to get global metadata |
| search_coordinator_server_get_global_metadata_success_count | Count | Successful server requests to get global metadata |
| search_coordinator_server_get_global_metadata_failure_latency_usec | Microseconds | Latency for failed server metadata requests |
| search_coordinator_server_get_global_metadata_success_latency_usec | Microseconds | Latency for successful server metadata requests |
| search_coordinator_server_listening_port | Port | Port the coordinator server is listening on |
| search_coordinator_server_search_index_partition_failure_count | Count | Failed server searches on index partitions |
| search_coordinator_server_search_index_partition_failure_latency_usec | Microseconds | Latency for failed server partition searches |
| search_coordinator_server_search_index_partition_success_count | Count | Successful server searches on index partitions |
| search_coordinator_server_search_index_partition_success_latency_usec | Microseconds | Latency for successful server partition searches |
| search_coordinator_threads_cpu_time_sec | Seconds | Cumulative CPU time consumed by coordinator (gRPC) threads |

## Configurations

The search module uses the Valkey configuration mechanism. Thus each of the named configuration below can be set on the `MODULE LODEX` command OR via the `CONFIG SET` command.

| Name | Type | Default Value | Description |
| :--- | :---: | :---: | :--- |
| search.query-string-bytes | Number | 10240 | Maximum allowable length of the query string for FT.SEARCH or FT.AGGREGATE commands |
| search.hnsw-block-size | Number | 10240 | Number of vectors of space to add to HNSW index size when additional space required. |
| search.reader-threads | Number | Physical core count | Reader thread pool size; dynamically resizes pool on modification |
| search.writer-threads | Number | Physical core count | Writer thread pool size; dynamically resizes pool on modification |
| search.utility-threads | Number | 1 | Utility thread pool size; dynamically resizes pool on modification |
| search.max-worker-suspension-secs | Number | 60 | Controls how long the worker thread pool quiescing around a fork. Values > 0 are resumption timeouts if a fork runs too long. Values <=0 mean no quiescing. |
| search.skip-rdb-load | Boolean | false | When enabled, loads index schemas from the RDB but ignores all stored index content. This initializes empty, functional indexes that are then repopulated from the underlying data source. Use this to ensure a clean index state or to recover from corrupted index. |
| search.skip-corrupted-internal-update-entries | Boolean | false | Skip corrupted AOF entries during internal updates. May be useful for recovering from a corrupted AOF file. |
| search.log-level | Enum | from core | Controls module log level verbosity: "debug", "verbose", "notice" or "warning". Default value is to fetch the log level from the core at startup. |
| search.enable-partial-results | Boolean | true | Default option for delivering partial results when errors such as timeout occur. This applies a default behavior on commands which can be explicitly overridden by FT.INFO/FT.SEARCH commands using the SOMESHARDS (for partial results) option and the ALLSHARDS (for complete results) option. |
| search.enable-consistent-results | Boolean | false | Default option for delivering consistent results when errors such as timeout occur. This applies a default behavior on commands which can be explicitly overridden by FT.INFO/FT.SEARCH commands using the CONSISTENT/INCONSISTENT option.|
| search.search-result-background-cleanup | Boolean | false | Enable search result cleanup on background thread |
| search.high-priority-weight | Number | 100 | Fairness for high priority tasks in thread pools [0..100]. |
| search.local-fanout-queue-wait-threshold | Number | 50 | When this value is less than the average read queue wait time (in milliSeconds)  the local node is preferred in a fanout operation. |
| search.thread-pool-wait-time-samples | Number | 100 | Sample queue size for thread pool wait time tracking |
| search.tag-min-prefix-length | Number | 2 | Minimum number of characters required before trailing `*` in TAG wildcard queries (length excludes `*`) |
| search.max-term-expansions | Number | 200 | Maximum number of words to search in text operations (prefix, suffix, fuzzy) to limit memory usage |
| search.search-result-buffer-multiplier | String | 1.5 | Multiplier for search result buffer size to handle rapid data changes. This ensures results are not dropped when concurrent mutations render in-flight data invalid before the response is sent. |
| search.drain-mutation-queue-on-save | Boolean | false | Drain the mutation queue before RDB save. |
| search.query-string-depth | Number | 1000 | Controls the depth of the query string parsing from the FT.SEARCH cmd |
| search.query-string-terms-count | Number | 1000 | Controls the size of the query string parsing from the FT.SEARCH cmd (number of nodes in predicate tree) |
| search.fuzzy-max-distance | Number | 3 | Controls the maximum allowed edit distance for fuzzy search queries |
| search.max-vector-knn | Number | 10000 | Controls the max KNN parameter for vector search |
| search.proximity-inorder-compat-mode | Boolean | false | Enables / disables the overlap violation check logic in Proximity searches when INORDER is enabled. Use this to allow overlapping intersection blocks within the query string. |
| search.max-prefixes | Number | 8 | Controls the max number of prefixes per index |
| search.max-tag-field-length | Number | 256 | Controls the max length of a tag field |
| search.max-numeric-field-length | Number | 128 | Controls the max length of a numeric field |
| search.max-vector-attributes | Number | 1000 | Controls the max number of attributes per index |
| search.max-vector-dimensions | Number | 32768 | Controls the max dimensions for vector indices |
| search.max-vector-m | Number | 2000000 | Controls the max M parameter for HNSW algorithm |
| search.max-vector-ef-construction | Number | 1000000 | Controls the max EF construction parameter for HNSW algorithm |
| search.max-vector-ef-runtime | Number | 1000000 | Controls the max EF runtime parameter for HNSW algorithm |
| search.default-timeout-ms | Number | 50000 | Controls the default timeout in milliseconds for FT.SEARCH |
| search.max-search-result-record-size | Number | 5242880 | Controls the max content size for a record in the search response |
| search.max-search-result-fields-count | Number | 500 | Controls the max number of fields in the content of the search response |
| search.backfill-batch-size | Number | 10240 | Controls the batch size for backfilling indexes |
| search.coordinator-query-timeout-secs | Number | 120 | Controls the gRPC deadline timeout (in seconds) for distributed coordinator query operations. |
| search.max-indexes | Number | 1000 | Controls the maximum number of search indexes that can be created in the system |
| search.async-fanout-threshold | Number | 30 | Controls the threshold for async fanout operations (minimum number of targets to use async) |
| search.max-nonvector-search-results-fetched | Number | 100000 | Controls the maximum number of results to fetch in background threads before content fetching on non-vector (numeric/tag/text) query paths |
| search.max-attributes | Number | 1000 | Controls the max number of attributes per index |
| search.cluster-map-expiration-ms | Number | 250 | Controls how long (in milliseconds) the coordinator caches the cluster topology map before refreshing it from the Valkey cluster. |
| search.max-mutation-queue-size-on-restore | Number | 10000 | Controls the maximum mutation queue size during RDB load. If the queue exceeds this threshold, the restore process yields to the main thread, allowing the queue to be processed before continuing ingestion. This prevents excessive memory overhead. |
