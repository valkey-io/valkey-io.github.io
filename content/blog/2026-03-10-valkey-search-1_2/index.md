+++
title= "Search terabytes in microseconds"
description = "Valkey Search now enables querying across text, tags, and numeric data and analyzing results with aggregations."
date= 2026-03-10 00:00:00
authors= [ "karthiksubbarao", "allenss", "bcathcart", "cnuthalapati"]
+++

Valkey Search now enables searching across text, tags, and numeric attributes over terabytes of data with microsecond-level latency and up to millions of queries per second.
You can now search your Valkey data by combining full-text search, numeric, tag, and vector filters in a single query, then analyze results with server-side processing like grouping, counts, and averages.

Valkey Search supports real-time updates, so new and updated data becomes searchable immediately. This keeps search results consistent and reduces the risk of acting on stale data.
It includes built-in support for scaling to terabyte-scale clusters without requiring application or client code changes.
Valkey Search enables low-latency aggregations on your data by eliminating the need to export large result sets to the application layer for post-processing, which reduces data movement and costs.

Valkey Search provides a flexible, high-performance foundation for querying across a range of use cases, from powering in-app search experiences to recommendation systems and analyzing Valkey data to support in-app analytics and reporting dashboards.
The new capabilities require Valkey 9.0 or later and are licensed under the BSD-3-Clause license.
In this blog, you will learn about how Valkey Search works and understand full-text, tag (exact-match), numeric range, and aggregation queries, and explore the key use cases they enable.


## Real-time Search with Multi-threading

Valkey Search uses indexes to organize keys by the contents of their searchable attributes, ensuring reads are low-latency and remain efficient as data grows.
Valkey Search updates the index on the write path, using additional CPU and memory on writes to provide immediate and low-latency search.
When you add, update, or delete an indexed key, the module receives the mutation event, extracts indexed attributes, queues the indexing work, and updates the index before acknowledging the write.

Valkey Search supports multi-threading so you can maximize ingestion throughput by using multiple parallel connections to saturate the index update process without pipelining on a single connection.
Index updates are processed by background worker threads, and index changes become visible only after the update completes, at which point the client is unblocked.
The system ensures atomic visibility by exposing index changes only after a whole key finishes its attribute updates, and it then unblocks the client.

## Consistency Your Application Needs

For workloads that require strict read-after-write behavior, you can route search queries to primaries.
A write only completes after its index updates are applied, so any search sent to the same primary after the write returns will see that change.
If your application can tolerate some staleness, replicas can be used to offload reads.
On replicas, search is eventually consistent because replication and index maintenance are asynchronous, and each node maintains its own local indexes.

Multi-key updates wrapped in a transaction or Lua script are also atomically visible to search.
The index is only exposed after all attribute updates in the batch are applied.
Separately, in cluster mode, read-after-write consistency is guaranteed per shard.
If you write a key on one shard, searches that depend on that shard see the change after the write returns, but a fan-out query across multiple shards does not have a single global transactional view.


## Scale to Terabytes of Data with Millions of QPS

Valkey Search includes built-in support for cluster mode, enabling you to scale to terabytes of data without requiring application or client code changes.
In cluster mode, Valkey Search creates indexes that span multiple shards by maintaining a separate index on each shard for the keys owned by that shard. When you create, update, or drop an index on any primary, Valkey Search propagates that change to all nodes.

You can scale read throughput to millions of QPS by distributing queries evenly across the cluster so no single node or shard becomes the bottleneck.
You can increase throughput by using more CPUs, which leverages multithreading to scale throughput linearly for both querying and ingesting, or add replicas to increase query throughput.

For queries, the coordinating node that recieves the query request, packages a query plan and sends it to every shard (running on either primaries or replicas).
Each shard performs the search and fetches matching local keys, then returns results for the coordinator to merge. Because the fan-out and merge logic exists on every cluster node, any node can coordinate a query.
For mutations, updates are handled locally: when a key is added, updated, or deleted, only the local shard index is updated, and no other cluster member is modified.

## Searching Your Valkey Data

Valkey Search supports four query types that can be used independently or combined with boolean operators.

Full-text Search: Full-text search helps you retrieve relevant documents by matching words and phrases within larger text when you do not have an exact identifier or a structured attribute value.
You can use full-text queries to retrieve documents by matching keywords, phrases, or patterns such as prefix, suffix, wildcard, and fuzzy queries, anywhere in your document index.
You can also combine clauses with boolean logic, including AND, OR, and negation, to express constraints like "user reviews mentioning headphones with active noise cancellation AND long battery life, but NOT weighing more than 3 ounces.".
Hence, full-text search is a powerful capability for workloads that search unstructured data rather than exact tags. Full-text search queries shine in use cases such as:

1. E-commerce and catalog search: Help users find products instantly across large inventories with typo-tolerant search, pattern-based matching for partial or incomplete terms, and category filters.
2. Autocomplete and typeahead search: Power instant suggestions as users type, enabling discovery in search bars, contact finders, and product catalogs.
3. Entity resolution and fuzzy matching: Accurately match documents despite spelling variations, typos, or inconsistent formats across disparate data sources to support consolidation and validation.

Tag Search: Tag queries filter documents by checking attribute values for exact matches against the provided value. TAG attributes are best for structured categorical data where queries are based on exact value matching.
You can treat TAG as a specialized alternative to TEXT for attributes that should be matched as discrete values such as IDs, SKUs, usernames, categories, and status flags.
This makes TAG a great fit when precision and predictable filtering are a priority to express conditions like "category is earphones AND size is small, but color is not red." Some examples where TAG filtering is well suited include:

1. Session and user management: Quickly locate active sessions, device documents, and entitlements by exact identifiers such as user ID, session ID, device ID, or tenant ID across millions of documents.
2. Gaming and streaming platforms: Retrieve player profiles, team rosters, game metadata, and user generated content by exact identifiers such as player ID, team ID, and match ID, region, mode, or league, to power real-time stats and fast in-app filtering.

Numeric Range Queries: Range search retrieves documents by filtering and sorting over numeric and time attributes using comparisons such as greater than, less than, and between.
This makes it ideal for applications that query attributes containing scores, price bands, time windows, inventory thresholds, distances, and timestamps. You can also filter for exact numeric values, for example to retrieve items with a specific status code.
Valkey Search supports range-based queries with microsecond latencies, which makes it a strong fit for real-time applications such as:

1. Real-time leaderboards and rankings: Rank and retrieve content, users, or products by numeric metrics such as scores, downloads, subscribers, spend, and engagement scores with updates reflected in search results immediately.
2. Financial transactions: Perform ultra-fast lookups on transaction data by amounts, fees, exchange rates, and risk scores with range-based filtering to power customer-facing applications and real-time monitoring.
3. Time series and financial data: Query decades of historical documents such as user history by date ranges, numeric thresholds, and session durations for compliance, reporting, and personalization.

Hybrid Queries: Valkey Search lets you combine full-text, tag, numeric range, and vector similarity clauses in a single query so you can retrieve relevant results and apply precise filters without stitching together multiple queries or systems.
Combination queries make it easy to express queries like "find headphones that reviews recommend for ‘phone calls’ using vector similarity for semantic meaning, but only in the Headphones category for products in stock, priced under $100, and not refurbished.".
This is ideal for applications that need to query across multiple attributes and data types in one request, such as:

1. Discovery and recommendation systems: Combine keyword and semantic search over titles, descriptions, and reviews with exact match filters such as category, brand, and availability, plus range filters such as price and rating, to return relevant products that meet shopper constraints.
2. Media and streaming platforms: Combine keyword and semantic search over titles, plots, and captions with exact match filters such as genre and language, plus range filters such as release year and duration, to deliver a personalized viewing experience.
3. Real-time operations: Enable teams to instantly locate orders, deliveries, and customer documents by combining exact identifiers such as order ID and customer ID with full-text search over names and notes, plus range filters over timestamps, SLA windows, distance, and order value for fast-paced fulfillment workflows.

## Transform your Valkey Data with Aggregations

Aggregations help you analyze and summarize the results of a search query, instead of returning a raw list of matching documents.
You can use GROUPBY to form groups on any indexed attribute such as category, brand, region, and time, apply REDUCE functions such as COUNT, SUM, and AVG to compute per-group statistics, and use APPLY to create computed attributes on the fly.
You can then refine and shape the output with post-aggregation FILTER, SORTBY, and LIMIT, chaining stages together to build multi-step workflows in a single query.
This makes aggregations a strong fit for lightweight analytics directly on indexed Valkey data, such as:

1. Faceted navigation and filtering: Power dynamic filtering UIs using aggregations to compute real-time counts over the current result set (for example by category, brand, price band, rating, or availability), enabling users to narrow down search results with instant feedback on available options.
You can also group and count items by attribute such as genre, tags, language, or creator to power structured browsing and category-level summaries across large catalogs.
2. Leaderboards and statistics: Use aggregations to compute grouped rankings, totals, and averages across players, teams, or products, such as top performers by region, category leaders by revenue, or trending items by recent engagement.
3. Real-time analytics dashboards: Generate live counts and summary metrics grouped by dimensions such as region, time window, status, or category to power operational dashboards without hitting backend databases.
4. Reporting and business intelligence: Aggregate transactional data by customer, product, merchant, or time period to generate on-demand reports with sums, counts, averages, and percentiles for analysis and decision making on data in your Valkey database.

## Getting Started

The first release of Valkey Search focused on vector search, and this release extends the search to text, tag and numeric attribute types and adds result aggregation capabilities such as filtering, sorting, grouping, and computing metrics.
Whether you're building cutting-edge AI applications or integrating search into existing systems, we invite you to try it out.

The easiest way to get started is by visiting the Valkey Search GitHub repository. Clone the repo, load Valkey Search into Valkey 9.0 or later, and start building high-performance search and aggregation workflows.
You can connect using official Valkey client libraries such as Valkey GLIDE (Java, Python, Node.js, Go), valkey-py, valkey-go, and valkey-java (Java) and popular Redis-compatible clients.

Get Involved: Join the valkey-search community, file issues, open pull requests, or suggest improvements.
We welcome contributions of all kinds - code, documentation, testing, and feedback. Your involvement helps make valkey-search better for everyone.
