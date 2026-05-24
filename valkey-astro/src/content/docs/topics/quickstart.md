---
title: "Quick start guide"
description: Understand how to use basic Valkey data types
---

## Getting Started with Valkey

### What is Valkey?

Valkey is a fully open-source, in-memory data store backed by the Linux Foundation, offering microsecond-latency operations on rich data structures. See the [Introduction](introduction.md) for more.

### Installation and Setup

Getting Valkey up and running is straightforward. See the [Installation Guide](installation.md) for detailed instructions.

If you just want to try Valkey quickly, head over to [Try-Valkey](https://valkey.io/try-valkey/) — an interactive playground where you can run any Valkey command right in your browser.

### Data Operations

Once connected with Valkey, you can interact by issuing commands to store and retrieve data. Valkey behaves like a **remote dictionary** – you can think of it as a giant hash map on a server. Each piece of data is stored under a unique **key**, and you use commands to read or modify values associated with those keys.

Let’s walk through some fundamental operations **** with two of the most commonly used data types in Valkey: **strings** and **hashes**.

* **Strings:** The simplest data type in Valkey is a string (binary-safe sequence of bytes). You can store text or binary data under a key. For example, to store a string value and then retrieve it:

```
127.0.0.1:6379> SET user:1000 "Alice"
OK
127.0.0.1:6379> GET user:1000
"Alice"
```

Here we use the `SET` command to save the value `"Alice"` under the key `user:1000`, and `GET` to fetch it back. Valkey keys are often namespaced with prefixes (like `user:`) to group related items. You can store any data serialized as a string – numbers, JSON, binary blobs, etc. (Up to 512 MB per value, though very large values are not recommended for performance).

* **Hashes:** Hashes allow you to store multiple fields and values under one key, similar to a JSON object or dictionary. This is useful for representing objects without using separate keys for each field. For example:

```
127.0.0.1:6379> HSET user:1000 name "Alice" email "alice@example.com" age "30"
(integer) 3
127.0.0.1:6379> HGET user:1000 name
"Alice"
127.0.0.1:6379> HGETALL user:1000
1) "name"
2) "Alice"
3) "email"
4) "alice@example.com"
5) "age"
6) "30"
```

We add three fields to the hash stored at `user:1000`. `HGET` retrieves a single field, and `HGETALL` returns all fields and values. Hashes are memory-efficient for storing structured data.

* **Other Data Types:** Valkey supports many other native data structures. For example, **lists** (ordered collections of elements) support queue/stack operations, **sets** store unique items (useful for tags or unique lists), **sorted sets** maintain ordered rankings, and more. Each data type comes with specialized commands (e.g. `LPUSH`/`LRANGE` for lists, `SADD`/`SMEMBERS` for sets). You can find a full overview in the [Valkey data types documentation](data-types.md) and the command reference.

### Example Use Case: Caching with Valkey

One of the most popular ways to use Valkey is as a caching layer in front of a traditional database or expensive API. By caching results in Valkey, applications can serve repeated requests much faster and reduce load on back-end systems.

**Scenario:** Imagine a web application that needs to fetch user profile data from a database. Without caching, each page load would query the database, making the app slow under load. With Valkey, you can cache the user data after the first retrieval:

1. **Check cache first:** On a user profile request, the application first checks Valkey (using a key like `user:42:profile`) to see if the data is already cached.
2. **Fallback to DB if miss:** If the key is **not** found in Valkey (a cache miss), the application queries the database for the data.
3. **Store in cache:** The result from the database is then stored in Valkey for next time, with an expiration time (TTL).
4. **Subsequent hits:** Future requests find the data in Valkey (cache hit) and can skip the database query, returning data to the user much faster.

In Valkey, setting a key with an expiration can be done in one command. For example, to cache a rendered page for 5 minutes (300 seconds):

```
127.0.0.1:6379> SET page:homepage "<html>...rendered content...</html>" EX 300
OK
```


The `EX 300` option tells Valkey to automatically expire (remove) the key after 300 seconds. Until it expires, any request for `page:homepage` will be served the cached content from memory. You can adjust TTLs based on how fresh the data needs to be. Expiring keys ensures the cache doesn’t serve stale data indefinitely.

Valkey can **cache nearly anything** – from database query results and API responses to session tokens, rendered HTML, or even generated reports. Database caching is a classic use case, but it's only the beginning. E-commerce platforms use Valkey to serve personalized recommendations instantly. Gaming companies rely on it for real-time leaderboards and matchmaking. Fintech systems trust Valkey to cache fraud detection signals and scoring results under heavy load. In AI and ML pipelines, Valkey accelerates inference by caching model outputs, storing precomputed embeddings, and managing access tokens across distributed systems. With sub-millisecond latency and the capacity to process hundreds of thousands of operations per second, Valkey is built to keep up — no matter how demanding the workload.

### Best Practices and Troubleshooting

**Best Practices:**

* **Use descriptive key names:** Organize keys with namespaces using colon notation (e.g. `user:42:settings`). This makes it easier to manage related keys and avoid collisions.
* **Choose the right data type:** Store data in its natural form. For example, use a hash to keep an object’s fields together under one key instead of multiple separate keys, or use a list for an ordered collection of items. Leverage Valkey’s rich data structures to minimize client-side processing.
* **Set expirations for volatile data:** If using Valkey as a cache, always set a TTL on keys that represent transient data (sessions, cache entries, etc.) to prevent them from living forever. This helps automatically prune old data and keeps memory usage in check.
* **Mind memory limits:** By default, Valkey will keep growing in memory until it reaches the host’s limits. For production, configure a `maxmemory` limit and an eviction policy (like *Least Recently Used* eviction) if using it as a cache. This ensures Valkey evicts least-used entries when full, rather than failing once memory is exhausted.
* **Enable persistence if needed:** If you want Valkey to permanently store data (not just cache), enable persistence options. Valkey supports creating point-in-time snapshots (RDB files) or append-only file logging (AOF) similar to Redis. This safeguards data in case of a restart or failure.

**Troubleshooting Common Issues:**

* **Cannot connect to Valkey:** If the CLI or client can’t connect (e.g. *Connection refused* or *Unable to connect* errors), first ensure the Valkey server process is running. If it’s running on a different host or container, make sure you specify the correct `-h` and `-p` in `valkey-cli`, and that the port **6379** is open through any firewalls. You can always test connectivity with `valkey-cli ping` (expect a **PONG**).
* **Keys not found (or data missing):** If you expected data to be in Valkey but `GET` returns nothing, consider that the key might have expired or been evicted if you set a max memory policy. Use the `TTL <key>` command to check time-to-live, and ensure your application logic correctly stores the data. Also, confirm that you’re connecting to the same Valkey instance (and database number, if applicable) where the data was written.
* **Performance issues:** If you encounter high latency, monitor Valkey’s built-in metrics. You can use the `INFO` command to get stats on memory, CPU, and command usage. For deeper analysis of latency spikes, Valkey provides a latency monitoring feature and a benchmarking tool (`valkey-benchmark`). Common causes of slowdowns include very large payloads or expensive commands blocking the server. If needed, consider distributing load via clustering or splitting data across multiple instances.
* **Valkey server crashes or is unstable:** Though rare, if Valkey crashes, check the server logs for errors. Ensure your system’s memory is healthy (faulty RAM can cause issues in in-memory databases). Run `valkey-server --test-memory` to perform a memory test of your system.

For further diagnostics, see the [official troubleshooting guide](problems.md). We want to ensure that Valkey runs smoothly in your environment.

### Next Steps

Now that you have Valkey running and understand the basics, you can explore more advanced topics and use cases:

* **Try Valkey**: Use [Try Valkey](https://valkey.io/try-valkey/) allows you to try Valkey, the high-performance in-memory data store, directly from your browser — no installation needed
* **Core Data Types**: Valkey offers powerful [data types](data-types.md) beyond simple strings. Understanding these types is key to designing efficient applications:
    * [Strings](strings.md): The simplest type, used for caching, counters, and more.
    * [Lists](lists.md): Ordered sequences ideal for queues and logs.
    * [Sets](sets.md): Unordered collections of unique elements, great for tags or membership checks.
    * [Hashes](hashes.md): Field-value pairs, often used for storing objects or records.
    * [Sorted Sets](sorted-sets.md): Unique elements with scores, useful for leaderboards or time-series data.
* **Explore Valkey Modules:** Valkey supports pluggable modules that extend its core functionality with custom commands and data types. Take a look at few of our official modules to get started.
    * **[Valkey Json](valkey-json.md)**
    * **[Valkey Bloom](bloomfilters.md)**
    * **[Valkey LDAP](ldap.md)**
    * **[Valkey Search](search.md)**
* **Publish/Subscribe Messaging:** Dive into Valkey’s Pub/Sub feature to build real-time apps (such as chat systems o live notifications). See the [**Pub/Sub** section](pubsub.md) of the docs for patterns and best practices (Valkey’s Pub/Sub supports pattern subscriptions and sharded channels for scalability).
* **Clustering and High Availability:** When you need to scale out or ensure uptime, Valkey Cluster mode allows sharding data across multiple nodes with automatic failover. Check out the **[Valkey Cluster tutorial](cluster-tutorial.md)** for a step-by-step guide to setting up a cluster and using replication.
* **Further Documentation:** Explore the **[Valkey Documentation by Topic](index.md)** for in-depth guides on persistence, security, Lua scripting, modules, and more. Key references include the [Commands Reference](../commands/) for details on every command, and the [FAQ](faq.md) for answers to common questions.

Happy caching with Valkey! With its speed and flexibility, you now have a powerful tool to build fast, scalable applications. **Next steps** above will guide you as you deepen your Valkey knowledge and tackle more complex scenarios. Good luck on your Valkey journey!
