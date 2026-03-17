+++
title= "Beyond Vectors: Introducing Full-Text Search and Aggregations to Valkey"
description = "Valkey Search now enables querying across text, tags, and numeric data and analyzing results with aggregations."
date= 2026-03-10 00:00:00
authors= [ "karthiksubbarao", "allenss", "bcathcart", "cnuthalapati"]
+++

Valkey Search now lets you search across text, tag, numeric, and vector attributes in a single query, and analyze results with server-side aggregations at the low latency you expect from Valkey. 
Valkey Search enables searching terabytes of data with latency as low as microseconds, providing a flexible foundation for querying across a range of use cases, from powering in-app search experiences to recommendation systems and analyzing data to support in-app analytics and reporting dashboards.

Until now, Valkey Search focused on vector similarity, enabling a wide range of workloads such as semantic search and AI workloads. 
But if you needed to filter your data by numeric attributes such as price ranges, match on exact attributes such as color or size, or search within text attributes such as product reviews, you had to build that yourself.

With Valkey Search 1.2, that changes. In this post, we'll walk through what's new, show how it works, and explore the use cases these capabilities unlock.

## Searching Your Valkey Data
Valkey Search uses indexes to organize your data by searchable attributes, so queries can find matching keys without scanning every document. To get started with search, you first define an index over the attributes you want to search. Valkey Search supports four query types — full-text, tag, numeric range, and vector similarity, which you can use independently or combine with boolean operators. For example, consider an e-commerce retailer Acme.inc using Valkey to store their product catalog who creates an index like this:
```
FT.CREATE product_index ON HASH SCHEMA
  description TEXT
  color TAG
  manufacturer TAG
  price NUMERIC SORTABLE
  rating NUMERIC SORTABLE
  review vector HNSW 6 TYPE FLOAT32 DIM 768 DISTANCE_METRIC COSINE
```
This creates an index called `product_index` over hash keys, indexing `description` as a full-text searchable attribute, `color` and `manufacturer` as exact-match tags, `price` and `rating` as sortable numeric attributes, and `review` as a vector attribute for similarity search. With this index in place, you can now query across all four types:
Full-text Search: Full-text search (FTS) helps you retrieve relevant documents by matching words and phrases within larger text when you do not have an exact identifier or a structured attribute value.
You can use full-text queries to retrieve documents by matching keywords, phrases, or patterns such as prefix, suffix, wildcard, and fuzzy queries (typo-tolerant), anywhere in your document index.
You can use FTS to express constraints like "user reviews mentioning headphones with active noise cancellation AND long battery life, but NOT weighing more than 3 ounces."
Hence, full-text search is a powerful capability for workloads that search unstructured data rather than exact tags.
Full-text search queries shine in use cases such as e-commerce and catalog searches to help users find products instantly across large inventories.
The prefix/suffix pattern matching provided by full-text search makes it ideal for powering instant suggestions as users type, enabling discovery in search bars and product catalogs.
Finally, fuzzy matching capabilities allow you to accurately match documents despite spelling variations, typos, or inconsistent formats to support typo-tolerant retrieval.
For example, when a shopper on Acme.inc types "noise cancelling earphones" in the search bar, the app can search across descriptions to retrieve relevant products:
```
FT.SEARCH product_index "noise canc*"
```
This returns matching products with all their indexed attributes:
```
1) (integer) 2
2) "product:1001"
3) 1) "description"
   2) "Wireless earphones with active noise cancelling and 30-hour battery life"
   3) "color"
   ...
4) "product:1042"
   ...
```
Tag Search: Tag queries filter documents by checking attribute values for exact matches against the provided value. TAG attributes are best for structured categorical data where queries rely on exact value matching.
You can treat TAG as a specialized alternative to TEXT for attributes that you want to match as discrete values such as userIDs, categories, and status flags.
This makes TAG a great fit to express conditions like "category is earphones AND size is small, but color is not red."
TAG filtering shines in use cases such as streaming and gaming platforms to retrieve metadata by exact identifiers such as user ID, region, or genre to power real-time stats and fast in-app filtering.
It is also well suited for session and user management, where you need to quickly locate active sessions and entitlements by exact identifiers such as session ID, device properties, or tenant ID across millions of documents.
For example, when a shopper on Acme.inc filters for earphones manufactured by "shopnow" that are "white" in color, the app can query the tag index:
```
FT.SEARCH product_index "@manufacturer:{shopnow} @color:{white}"
```
Numeric Range Queries: Range search retrieves documents by filtering and sorting over numeric and time attributes using comparisons such as greater than, less than, and between. This makes it ideal for applications that query attributes such as scores, price bands, time windows, inventory thresholds, distances, and timestamps.
Valkey Search supports range-based queries with microsecond latencies, making it a strong fit for real-time leaderboards where you rank and retrieve content by numeric metrics such as scores, downloads, or engagement with updates reflected immediately.
Range queries are also well suited for financial transactions or time series data, enabling ultra-fast lookups by amounts, fees, date ranges, and risk scores to power customer-facing applications, personalization, or real-time monitoring.
For example, when a shopper on Acme.inc sets the price slider to $50–$100 and filters by 4-star and above, the app can query the numeric index:
```
FT.SEARCH product_index "@price:[50 100] @rating:[4 +inf]"
```
Hybrid Queries: Valkey Search lets you combine full-text, tag, numeric range, and vector similarity clauses in a single query so you can retrieve relevant results.
Hybrid queries are ideal for applications that need to query across multiple attribute types in one request. For example, a product discovery query might combine vector similarity over reviews for semantic meaning, a tag filter for category and availability, a numeric range for price, and full-text search over product titles — all in a single request.
This eliminates the need to stitch together multiple queries or round-trips, making it a natural fit for recommendation systems, media platforms, and real-time operational workflows.
Combining our examples from above, when a shopper on Acme.inc searches for "noise cancelling earphones" and filters for products in "white" color, under $150, that are good for running, the app can combine all of this into a single query:
```
FT.SEARCH product_index "noise cancelling earphones @color:{white} @price:[0 150] =>[KNN 5 @review $vector]" PARAMS 2 vector 'VECTOR_REPRESENTATION'
```
Here, the query is searching through vector representations of product reviews to find “earphones that are good for running”.

## Transform Your Valkey Data with Aggregations
Aggregations help you analyze and summarize the results of a search query, instead of returning a raw list of matching documents.
You can use `GROUPBY` to form groups on any indexed attribute such as category, brand, region, and time, apply `REDUCE` functions such as `COUNT`, `SUM`, and `AVG` to compute per-group statistics, and use `APPLY` to create computed attributes on the fly.
You can then refine and shape the output with post-aggregation `FILTER`, `SORTBY`, and `LIMIT`, chaining stages together to build multi-step workflows in a single query.
This makes aggregations a strong fit for low-latency lightweight analytics directly on indexed Valkey data, without the need to export large result sets to the application layer. Some applications of aggregations include:
1. Faceted navigation and filtering: Power dynamic filtering UIs using aggregations to compute real-time counts over the current result set (for example by category, brand, price band, rating, or availability), enabling users to narrow down search results with instant feedback on available options. You can also group and count items by attribute such as genre, tags, language, or creator to power structured browsing and category-level summaries across large catalogs.
2. Real-time statistics: Use aggregations to compute grouped rankings for powering in-app flows such as trending items by recent engagement, category leaders by revenue, or top performers by region.
3. Analytics and reporting: Generate live counts and summary metrics to power operational dashboards, or generate on-demand reports for analysis and decision making without hitting backend databases.
For example, Acme.inc can populate the count of earphones available from “shopnow” in each price band on the webpage using:
```
FT.AGGREGATE product_index "@manufacturer:{shopnow}"
APPLY "floor(@price / 50) * 50" AS price_band
GROUPBY 1 @price_band
REDUCE COUNT 0 AS product_count
SORTBY 2 @price_band ASC
```
This filters for products from the "shopnow" manufacturer, uses `APPLY` to bucket each product's price into $50 bands (0–49, 50–99, 100–149, etc.), groups by those bands, counts products in each, and sorts by price band ascending — giving Acme.inc a price distribution histogram for that manufacturer's products.

## Under the Hood
### Real-time Search with Multi-threading
Valkey Search uses indexes to organize keys by the contents of their searchable attributes, ensuring reads remain fast and efficient as data grows.
When you add, update, or delete an indexed key, the module receives the mutation event, extracts indexed attributes, queues the indexing work, and updates the index before acknowledging the write.
Valkey Search is multi-threaded, so you can maximize ingestion throughput by using multiple parallel connections to saturate the index update process without pipelining on a single connection.
Background worker threads process index updates, and the client receives a response only after the update is committed to the index.
### Read-after-write Consistency
For workloads that require strict read-after-write behavior, you can configure your client to route search queries to primaries.
A write only completes after its index updates are applied, so any search sent to the same primary after the write returns will see that change.
If your application can tolerate some staleness, you can offload reads to replicas.
On replicas, search is eventually consistent because replication and index maintenance are asynchronous, and each node maintains its own local indexes.
Multi-key updates wrapped in a MULTI/EXEC transaction or Lua script are also atomically visible to search.
Valkey Search exposes the index only after all attribute updates in the batch are applied.
Separately, in cluster mode, read-after-write consistency applies per primary of the shard.
If you write a key to a primary, searches sent to that primary see the change after the write returns, but a fan-out query spanning multiple shards does not have a single global transactional view.
### Scale to Terabytes of Data
Valkey Search includes built-in support for cluster mode, enabling you to scale to terabytes of data without requiring application or client code changes.
In cluster mode, Valkey Search creates indexes that span multiple shards by maintaining a separate index on each node for the keys belonging to that node's slot range. When you create, update, or drop an index on any primary, Valkey Search propagates that change to all nodes.
You can scale read throughput by distributing Search queries evenly across primary nodes so that no single node becomes a bottleneck, or by routing some Search queries to replicas.
You can increase throughput by scaling to instances with more vCPUs, allowing multithreading to scale throughput linearly for both querying and ingesting, or by adding replicas to increase query throughput.

For queries, the coordinating node that receives the query request, packages a query plan and sends it to every shard (to run on either primaries or replicas).
A node within each shard performs the search and fetches its matching keys, then returns results for the coordinator to merge. Because the fan-out and merge logic exists on every cluster node, any node can coordinate a query. For mutations, the primary owning the slot handles updates: when a key is added, updated, or deleted, only that primary updates its index directly, and the change replicates to its replicas.
## Getting Started
Valkey Search 1.2 extends search to text, tag, and numeric attribute types and adds result aggregation capabilities such as filtering, sorting, grouping, and computing metrics. Whether you're building cutting-edge AI applications, latency-sensitive search experiences, or integrating search into existing systems, we invite you to try it out. 
To get started with Valkey Search, visit the [Valkey Search GitHub repository](https://github.com/valkey-io/valkey-search) and the [Valkey Bundle on Docker Hub](https://hub.docker.com/r/valkey/valkey-bundle). The official Valkey Bundle image provides the fastest path to running Valkey with preloaded modules, including Valkey Search, so you can begin building search and aggregation workflows without manual module setup. You can connect using official Valkey client libraries such as Valkey GLIDE, valkey-py, valkey-go, and valkey-java, as well as other Redis-compatible clients. Valkey Search is available under the BSD-3-Clause license. You can learn more about Valkey Search through our [documentation](https://valkey.io/topics/search/).

Get Involved: Join the valkey-search community, file issues, open pull requests, or suggest improvements. We welcome contributions of all kinds - code, documentation, testing, and feedback. Your involvement helps make valkey-search better for everyone.

> **Note:** As of March 13, 2026, if you want to use Valkey Search 1.2 features on docker, use the current valkey/valkey-bundle:unstable image.
