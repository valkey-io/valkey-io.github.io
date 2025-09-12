+++
title= "Valkey: An Investment in Open Source"
description = "The new Swift client for Valkey is now in preview. Learn about its features and how it brings the performance of Valkey to the Swift language."
date= 2025-09-12 00:00:00
authors= [ "lorilorusso"]

[extra]
featured = true
featured_image = "/assets/media/featured/random-04.webp"
+++

Valkey was founded just over a year ago to keep high-performance key/value storage in the open source community: free from vendor lock-in and restrictive licenses. Backed by contributors from AWS, Google Cloud, Ericsson, Oracle, Alibaba, Huawei, Tencent, Percona, Aiven, Heroku, Verizon, Chainguard, and Canonical, the project shows how “free” in open source depends on investment: time, talent, and ongoing financial support.

### Built by Builders, Backed by the Linux Foundation

Valkey was created on March 28, 2024 and has solidified itself as the open-source high-performance key/value datastore that supports a variety of workloads such as caching, message queues, and can act as a primary database. Valkey is backed by the Linux Foundation, a neutral organization founded in 2000 that supports developers and technologists to scale and manage open source projects. Valkey operates under an open governance model focused on growing community contributions and adoption. 

### One Year In: Growth and Momentum

In just a year’s time the project has celebrated two major releases, an increase in corporate participants from 22 to 47, is defining, innovating, and executing on its roadmap, and is growing in its adoption. Users and the community have embraced the project and they are firm in their commitment to continue to improve Valkey for the benefit of all end users.

## New Valkey Features & Use Cases

### Solving Practical Problems with JSON and Bloom Filters

Two new data types, JSON and Bloom filters, expand what developers can do with Valkey, especially in distributed systems where speed and structure are equally important. These additions reduce complexity in application logic and improve how data is handled at the edge.  “Adding JSON and Bloom filters to Valkey is about giving developers practical tools to solve real-world problems in distributed systems,” says Madelyn Olson, Valkey co-maintainer.

JSON support allows developers to work with rich, structured data natively, instead of relying on custom serialization or extra middleware. “JSON lets you work with rich, structured data directly in Valkey, which simplifies development and reduces glue code,” Olson explains.

[Valkey Bloom filters](https://valkey.io/topics/bloomfilters/), on the other hand, offer a compact way to perform fast checks. “Bloom filters are ideal when you need to make fast, memory-efficient existence checks, whether you're trying to catch fraud or avoid unnecessary backend calls in a high-traffic service,” adds Olson.

As Olson put it, the goal is simple: “I’m really excited to see what problems our users will be able to solve with these new data types.”

### Valkey Search: Speed and Scale for AI Workloads

Google contributed a new module, [Valkey Search](https://github.com/valkey-io/valkey-search), which brings vector similarity search to Valkey. It’s fast, delivering single-digit millisecond latency and built to handle billions of vectors while maintaining over 99% recall.

Developers can run both approximate nearest neighbor (ANN) searches (via HNSW) and exact k-nearest neighbor (KNN) searches. It supports indexing with either Hash or [Valkey-JSON](https://github.com/valkey-io/valkey-json) data types. While Valkey Search currently focuses on vector search, future goals would extend Valkey into a broader search engine with full-text support and more indexing options.

### Performance, Reliability, and Security

Over the past year, contributors from companies like Ericsson, Oracle, and Percona have focused on making Valkey faster, safer, and more enterprise-ready. The following improvements showcase how Valkey is evolving to meet scaled production needs without compromising for any of its users.

#### Multithreading Improvements

Recent updates to Valkey’s internals improve how the system handles work across multiple threads, cutting down on lock contention and better using multi-core processors. This update significantly improves throughput under high concurrency, making the project more attractive for large-scale production use. Ericsson, one of Valkey’s core contributors, is already seeing real value in the project’s performance work. 

Viktor Söderqvist, Ericsson Software Technology Engineer & Valkey co-maintainer, points out the core efficiency as a key reason Valkey is becoming more production-ready. “To get the most out of the CPUs and memory in terms of storage efficiency and speed, the recent hashtable redesign lately improved with SIMD techniques as well as the recent and ongoing improvements in multithreading and memory batch-prefetching techniques are exciting areas of improvement.”

#### SIMD-Accelerated Hashtable Redesign

The project’s core hashtable was reengineered to leverage SIMD instructions, allowing Valkey to process key lookups more efficiently by handling multiple operations in parallel. These low-level optimizations translate to faster response times in latency-sensitive environments.

#### Batch Memory Prefetching

New support for batch memory prefetching helps reduce cache misses by anticipating access patterns and loading data proactively. The result is smoother performance and more consistent behavior under heavy or sequential access workloads.

#### LDAP Integration

LDAP integration brings centralized authentication and access control to Valkey, making it easier to deploy in enterprise environments with existing identity infrastructure. This feature addresses a common adoption barrier in security-conscious and compliance-driven organizations.

“A lot of our customers already rely on LDAP to manage access across their infrastructure, so bringing that to Valkey just made sense,” says Vadim Tkachenko, Co-Founder of Percona. “It’s one of those features that removes friction. You get auditability, group-based permissions, and it works with what teams already have in place.”

#### Rust Module

Oracle is contributing a Rust-based module SDK to Valkey, aimed at improving safety and performance for low-level extensions. By adopting Rust’s strong guarantees around memory and concurrency, the project opens the door to safer, more maintainable systems integration, especially for production environments under load.

### The Real Investment Behind Open Source Success

The investment in open source and choosing to employ contributors to the project clearly demonstrates that a key aspect in technological innovation is for companies at varying levels, enterprise to mom-and-pop shops, to succeed they need to work together and that means investing in the resources that can move projects forward \- the human capital of open source, the coders, the writers, the governance, and the community behind the ‘free’ moniker that we frequently associate with open source.

### What’s Happening With Valkey

On August 15, Valkey dropped the [first release candidate for 9.0](https://github.com/valkey-io/valkey/releases/tag/9.0.0-rc1). This testing release previews the new capabilities around atomic slot migrations, hash field expirations, and numbered databases in cluster mode alongside scads of performance enhancements and bug fixes. Additional release candidates are to follow with general availability of 9.0 in early autumn 2025\.

Parallel to the testing phase for 9.0, two events happened last month in Amsterdam:

* [Open Source Summit Europe \- Aug 25–27, 2025](https://events.linuxfoundation.org/open-source-summit-europe/):  Three-day conference for open source developers, technologists, and leaders featuring keynotes, sessions, and community networking.   
* [Valkey User Conference: Keyspace \- August 28, 2025](https://valkey.io/events/keyspace-2025/): A one-day conference for developers, SREs, and DevOps teams with sessions, lightning talks, and workshops. 
