---
title: "Valkey Documentation"
---

The Valkey documentation is managed in markdown files in the
[valkey-doc repository](https://github.com/valkey-io/valkey-doc).
It's released under the
[Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/).

# Valkey Documentation
## 1. Introduction
   
* What is Valkey? See [Introduction](introduction.md).
* [Quick start](quickstart.md): Get started with Valkey.
* [Valkey Bundle](valkey-bundle.md): Get started with Valkey Bundle.
* [FAQ](faq.md): Frequently asked questions.

## 2. Developer Guide
### Core Concepts
* [Data types](data-types.md): Keys are strings, but values can be of many different data types.
* [The full list of commands](../commands/), with documentation for each of them.
* [Pipelining](pipelining.md): How to send multiple commands at once, saving on round trip time.
* [Transactions](transactions.md): Valkey's approach to atomic transactions.
* [Expires](../commands/expire.md): How to set a Time To Live (TTL) on key so that it will be automatically removed from the server when it expires.
* [Pub/Sub](pubsub.md): Using Valkey as a message broker using the Publish/Subscribe messaging system.
* [Keyspace notifications](notifications.md): Get notifications of keyspace events via Pub/Sub.
* [Keyspace management](keyspace.md): How to alter, query, and navigate the keyspace.

### Application Patterns & Tutorials

* [Valkey as an LRU cache](lru-cache.md): How to configure Valkey as a cache with a fixed amount of memory and automatic eviction of keys.
* [Client side caching](client-side-caching.md): How a client can be notified by the server when a key has changed.
* [Distributed locks](distlock.md): Implementing a distributed lock manager.
* [Secondary indexes](indexing.md): How to simulate secondary indexes, composed indexes and traverse graphs using various data structures.
* [Writing a simple Twitter clone with PHP and Valkey](twitter-clone.md)

## 3. Extending Valkey

### Server-side scripting in Valkey
* [Programmability overview](programmability.md): An overview of programmability in Valkey.
* [Introduction to Eval Scripts](eval-intro.md): An introduction about using cached scripts.
* [Introduction to Valkey Functions](functions-intro.md): An introduction about using functions.
* [Valkey Lua API](lua-api.md): The embedded [Lua 5.1](https://lua.org) interpreter runtime environment and APIs.
* [Debugging Lua scripts](ldb.md): An overview of the native Valkey Lua debugger for cached scripts.


### Valkey modules API
* [Introduction to Valkey modules](modules-intro.md): Extend Valkey using dynamically linked modules.
* [Implementing native data types](modules-native-types.md): Modules scan implement new data types (data structures and more) that look like built-in data types. This documentation covers the API to do so.
* [Blocking operations](modules-blocking-ops.md): Write commands that can block the client (without blocking Valkey) and can execute tasks in other threads.
* [Modules API reference](modules-api-ref.md): Documentation of all module API functions. Low level details about API usage.

## 4. Administration

### Core Management
* [License](license.md): License information for Valkey.
* [Installation](installation.md): How to install and configure Valkey. This targets people without prior experience with Valkey.
* [Release Downloads](https://valkey.io/download/releases/): Lists links to download all current and previous releases.
* [valkey-cli](cli.md): The Valkey command line interface, used for administration, troubleshooting and experimenting with Valkey.
* [valkey-server](server.md): How to run the Valkey server.
* [Configuration](valkey.conf.md): How to configure Valkey.
* [Persistence](persistence.md): Options for configuring durability using disk backups.
* [Signals Handling](signals.md): How Valkey handles signals.
* [Connections Handling](clients.md): How Valkey handles clients connections.
* [Migration](migration.md): How to migrate from Redis to Valkey.
* [Releases and Versioning](releases.md): Valkey's development cycle and version numbering.
* [Administration](admin.md): Various administration topics.

### Deployment Topology
* [Replication](replication.md): What you need to know to set up primary-replica replication.
* [Sentinel](sentinel.md): Valkey Sentinel is one of the official high availability deployment modes.
* [Sentinel client spec](sentinel-clients.md): How to build clients for Valkey Sentinel.
* [Cluster tutorial](cluster-tutorial.md): A gentle introduction to Valkey Cluster, a deployment mode for horizontal scaling and high availability.
* [Cluster specification](cluster-spec.md): The more formal description of the behavior and algorithms used in Valkey Cluster.
* [Atomic slot migration](atomic-slot-migration.md): An overview of atomic slot migration in Valkey Cluster.

### Security
* [Security](security.md): An overview of Valkey's security.
* [Access Control Lists](acl.md): ACLs make it possible to allow users to run only selected commands and access only specific key patterns.
* [TLS](tls.md): How to use TLS for communication.

### Platform Specific
* [ARM and Raspberry Pi](ARM.md): ARM and the Raspberry Pi are supported platforms. This page contains general information and benchmarks.
* [RDMA](RDMA.md): An overview of RDMA support.


## 5. Performance & Troubleshooting
* [Troubleshooting](problems.md): Problems? Bugs? High latency? Other issues? Use our problems troubleshooting page as a starting point to find more information.
* [Memory optimization](memory-optimization.md): Understand how Valkey uses RAM.
* [Latency monitoring](latency-monitor.md): Integrated latency monitoring and reporting help tuning for low latency.
* [valkey-benchmark](benchmark.md): The benchmarking tool shipped with Valkey.
* [On-CPU profiling and tracing](performance-on-cpu.md): How to find on-CPU resource bottlenecks.
* [Debugging](debugging.md): How to debug Valkey server processes.
* [Diagnosing latency issues](latency.md): How to diagnose latency problems with Valkey.
* [Mass insertion of data](mass-insertion.md): How to add a big amount of data to a Valkey instance in a short time.


## 6. Low-Level Internals
* [Protocol specification](protocol.md): The client-server protocol, for client authors.
* [Command key specifications](key-specs.md): How to extract the names of keys accessed by every command.
* [Command tips](command-tips.md): Command tips communicate non-trivial execution modes and post-processing information about commands.
* [Command arguments](command-arguments.md): An overview of command arguments as returned by the `COMMAND DOCS` command.

