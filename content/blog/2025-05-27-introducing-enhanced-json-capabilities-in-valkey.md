+++
title = "Introducing Enhanced JSON Capabilities in Valkey"
description = "Learn about the new Valkey JSON with some real-world examples and application."
sort_by = "2025-06-30 01:01:01"
authors= [ "roshkhatri"]
+++

JSON is a ubiquitous format for semi-structured data, and developers often expect native support across their technology stack, including in-memory stores like Valkey. Previously, working with JSON in Valkey required serializing entire objects as strings or flattening them into Hashes, limiting nesting. These workarounds added complexity and made updates harder than they should be.

That changes with the general availability of native JSON support in Valkey. You can now store, query, and update JSON documents directly, without manual parsing or transformation. This brings a cleaner model to working with semi-structured data and makes your code easier to write and maintain. Valkey JSON is fully compatible with **Valkey 8.0 and above**. It is also compliant with **RFC7159** and **ECMA-404**, adhering to widely accepted JSON standards which ensures consistent handling JSON data.

In this blog, we'll guide you through setting up the Valkey JSON module and demonstrate how to use it for some common workloads.

## Core Capabilities and Performance

Valkey JSON supports six data types-**null, boolean, number, string, object, and array**—allowing developers to represent complex, nested data structures without the constraints of traditional string serialization. Unlike other composite types, JSON objects and arrays in Valkey can contain any combination of the six value types, enabling deeply nested data models to be stored natively.

Internally, Valkey JSON utilizes an optimized **binary tree-like format**, which enables rapid traversal and manipulation of substructures without requiring the full document to be rewritten. This structure allows operations on specific paths to be efficient. Path-based commands like `JSON.GET`, `JSON.SET`, and `JSON.DEL` allow targeted interactions with specific elements, supporting multiple paths within a single operation. Additionally, Valkey JSON integrates with Valkey’s Access Control Lists (ACLs), introducing a `@json` command category to allow granular permissions alongside existing data types.

## Getting Started with Valkey JSON

Let’s walk through a practical example using Valkey JSON with the [`valkey-bundle`](https://hub.docker.com/r/valkey/valkey-bundle) Docker image.

### Installation and Setup

Valkey JSON comes pre-loaded in the `valkey-bundle`, which also includes other modules such as [valkey-bloom](https://github.com/valkey-io/valkey-bloom), [valkey-search](https://github.com/valkey-io/valkey-search) and [valkey-ldap](https://github.com/valkey-io/valkey-ldap) loaded on Valkey.

#### Start a Valkey bundle instance
```
docker run --name my-valkey-bundle -d valkey/valkey-bundle
```
This will start a docker container of Valkey with JSON module already loaded.

#### Connect with valkey-cli
To connect to your running instance using the built-in valkey-cli:
```
docker run -it --rm valkey/valkey-bundle valkey-cli
127.0.0.1:6379>
```

We will now verify the modules are loaded and Valkey JSON is one of them:
```
127.0.0.1:6379> MODULE LIST
.
.
3) 1) "name"
   2) "json"
   3) "ver"
   4) (integer) 10010
   5) "path"
   6) "/usr/lib/valkey/libjson.so"
   7) "args"
   8) (empty array)
.
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

Valkey JSON supports [JSONPath](https://goessner.net/articles/JsonPath/) expressions.
JSONPath is a query language for JSON documents, similar to XPath for XML. It allows users to select and extract specific data from a JSON document using a path-like expression.

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

#### Per-User Event Counters for Ad or Notification Delivery

Valkey JSON can be used for tracking per-user counters for ad impressions, push notifications, or message deliveries. An ad platform may store a JSON document per user with nested metadata for each campaign — including impression counts, last delivery timestamps, and click history. In-place updates using `JSON.NUMINCRBY` or `JSON.SET` on specific paths (e.g., `$.ad_campaigns.ad_123.count`). This reduces network I/O and latency while ensuring atomicity. Microservices can also retrieve only the required subfields using JSONPath queries, like `$.ad_campaigns.ad_123.lastSeen`, allowing for efficient real-time decisioning.


### Shared Reference Metadata Store for Microservices

Across games, e-commerce platforms, or internal developer tools, multiple microservices often need fast access to consistent, structured reference data. This can include things like product attributes, game character metadata, tax codes, or ID mappings — which are naturally stored as JSON documents. Valkey JSON can be used for centralizing this reference data in-memory. We can store JSON documents using `JSON.SET`, and services can retrieve targeted subfields using path expressions like `$.items[?(@.rarity=="epic")]` or `$.idToName["1234"]`. Updates happen in bulk during patch releases or deployment cycles, but reads are constant and latency-sensitive. By keeping this metadata in Valkey, services avoid making remote API calls or parsing local files, achieving very low lookup time even under load.


### Identity Graph and Profile Storage at Scale

For organization operating large-scale identity platforms — such as those in fintech, healthtech, or fraud detection — managing complex user or entity profiles is a core requirement. These profiles often include deeply nested data like names, contact info, document verification, scores, and historical activity. Valkey JSON allows each profile to be stored as a single JSON document and updated atomically as new data arrives, without needing to rewrite the entire object. Queries like `$.email`, `$.history[-1]`, or `$.risk.score` can be executed efficiently. This architecture supports concurrent reads and writes per second and can scale to multi-terabyte datasets using a mix of memory and persistent storage.

## Conclusion

Before Valkey JSON, developers often had to write extra serialization code, split JSON documents across keys, make additional round trips, or rely on external document stores alongside Valkey. Now, with native JSON commands, you can store, query, and update rich, nested structures directly in-memory and in real time. This removes architectural complexity, reduces latency, and extends Valkey’s high-performance design to modern, document-centric use cases.

Explore Valkey JSON in more depth and start building with it today!

See the following resources for details and ways to contribute:

* [Valkey Official Documentation](https://valkey.io/topics/valkey-json/) to learn more.
* [Valkey JSON GitHub Repository](https://github.com/valkey-io/valkey-json) for issues or feature requests.
* [Valkey Bundle](https://hub.docker.com/r/valkey/valkey-bundle) to start building with Valkey JSON.

Happy coding!