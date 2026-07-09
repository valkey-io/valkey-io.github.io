+++
title = "Caching up with the Community: Deep Dive with Percona’s Kyle Davis"
date = 2026-07-09
description = "This segment features Kyle Davis, Percona's General Manager of the Redis and Valkey Ecosystem, explores how Valkey complements relational databases with high-performance in-memory caching, simplifies application development through native data structures, and enables low-latency workloads at scale. The conversation also covers the memory efficiency improvements and database-level ACLs introduced in Valkey 9.1, making it easier to consolidate secure, multi-tenant deployments." 
authors =  ["kyledvs","crystalpham"]
[taxonomies]
blog_type = ["Community Highlight"]
+++

<style>
.percona-spotlight-video { justify-content: center; display: flex;  }
.percona-spotlight-video iframe { aspect-ratio: 16 / 9; width: 100% !important; }
</style>
{{ youtube(id="cl3kwjG-Yzs", class="percona-spotlight-video") }}

Standard industry software consistently grows heavier, consuming more RAM with every minor update. Valkey reverses this trend entirely: upcoming engineering milestones drop the software's structural footprint, meaning a simple binary upgrade immediately hands back physical memory to the underlying infrastructure. Percona’s [General Manager of the Redis and Valkey Ecosystem, Kyle Davis](https://www.percona.com/press/percona-appoints-kyle-davis-as-general-manager-of-redis-valkey-ecosystem/), sat down to detail how the open source community drives these computational efficiencies, eliminates translation bottlenecks, and enforces database-level multi-tenancy.

## Architectural Patterns: The Relational Companion Layer

A common scaling bottleneck for databases (such as MySQL or PostgreSQL) is vertical resource exhaustion under heavy read/write query loads. 

>"Valkey is a database that's used alongside other databases, almost exclusively. There are situations where applications just use Valkey, but that's unusual. What we really see is Valkey deployed alongside MySQL, Postgres, or MongoDB."

Placing Valkey as an in-memory caching layer directly alongside a relational database allows organizations to defer or eliminate expensive hardware vertical scaling. Shifting high-concurrency lookup patterns to an in-memory layer reduces latency and maximizes overall write throughput.

## Eliminating Impedance Mismatch via Core Data Structures

A core driver of Valkey’s developer velocity is the native data model. Relational systems introduce object-relational impedance mismatch, requiring translation layers between persistent storage tables and application state. Valkey data types directly mirror memory structures used within application code.
For example, constructing and manipulating a local hash map within an application works efficiently at micro-scale. However, distributed architectures require this state to be shared across a decoupled cluster of stateless application nodes.

Valkey solves this dilemma by providing a highly available, network-accessible data structure store that scales out seamlessly. Because the API matches runtime data models, the learning curve remains minimal. Software developers can be useful with the entirety of the Valkey API within an eight-hour window, bypassing years of training required for relational databases.

## High-Concurrency Production Use Cases

Valkey's performance and low resource footprint fit low-latency operational workloads at massive scale:

- **Real-Time Fraud Detection**: High-throughput financial transaction processing requires synchronous evaluation of complex rule engines. Running Valkey at scale allows systems to capture, store, and mutate transaction states instantly, evaluating fraud indicators in single-digit milliseconds without introducing blocking latency into user checkout paths.
- **Smart Industrial Telemetry**: Internet of Things (IoT) hardware and modern smart manufacturing generate continuous metrics and telemetry streams. Large-scale factory deployments place a lightweight Valkey instance directly on the edge hardware alongside each industrial machine, buffering millions of raw events daily at the source before optimization and transmission to upstream long-term storage.

## Memory Footprint Optimization and Access Control in Valkey 9.1

Because Valkey processes operations fully in-memory, production workloads face constraints from available memory capacity rather than CPU cycles.
Compounding Memory Efficiencies

The release of [Valkey 9.1](https://valkey.io/blog/valkey-9-1-delivers-improvements-in-security-performance-and-more/) emphasizes optimizations across internal structures. Continuous optimization down to the byte level and memory layout yields a shrinking memory footprint across releases. Upgrading to 9.1 provides a purely software-driven efficiency gain, unlocking capacity on existing infrastructure without requiring code rewrites.

## Granular Security via Database-Level ACLs

[Valkey 9.0](https://valkey.io/blog/introducing-valkey-9/) introduced the ability to create numbered name-spaces on a cluster (logical databases), allowing safe key isolation. For example, a key named foo inside Logical Database 0 points to an integer, while a key named foo inside Logical Database 10 holds an entirely different dataset (like a binary blob) on the same cluster instance.

Valkey 9.1 advances consolidation by introducing **database-level Access Control Lists (ACLs)**. Configuration of explicit role-based permissions at the namespace layer follows a clean separation:
- **User A** operates with restrictions limiting query capabilities exclusively to Logical Database 0.
- **User B** authenticates exclusively for access to Logical Database 10.
This eliminates the broad, all-or-nothing access model inherent to older versions, allowing safe multi-use consolidation onto a single, tightly controlled Valkey cluster.

## Get involved

If you have questions, feedback, or just want to learn more, join our Slack community. It’s full of knowledgeable and helpful contributors who are happy to support questions, ideas, and discussions.

Other ways to connect:
- Connect with us on [LinkedIn](https://www.linkedin.com/company/valkey/), [X](https://x.com/valkey_io), [BlueSky](https://bsky.app/profile/valkeyio.bsky.social)
- Subscribe to our [newsletter](https://valkey.io/#:~:text=Subscribe%20for%20updates%2C%20event%20info%2C%20and%20the%20latest%20Valkey%20news)
- Watch videos on [YouTube](https://www.youtube.com/@valkeyproject)
