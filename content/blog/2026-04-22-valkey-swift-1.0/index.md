+++
title= "Valkey-swift - Announcing 1.0 Release"
description = "We are excited to announce the 1.0 release of valkey-swift, a client library for Valkey written in Swift."
date= 2026-04-22 00:00:00
authors= [ "adamfowler", "nilanshusharma"]

[taxonomies]
blog_type = ["Announcements"]
[extra]
featured_image = "/assets/media/featured/random-04.webp"
+++
Last summer, we introduced the preview [release](https://valkey.io/blog/valkey-swift/) of [valkey-swift](https://github.com/valkey-io/valkey-swift). This 1.0 release delivers a production-ready client with stable APIs that takes full advantage of all the modern features of Swift 6.

## Introduction

Valkey-swift is a production-grade Swift client built with modern Swift features in mind. Using Valkey with Swift provides strongly typed APIs with clean semantics, memory-safety and data-race-safety guarantees, and a very light memory footprint. The API uses Swift's structured concurrency — a paradigm designed to bring clarity to concurrent programming by using the structure of your code to automatically define the lifetimes of tasks and associated resources. This allows you to write clean concurrent code without worrying about its side effects like race conditions and connection leaks.

## Features

Features included in our preview release of valkey-swift:

- Supporting all the available Valkey commands. Using custom code generation tools we ensure that we are always up to date with the latest set of commands that Valkey offers.
- Cluster-mode-compatible client with cluster-aware routing, dynamic topology discovery, and handling cluster MOVED redirections.
- Command pipelining to improve performance by batching multiple commands in a single request and connection.
- Support for publish and subscribe to message queues by running multiple subscriptions on a single connection.
- Connection pooling for performance and resilience with support for connections over TLS for end-to-end encryption.
- Support for Valkey Modules: valkey-bloom, valkey-json.

## What's New 

Since the preview release, we have made significant improvements to the cluster client. Cluster mode error handling is now more robust, with seamless support for ASK and MOVED redirections, and TRYAGAIN errors. We reduced downtime during failovers and connection loss from 30 seconds to under 2 seconds. 

The cluster client also now has feature parity with the standard client. Cluster client supports cluster-level pipelines and transactions by splitting pipelines across correct shards, so the user doesn't have to worry about the location of their keys. We have also improved subscription connection management wherein both the standalone and the cluster client now allocate a single shared connection for all subscriptions instead of allocating a connection for each subscription.

Finally, both standalone and cluster clients support reading from replicas for scaling reads. Currently, we only support round-robin-based replica selection, but we intend to extend this to include latency aware and AZ-aware methods.

Other improvements in version 1.0 include:
- Support for new commands from Valkey 9.0.
- Support for distributed tracing.
- Dynamic command pipelines defined at runtime. Previously a series of pipelined commands could only be defined at compile time.
- Client configuration for accessing a numbered database.
- Support for the Valkey module valkey-search.

## What’s Next 

Valkey-swift is constantly adding new features. Upcoming features include: 

- Sentinel mode support.
- Cluster-wide multi-key commands.
- Integration with the Swift package swift-metrics.
- And much more!

## Contributing

Valkey-swift is open source under the Apache 2.0 license, and contributions are welcome — bug reports, feature requests, and pull requests. Check out open [issues](https://github.com/valkey-io/valkey-swift/issues) on GitHub for a good starting point.

