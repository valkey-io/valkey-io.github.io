+++
title = "Introducing Enhanced JSON Capabilities in Valkey"
description = "Learn more about the new Valkey JSON module with some real-world examples and application."
sort_by = "2025-06-03 01:01:01"
authors= [ "roshkhatri"]
+++

JSON is a ubiquitous format for semi-structured data, and developers often expect native support across their technology stack, including in-memory stores like Valkey. Previously, working with JSON in Valkey required serializing entire objects as strings or flattening them into Hashes, limiting nesting. These workarounds added complexity and made updates harder than they should be.

That changes with the general availability of native JSON support in Valkey. You can now store, query, and update JSON documents directly, without manual parsing or transformation. This brings a cleaner model to working with semi-structured data and makes your code easier to write and maintain.

In this post, we'll guide you through setting up the Valkey JSON module and demonstrate how to use it for some common workloads.

## Core Capabilities and Performance

Valkey’s JSON support goes beyond basic storage and retrieval. It introduces powerful querying and filtering capabilities that streamline complex data operations. Tasks that once required extensive development time and multiple network requests can now be executed through a single JSON command, significantly increasing developer productivity and reducing operational costs.

Valkey JSON supports six data types—**null, boolean, number, string, object, and array**—allowing developers to represent complex, nested data structures without the constraints of traditional string serialization. Unlike other composite types, JSON objects and arrays in Valkey can contain any combination of the six value types, enabling deeply nested and recursive data models to be stored natively.

Internally, Valkey JSON utilizes an optimized **binary tree-like format**, which enables rapid traversal and manipulation of substructures without requiring full document parsing. This structure not only minimizes memory usage but also ensures that operations on specific paths remain efficient. Path-based commands like `JSON.GET`, `JSON.SET`, and `JSON.DEL` allow targeted interactions with specific elements, supporting multiple paths within a single operation. Additionally, Valkey JSON integrates with Valkey’s Access Control Lists (ACLs), introducing a `@json` command category to enforce granular permissions alongside existing data types.

##  Getting Started with Valkey JSON

Let’s walk through a real-world example and see how Valkey JSON can be used. 

### Installation and Setup

Valkey JSON is a module and at time of writing, you'll need to build the module locally.
However, it is also available in the [valkey-extensions](https://hub.docker.com/r/valkey/valkey-extensions), a docker image with all the valkey modules built-in. 

#### 1. Build Valkey JSON locally

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

Let's connect to the valkey-server with `valkey-cli` client for the following commands.

We will now verify the module is loaded:

```
127.0.0.1:6379> MODULE LIST
1) 1) "name"
   2) "json"
   3) "ver"
   4) (integer) 10000
   5) "path"
   6) "/usr/lib/valkey/libjson.so"
   7) "args"
   8) (empty array)
```

You’re now ready to work with JSON in Valkey!

### Basic JSON Operations

Let’s take a real world example where you want to store a **list of users** in a single key like this:

```
127.0.0.1:6379> JSON.SET users $ '[{"name":"Alice","email":"alice@example.com","city":"Seattle","state":"WA"},{"name":"Bob","email":"bob@example.com","city":"Bellevue","state":"WA"},{"name":"Charlie","email":"charlie@example.com","city":"Austin","state":"TX"}]'
OK
```
This command stores a JSON array of user objects at the root path `$` under the key `users`. You can visualize it like this:
```
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
```

Next, let’s say you want to fetch all the users in this list. 

```
127.0.0.1:6379>JSON.GET users
"[{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"city\":\"Seattle\",\"state\":\"WA\"},
{\"name\":\"Bob\",\"email\":\"bob@example.com\",\"city\":\"Bellevue\",\"state\":\"WA\"},
{\"name\":\"Charlie\",\"email\":\"charlie@example.com\",\"city\":\"Austin\",\"state\":\"TX\"}]"
```

Now we will retrieve only the cities associated with each user:

```
127.0.0.1:6379>JSON.GET users $[*].city
"[\"Seattle\",\"Bellevue\",\"Austin\"]"
```

##  Advanced JSON Queries

Valkey JSON supports [JSONPath](https://goessner.net/articles/JsonPath/) expressions
Let us look at some filtering using JSONPath.

#### Retrieve all users from Washington State

```
127.0.0.1:6379>JSON.GET users '$[?(@.state=="WA")]'
"[{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"city\":\"Seattle\",\"state\":\"WA\"},
{\"name\":\"Bob\",\"email\":\"bob@example.com\",\"city\":\"Bellevue\",\"state\":\"WA\"}]"
```

Here, JSONPath syntax is used to filter data from a JSON document.
Let's break it down on how that works:
- `$` represents the root of the JSON document
- `[...]` indicates we're working with an array
- `?()` is a filter expression that applies a condition
- `@` refers to the current object being processed in the array
- `.state` accesses the "state" property of the current object
- `=="WA"` checks if that property equals the string "WA"

### Multi-Path Queries

Below we retrieve the names of users from WA and those from other states:

```
127.0.0.1:6379> JSON.GET users '$[?(@.state=="WA")].name'
"[\"Charlie\"]"
127.0.0.1:6379> JSON.GET users '$[?(@.state!="WA")].name'
"[\"Alice\",\"Bob\"]"
```

#### We can also get the emails of users from Seattle or Austin

```
127.0.0.1:6379> JSON.GET users '$[?(@.city=="Seattle" || @.city=="Austin")].email'
"[\"alice@example.com\",\"charlie@example.com\"]"
```

### Key Use Cases for with Valkey JSON

With native JSON support, developers can manage structured, nested data without complex serialization or parsing logic, enabling rapid, targeted updates and high-performance queries. Here are three impactful use cases that showcase how Valkey JSON can drive value:

### Per-User Event Counters for Ad or Notification Delivery

Valkey JSON works well in high-throughput systems that require tracking per-user counters for ad impressions, push notifications, or message deliveries. For example, an ad platform may store a JSON document per user with nested metadata for each campaign — including impression counts, last delivery timestamps, and click history. Instead of serializing and deserializing large blobs, Valkey JSON enables in-place updates using `JSON.NUMINCRBY` or `JSON.SET` on specific paths (e.g., `$.ad_campaigns.ad_123.count`). This reduces network I/O and latency while ensuring atomicity. Microservices can also retrieve only the required subfields using JSONPath queries, like `$.ad_campaigns.ad_123.lastSeen`, allowing for efficient real-time decisioning. Compared to alternatives like managing multiple hash keys or plain strings, this approach is both cleaner and faster — making it well-suited for ad tech and notification delivery platforms operating at millions of ops/sec under tight latency constraints.


### Shared Reference Metadata Store for Microservices

Across games, e-commerce platforms, or internal developer tools, multiple microservices often need fast access to consistent, structured reference data. This can include things like product attributes, game character metadata, tax codes, or ID mappings — which are naturally stored as JSON documents. Valkey JSON provides an ideal solution for centralizing this reference data in-memory. Teams can store large JSON blobs (hundreds of KB or more) using `JSON.SET`, and services can retrieve targeted subfields using path expressions like `$.items[?(@.rarity=="epic")]` or `$.idToName["1234"]`. Updates happen in bulk during patch releases or deployment cycles, but reads are constant and latency-sensitive. By keeping this metadata in Valkey, services avoid making remote API calls or parsing local files, achieving very low lookup latency even under load. This pattern greatly simplifies infrastructure, improves cache coherency, and is especially in cloud-native environments where rapid bootstrapping and shared context matter.


### Identity Graph and Profile Storage at Scale

For organization operating large-scale identity platforms — such as those in fintech, healthtech, or fraud detection — managing complex user or entity profiles is a core requirement. These profiles often include deeply nested data like names, contact info, document verification, scores, and historical activity. Valkey JSON allows each profile to be stored as a single JSON document and updated atomically as new data arrives, without needing to rewrite the entire object. Queries like `$.email`, `$.history[-1]`, or `$.risk.score` can be executed efficiently with sub-millisecond latency. This architecture supports hundreds of thousands of concurrent reads and writes per second and can scale to multi-terabyte datasets using a mix of memory and persistent storage. For workloads that demand both schema flexibility and ultra-low latency, Valkey JSON offers a compelling alternative to rigid relational databases or slower document stores.


## Integration with the Valkey Ecosystem

Ensuring smooth integration across data stores and libraries is vital for minimizing migration friction and maximizing developer productivity. Valkey JSON is fully compatible with **Valkey 8.0 and above**, making it accessible to users on the latest Valkey versions without requiring additional configuration.

It is also compliant with **RFC7159** and **ECMA-404**, adhering to widely accepted JSON standards which ensures consistent handling JSON data. Valkey JSON also integrates with **Valkey’s Access Control Lists (ACLs)**, providing fine-grained permissions for JSON commands alongside other data types like strings and hashes.

For users migrating from Redis, Valkey JSON is designed as a **drop-in replacement for RedisJSON v2**, maintaining API and RDB compatibility. This ensures a smooth transition for RedisJSON users while leveraging Valkey’s optimized performance and scalability.

## Conclusion

The introduction of the Valkey JSON module is a significant milestone for developers building modern, data-driven applications. By bringing native JSON support into Valkey’s high-performance in-memory engine, it bridges the gap between structured document modeling and real-time responsiveness. Whether you’re updating millions of ad counters per second, serving game metadata to distributed microservices, or powering identity search across terabytes of profiles, ValkeyJSON simplifies your architecture while boosting speed and scalability. With Valkey 8.0 and beyond, developers gain a powerful, intuitive, and production-grade toolset to manipulate JSON data at scale — all with the familiar simplicity and reliability of Valkey.

Explore Valkey JSON in more depth and start building with it today!

See the following resources for details and ways to contribute:

* [Valkey Official Documentation](https://valkey.io/topics/valkey-json/) to learn more.
* [Valkey JSON GitHub Repository](https://github.com/valkey-io/valkey-json) for issues or feature requests.
* [Valkey Extensions](https://hub.docker.com/r/valkey/valkey-extensions) to start building with Valkey JSON.

Thank you to all those who helped develop the module:

* Roshan Khatri ([roshkhatri](https://github.com/roshkhatri))
* Joe Hu ([joehu21](https://github.com/joehu21))
* Nikhil Manglore ([Nikhil-Manglore](https://github.com/Nikhil-Manglore))
* Cameron Zack ([zackcam](https://github.com/zackcam))

Happy coding!