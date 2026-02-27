+++
title= "Valkey Search Now Delivers Expanded, Rich Search and Aggregations"
description = "Unlocking Text, Tag, Numeric Search and Aggregations in Valkey Search"
date= 2026-03-10 00:00:00
authors= [ "karthiksubbarao", "allenss", "bcathcart", "cnuthalapati"]
+++

Valkey Search, the official Valkey module, now enables searching across text, tags, and numeric fields over terabytes of data with microsecond-level latency and up to millions of queries per second. You can now search your Valkey data combining full-text search, numeric, tag and vector filters in a single query, then analyze results with server-side processing like grouping, counts, and averages. This complements the vector search capabilities that were introduced in Valkey search 1.0. Valkey Search includes built-in support for scaling to terabyte-scale clusters, ensuring reads remain efficient and low-latency as data grows. It supports real-time updates so new and updated data becomes searchable immediately. Running aggregations within your Valkey Cache reduces data movement and eliminates the need to export large result sets to the application layer for post processing. Valkey Search provides a flexible, high-performance foundation for querying across a range of use cases, from powering in-app search experiences, and recommendation systems to simple in-cache lookups. You can use Valkey Aggregations to power in-app analytics, dashboards, or generate reports on cached data for your application. The new capabilities are compatible with Valkey versions 9.0 and above and is BSD-3-Clause licensed.

In this blog, you will learn about full-text, exact-match, range and aggregation queries, explore the key use cases they enable.

## Filtering with Valkey Search

### Full-text Search

Full-text search helps you retrieve relevant documents by matching words and phrases within larger text when you do not have an exact identifier or a structured filter value. When you index text fields, Valkey Search tokenizes their content into searchable terms and builds an inverted index that maps terms to documents. You can use full-text queries to retrieve documents by matching keywords, phrases, or patterns such as prefix, suffix, wildcard, and fuzzy queries, depending on your requirements. You can also combine clauses with boolean logic, including AND, OR, and negation, to express constraints like “user reviews mentioning headphones with active noise cancellation AND long battery life, but NOT weighing more then 3 ounces.” 

Once indexed, you can query text fields using a range of matching types that can be freely combined with boolean operations:

1) Term search: Matches a single text term. For example, querying wireless can match “headphones with wireless charging.”. Users can include a field specifier, @title:wireless, optionally to search for the term on specific fields of documents. By default, the search is performed on all fields. Additionally, by default, the term will be stemmed to normalize words and improve accuracy of matches. For example, search on the term @title:running will also match documents containing the term runs and runner. Stemming on text terms can be overridden and skipped by using the VERBATIM clause on the FT.SEARCH command.

2) Exact Phrase match: Match an ordered sequence of terms that appear together, with constraints on adjacency. This is useful when word order matters, for example the query "noise cancelling" matches “noise cancelling headphones” but not “cancelling noise from traffic.”

3) Fuzzy search: Match terms that are close to the query term to tolerate typos and minor misspellings. For example, a fuzzy query for airpods can still match listings even if the user types %airpds% or a seller listing contains %airpodz%. This improves matches for user-entered text like names where spelling errors are common. The depth of the fuzzy search is controlled by the number of % operators used, and this is controlled by the X configuration with a default value of 3.

4) Prefix search: Match terms that start with a prefix, which is commonly used for typeahead and autocomplete. For example, a query like head* returns documents that contain words starting with head, such as headphones or headset.

5) Suffix search: Match terms that end with a given string, which helps when users know only the ending of a word or type truncated inputs. For example, the query *pods can match airpods and earpods.

6) Composite text search: Multiple terms can be searched for together by grouping them in intersections, as well as unions. Unlike Exact Phrase queries, here, stopword removal does occur as well as stemming based on the created index and field level properties. Stemming can be disabled by using the VERBATIM clause.

7) Proximity search: This enables you to declare tolerance on the ordering of terms in your query as well as the number of non-query words that can appear between the terms in your query. When INORDER is specified, all terms in the query need to appear in the same order in a given field in a given document.SLOP controls the proximity requirement for the individual terms in a query. SLOP 0 means that the terms must be adjacent. SLOP 1 allows zero or one unrelated words between query terms. For example: FT.SEARCH idx ‘john loves wireless earphones’ INORDER SLOP 1. Here, the documents matched can include content such as ‘john loves white wireless earphones’ since it matches the constraints. It does not match ‘john loves noise-cancelling wireless earphones’ because the SLOP requirement is not met due to 2 words in between the queried terms.


Hence, full-text search is a powerful capability for enabling search and discovery experiences in applications, as well as workloads that search unstructured data or rely on text rather than exact tags. Full-text search queries shine in use cases such as:

1) E-commerce and catalog search: Help users find products instantly across large inventories with typo-tolerant search, pattern-based matching for partial or incomplete terms, and category filters.
2) Autocomplete and typeahead search: Power instant suggestions as users type, enabling discovery in search bars, contact finders, and product catalogs.
3) Entity resolution and fuzzy matching: Accurately match documents despite spelling variations, typos, or inconsistent formats across disparate data sources to support consolidation and validation.

### Tag Search

Exact-match queries filter documents by checking field values for equality against the provided value. With Valkey Search, you can declare exact match fields as TAG fields so the index stores discrete values that you can query exactly. TAG fields are best for structured categorical data where queries are based on exact value matching. You can treat TAG as a specialized alternative to TEXT for fields that should be matched as discrete values instead of tokenized natural language, such as IDs, SKUs, usernames, categories, and status flags. This makes TAG a better fit when precision and predictable filtering matter more than text-oriented behaviors like fuzzy matching or phrase search. You can combine multiple exact-match clauses in a single query using boolean logic such as AND, OR, and negation to express filters like “manufactured by Acme Corp AND size is large, but color is not red.” Some examples where TAG filtering is well suited include:

1) Session and user management: Quickly locate active sessions, device documents, and entitlements by exact identifiers such as user ID, session ID, device ID, or tenant ID across millions of documents.
2) Gaming and entertainment platforms: Retrieve player profiles, team rosters, game metadata, and user generated content by exact identifiers such as player ID, team ID, and match ID, region, mode, or league, to power real time stats and fast in-app filtering


### Numeric Range Queries

Range search retrieves documents by filtering and sorting over numeric and time fields using comparisons such as greater than, less than, and between. This makes it ideal for applications that query fields containing scores, price bands, time windows, inventory thresholds, distances, and timestamps. You can also filter for exact numeric values, for example to retrieve items with a specific status code. Exact matches are expressed as a range where the lower and upper bound are the same value. Valkey Search supports range based queries with millisecond latencies, which makes it a strong fit for real time applications such as:

1) Financial transactions: Perform ultra-fast lookups and access documents of transaction data by transaction amounts, balances, fees, exchange rates, and risk scores with range-based filtering to power customer facing applications, real time monitoring, and compliance queries.
2) Time series & historical data: Query decades of historical documents such as trade data or user history by date ranges, numeric thresholds, and session durations for compliance, reporting, and personalization use cases without database bottlenecks.
3) Real-time leaderboards & rankings: Rank and retrieve content, users, or products by numeric metrics such as scores, downloads, subscribers, spend, and engagement scores with updates reflected in search results immediately.

### Hybrid Queries

Valkey Search lets you combine full-text, exact-match, numeric range, and vector similarity clauses in a single query so you can retrieve relevant results and apply precise filters without stitching together multiple queries or systems. You control retrieval by choosing which query clauses to include, combining them with boolean logic and scoping clauses to specific fields. Combination queries make it easy to express queries like “find headphones that reviews recommend for ‘phone calls’ using vector similarity for semantic meaning, but only in the Headphones category for products in stock, priced under $100, and not refurbished.” This is ideal for applications that need to query across multiple fields and data types in one request, combining relevance with exact filters and numeric constraints, with use cases such as:

1) Discovery & recommendation: Combine keyword and semantic search over titles, descriptions, and reviews with exact match filters such as category, brand, and availability, plus range filters such as price and rating, to return relevant products that meet shopper constraints.
2) Media & streaming platforms: Combine keyword and semantic search over titles, plots, and captions with exact match filters such as genre and language, plus range filters such as release year and duration, to deliver personalized viewing experience.
3) Real time operations: Enable teams to instantly locate orders, deliveries, and customer documents by combining exact identifiers such as order ID and customer ID with full text search over names and notes, plus range filters over timestamps, SLA windows, distance, and order value for fast-paced fulfillment workflows.



## Aggregations with Valkey

Aggregations help you analyze and summarize the results of a search query, instead of returning a raw list of matching documents. In Valkey Search, you run FT.AGGREGATE to execute a query over an index and then apply a pipeline of operations that can group results by one or more fields and compute summary metrics, which enables multidimensional analysis while filtering across text, numeric and vector attributes. You can use GROUPBY to form groups on any indexed field such as category, brand, region, and time, apply REDUCE functions such as COUNT, SUM, AVG, MIN, MAX, distinct counts, percentiles, and standard deviation to compute per group statistics, and use APPLY to create computed fields on the fly. You can then refine and shape the output with post aggregation FILTER, SORTBY, and LIMIT, chaining stages together to build multi step workflows in a single query.

1) This makes aggregations a strong fit for faceted navigation, dashboards, and lightweight analytics directly on indexed cache data, such as returning facet counts for filters like color and size, ranking categories by revenue, or computing average price by brand.
2) Faceted navigation & filtering – Power dynamic filtering UIs using aggregations to compute real-time counts over the current result set (for example by category, brand, price band, rating, or availability), enabling users to narrow down search results with instant feedback on available options. You can also group and count items by metadata such as genre, tags, language, or creator to power structured browsing and category level summaries across large catalogs.
3) Leaderboards & statistics – Use aggregations to compute grouped rankings, totals, and averages across players, teams, or products, such as top performers by region, category leaders by revenue, or trending items by recent engagement.
Real time analytics dashboards: Generate live counts and summary metrics grouped by dimensions such as region, time window, status, or category to power operational dashboards without hitting backend databases.
4) Reporting and business intelligence: Aggregate transactional data by customer, product, merchant, or time period to generate on demand reports with sums, counts, averages, and percentiles for analysis and decision making on data in your cache.


## Why Not OpenSearch?

Valkey Search is the right default when you need microsecond query latency on hot operational data, high throughput, and real time updates where writes become searchable immediately after they complete. Valkey Search is well suited for frequently updated datasets or workloads where strong consistency on primary nodes matters and foundational search features are enough. Use OpenSearch when you need deeper search platform capabilities like multi-language analysis, custom scoring and ranking controls, and complex aggregations and analytics, and you can tolerate higher latency plus batch or near real time index refresh behavior where updates are not always searchable instantly.

## Getting started

The first release of valkey-search focused on vector search, and this release extends the search to text, tag and numeric index types. This launch also provides post-query data processing facilities. Whether you're building cutting-edge AI applications or integrating search into existing systems, we invite you to try it out.

The easiest way to get started is by visiting the [GitHub repository](https://github.com/valkey-io/valkey-search), where you'll find setup instructions, documentation, and examples. You can clone the repo, fire up the [dev container](https://hub.docker.com/r/valkey/valkey-bundle), and start building high-performance search & aggregation workflows with valkey-search. The repository includes a preconfigured development environment and a setup script to get you productive quickly.

The enhanced functionality of Valkey Search discussed in this blog requires Valkey 9.x or newer. The earlier 1.0 release limited to vector search is compatible with Valkey 8.1.1 and later (so Valkey 9+ works there too). You can connect using official Valkey client libraries such as Valkey GLIDE (Java, Python, Node.js, Go), valkey-py, valkey-go, and valkey-java (Java) and popular Redis-compatible clients.

Get Involved: Join the valkey-search community, file issues, open pull requests, or suggest improvements. We welcome contributions of all kinds - code, documentation, testing, and feedback. Your involvement helps make valkey-search better for everyone. Future releases will include additional query functionalities. 
