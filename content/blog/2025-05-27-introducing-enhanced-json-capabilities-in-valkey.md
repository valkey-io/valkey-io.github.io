+++
title = "Introducing Enhanced JSON Capabilities in Valkey"
description = "Learn more about the new Valkey JSON module with some real-world examples and application."
sort_by = "2025-06-03 01:01:01"
authors= [ "roshkhatri"]
+++

On April 4, 2025 Valkey announced the GA release a powerful new upgrade—JSON support. With the introduction of native JSON data types, developers can now store, query, and manipulate structured data directly within Valkey without needing external serialization or complex parsing logic. This enhancement not only simplifies data handling for modern applications but also unlocks new capabilities for building real-time, data-driven experiences at scale. Whether you’re managing complex user profiles, caching API responses, or powering analytics dashboards, JSON support in Valkey streamlines data management while maintaining the speed and efficiency Valkey is known for.

JSON has become the universal format for data exchange, but effectively managing JSON data at scale remains a challenge in caching layers. The Valkey-JSON module addresses this by providing a dedicated JSON data type and a rich set of commands for inserting, updating, and retrieving JSON content using JSONPath queries. This approach reduces application complexity and accelerates performance, making it ideal for modern, data-driven applications.

Let’s first cover the key capabilities and performance of Valkey-JSON. We will then dive into how to work with Valkey-JSON and demonstrate how to get started with a real world example. 

## Core Capabilities and Performance

Valkey’s JSON support goes beyond basic storage and retrieval. It introduces powerful querying and filtering capabilities that streamline complex data operations. Tasks that once required extensive development time and multiple network requests can now be executed through a single JSON command, significantly enhancing developer productivity and reducing operational costs.

Valkey-JSON supports six data types—**null, boolean, number, string, object, and array**—allowing developers to represent complex, nested data structures without the constraints of traditional string serialization. Unlike other composite types, JSON objects and arrays in Valkey can contain any combination of the six value types, enabling deeply nested and recursive data models to be stored natively.

Internally, Valkey-JSON utilizes an optimized **binary tree-like format**, which enables rapid traversal and manipulation of substructures without requiring full document parsing. This structure not only minimizes memory usage but also ensures that operations on specific paths remain efficient. Path-based commands like `JSON.GET`, `JSON.SET`, and `JSON.DEL` allow targeted interactions with specific elements, supporting multiple paths within a single operation. Additionally, Valkey-JSON integrates with Valkey’s Access Control Lists (ACLs), introducing a `@json` command category to enforce granular permissions alongside existing data types.

##  Getting Started with Valkey-JSON

Let’s now walk through a real-world example and see how simple, yet powerful Valkey-JSON is to use. 

### Installation and Setup

Valkey-JSON is a module and at time of writing, you'll need to build the module locally.
However, it is also available in the [valkey-extensions](https://hub.docker.com/r/valkey/valkey-extensions), a docker image with all the valkey modules built-in. 

#### 1. Build Valkey-JSON locally

```
git clone https://github.com/valkey-io/valkey-json.git
cd valkey-json
./build.sh
```

This will produce `libjson.so` inside the `bin/` or `build/` 

#### 2. Start Valkey with the JSON module

```
valkey-server --loadmodule /path/to/libjson.so
```

Check the server logs to confirm:

```
Module 'json' loaded successfully.
```

You’re ready to work with JSON in Valkey!

### Basic JSON Operations

Let’s take a real world example where you want to store a **list of users** in a single key like this:

```
> valkey-cli --raw -x json.set users $ <<EOF
 [
   {
     "name": "Alice",
     "email": "alice@example.com",
     "city": "Seattle", 
     "state": "WA"
   },
   {
     "name": "Bob",
     "email": "bob@example.com",
     "city": "Bellevue", 
     "state": "WA"
   },
   {
     "name": "Charlie",
     "email": "charlie@example.com",
     "city": "Austin", 
     "state": "TX"
   }
 ]
 EOF
> OK
```

Next, let’s say you want to fetch all the users in this list. 

```
127.0.0.1:6379>JSON.GET users
"[{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"city\":\"Seattle\",\"state\":\"WA\"},
{\"name\":\"Bob\",\"email\":\"bob@example.com\",\"city\":\"Bellevue\",\"state\":\"WA\"},
{\"name\":\"Charlie\",\"email\":\"charlie@example.com\",\"city\":\"Austin\",\"state\":\"TX\"}]"
```

That was easy! But what if we wanted to only retrieve the cities associated with our list of users rather than pulling all user information:

```
127.0.0.1:6379>JSON.GET users $[*].city
"[\"Seattle\",\"Bellevue\",\"Austin\"]"
```

##  Advanced JSON Queries

Valkey JSON supports sophisticated JSONPath expressions
Let us look at some powerful filtering using JSONPath expressions for in-database querying.

#### Retrieve all users from Washington State

```
127.0.0.1:6379>JSON.GET users '$[?(@.state=="WA")]'
"[{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"city\":\"Seattle\",\"state\":\"WA\"},
{\"name\":\"Bob\",\"email\":\"bob@example.com\",\"city\":\"Bellevue\",\"state\":\"WA\"}]"
```

This helps you find all users from the  `state`  of Washington - `"WA"`.

### Atomic Multi-Path Updates

Let's say you want to get names of users who are from WA and the ones not from WA?

```
127.0.0.1:6379> JSON.GET users '$[?(@.state=="WA")].name'
"[\"Charlie\"]"
127.0.0.1:6379> JSON.GET users '$[?(@.state!="WA")].name'
"[\"Alice\",\"Bob\"]"
```

This would return an array of names matching the condition

#### We can also get the emails of users from Seattle or Austin

```
127.0.0.1:6379> JSON.GET users '$[?(@.city=="Seattle" || @.city=="Austin")].email'
"[\"alice@example.com\",\"charlie@example.com\"]"
```

It makes it that simple to query and filter through JSON documents.

### Unlocking Real-World Potential with Valkey-JSON

Valkey-JSON is both powerful and easy to implement, making it an ideal solution for a wide range of real-world use cases. With native JSON support, developers can manage structured, nested data without complex serialization or parsing logic, enabling rapid, targeted updates and high-performance queries. Here are three impactful use cases that showcase how Valkey-JSON can drive real-world value:

### Per-User Event Counters for Ad or Notification Delivery

Valkey JSON excels in high-throughput systems that require tracking per-user counters for ad impressions, push notifications, or message deliveries. For example, an ad platform may store a JSON document per user with nested metadata for each campaign — including impression counts, last delivery timestamps, and click history. Instead of serializing and deserializing large blobs, Valkey JSON enables in-place updates using `JSON.NUMINCRBY` or `JSON.SET` on specific paths (e.g., `$.ad_campaigns.ad_123.count`). This reduces network I/O and latency while ensuring atomicity. Microservices can also retrieve only the required subfields using JSONPath queries, like `$.ad_campaigns.ad_123.lastSeen`, allowing for efficient real-time decisioning. Compared to alternatives like managing multiple hash keys or plain strings, this approach is both cleaner and faster — making it well-suited for ad tech and notification delivery platforms operating at millions of ops/sec under tight latency constraints.


### Shared Reference Metadata Store for Microservices

In distributed systems like games, e-commerce platforms, or internal developer tools, multiple microservices often need fast access to consistent, structured reference data. This can include things like product attributes, game character metadata, tax codes, or ID mappings — which are naturally stored as JSON documents. Valkey JSON provides an ideal solution for centralizing this reference data in-memory. Teams can store large JSON blobs (hundreds of KB or more) using `JSON.SET`, and services can retrieve targeted subfields using path expressions like `$.items[?(@.rarity=="epic")]` or `$.idToName["1234"]`. Updates happen in bulk during patch releases or deployment cycles, but reads are constant and latency-sensitive. By keeping this metadata in Valkey, services avoid making remote API calls or parsing local files, achieving very low lookup latency even under load. This pattern greatly simplifies infrastructure, improves cache coherency, and is especially powerful in cloud-native environments where rapid bootstrapping and shared context matter.


### Identity Graph and Profile Storage at Scale

For companies operating large-scale identity platforms — such as those in fintech, healthtech, or fraud detection — managing complex user or entity profiles is a core requirement. These profiles often include deeply nested data like names, contact info, document verification, scores, and historical activity. Valkey JSON allows each profile to be stored as a single JSON document and updated atomically as new data arrives, without needing to rewrite the entire object. Queries like `$.email`, `$.history[-1]`, or `$.risk.score` can be executed efficiently with sub-millisecond latency. When paired with Valkey Search, indexed queries on nested fields become possible — enabling real-time lookups like “find all profiles with unverified addresses in California.” This architecture supports hundreds of thousands of concurrent reads and writes per second and can scale to multi-terabyte datasets using hybrid RAM + Flash configurations. For workloads that demand both schema flexibility and ultra-low latency, Valkey JSON offers a compelling alternative to rigid relational databases or slower document stores.


## Integration with the Valkey Ecosystem

Ensuring smooth integration across data stores and libraries is vital for minimizing migration friction and maximizing developer productivity. Valkey-JSON is fully compatible with **Valkey 8.0 and above**, making it accessible to users on the latest Valkey versions without requiring additional configuration.

It is also compliant with **RFC7159 and ECMA-404**, adhering to widely accepted JSON standards. This alignment enables consistent JSON handling across Valkey modules and supports integration with **Valkey-Search**, and querying across JSON datasets for advanced analytics and data exploration. Additionally, Valkey-JSON integrates with **Valkey’s Access Control Lists (ACLs)**, providing fine-grained permissions for JSON commands alongside other data types like strings and hashes.

For users migrating from Redis, Valkey-JSON is designed as a **drop-in replacement for RedisJSON v2**, maintaining API and RDB compatibility. This ensures a smooth transition for RedisJSON users while leveraging Valkey’s optimized performance and scalability.

## Conclusion

The introduction of the Valkey JSON module is a significant milestone for developers building modern, data-driven applications. By bringing native JSON support into Valkey’s high-performance in-memory engine, it bridges the gap between structured document modeling and real-time responsiveness. Whether you’re updating millions of ad counters per second, serving game metadata to distributed microservices, or powering identity search across terabytes of profiles, ValkeyJSON simplifies your architecture while boosting speed and scalability. With Valkey 8.0 and beyond, developers gain a powerful, intuitive, and production-grade toolset to manipulate JSON data at scale — all with the familiar simplicity and reliability of Valkey.

Dive deeper into Valkey-JSON and see how easy it is to supercharge your JSON workloads with Valkey today!

For further exploration, refer to:

* [Valkey Official Documentation](https://valkey.io/topics/valkey-json/)
* [Valkey JSON GitHub Repository](https://github.com/valkey-io/valkey-json)

Thank you to all those who helped develop the module:

* Roshan Khatri ([roshkhatri](https://github.com/roshkhatri))
* Joe Hu ([joehu21](https://github.com/joehu21))
* Nikhil Manglore ([Nikhil-Manglore](https://github.com/Nikhil-Manglore))
* Cameron Zack ([zackcam](https://github.com/zackcam))

Happy coding
