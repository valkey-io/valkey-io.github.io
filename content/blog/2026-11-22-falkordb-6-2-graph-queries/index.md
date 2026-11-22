+++
title = "FalkorDB 6.2 Brings Graph Queries to Valkey"
date = 2026-11-22
description = "Model and query connected data directly in Valkey with FalkorDB’s low-latency graph engine."
authors = []

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = false
+++

When an AI agent retrieves context or an application traces service dependencies, piecing together relationships through repeated lookups can slow down a response. FalkorDB 6.2 runs directly in Valkey as a module, so developers can model those relationships in a property graph and traverse them with low-latency Cypher queries. Valkey is now the default runtime in FalkorDB’s Docker image, and our previous runtime remains supported through a separate image tag on Docker Hub.

The release marks general availability for FalkorDB 6.2, featuring the graph module rewritten in Rust. It also introduces an OSI-approved AGPLv3 license.

In this post, we explain why we chose Valkey, walk through a Cypher query that traces service dependencies, and look at what Valkey’s future could mean for graph deployments.

## Why we chose Valkey

For our team, choosing Valkey is about more than compatibility. It is an opportunity to build alongside a fast-growing open source community and contribute to the server that supports our graph engine.

When you develop a database module, the underlying server is part of your architecture. Its approach to memory management, persistence, replication and cluster coordination shapes what you can offer your users.

Valkey’s community-driven development gives us a way to participate in those decisions: contributing code, sharing requirements from graph workloads and working with other developers on common infrastructure challenges. We want to help advance that foundation, not simply consume it.

We chose Valkey in part because of what it’s building for the future. Work on data tiering, durability and active-active replication addresses problems that matter directly to graph applications from managing thousands of tenant graphs to supporting geographically distributed services.

Each of these future initiatives gives us a chance to work with the Valkey community to make Valkey a stronger platform for graph workloads.

## What FalkorDB adds to Valkey

FalkorDB models data as nodes and relationships, each of which can carry properties. Developers query that structure using Cypher, expressing connections directly rather than reconstructing them through application-side lookups.

Its low-latency graph query engine is designed for applications that need connected information in the request path, not just offline analysis. This matters for generative AI: an agent may retrieve context several times while answering a question or completing a task, so retrieval latency contributes directly to the time a user waits for a response.

FalkorDB also supports multiple distinct graphs within a deployment. Developers can organize knowledge into separate graphs for individual tenants, customers, projects or agents, rather than combining every entity and relationship into one graph. This provides a practical foundation for multi-tenant AI applications, with authorization and resource policies enforced as part of the deployment architecture.

Together, low-latency queries and multi-graph support make FalkorDB useful as a connected knowledge layer for several GenAI patterns:

- **Agentic memory:** represent entities, interactions, preferences and prior decisions as connected information that agents can update and retrieve across tasks. Separate graphs can scope memory to a customer, workspace or agent.
- **GraphRAG:** augment retrieval with relationships between documents, entities and events, helping an application assemble connected context rather than return only isolated text passages.
- **Code graphs:** connect functions, APIs, services and repositories with their dependencies and supporting documentation, giving coding agents context for investigating changes across a software estate.
- **A semantic layer:** connect business concepts, definitions and metrics to the systems and data sources that implement them, giving AI applications a shared vocabulary grounded in organizational knowledge.

These patterns can form parts of a real-time “company brain”: a queryable knowledge layer connecting an organization’s people, software, documents and business concepts. As applications ingest changes from source systems, they can update the graph and retrieve relevant relationships when an agent needs them. The goal is not to put the entire company into every prompt, but to make current, connected context available on demand, within the appropriate tenant and access boundaries.

FalkorDB supplies the graph storage and query engine as a module loaded into Valkey. Applications interact with it through graph commands such as `GRAPH.QUERY`.

## A small example: tracing service dependencies

Consider an application where a storefront depends on an orders service, which in turn depends on a database. If the database goes down, the on-call engineer needs to know whether the storefront is affected and why. With dependencies stored as per-service lists, tracing the path from the storefront to the database takes two sequential lookups, one per hop. With FalkorDB, a single Cypher query returns the full dependency path. With FalkorDB loaded into a running Valkey instance, we can create that graph using `valkey-cli`:

```bash
valkey-cli GRAPH.QUERY dependencies "CREATE (app:Application {name:'Storefront'}), (svc:Service {name:'Orders'}), (db:Database {name:'OrdersDB'}), (app)-[:DEPENDS_ON]->(svc), (svc)-[:DEPENDS_ON]->(db)"
```

Now ask which components depend, directly or indirectly, on the database:

```bash
valkey-cli GRAPH.QUERY dependencies "MATCH (component)-[:DEPENDS_ON*1..]->(:Database {name:'OrdersDB'}) RETURN DISTINCT component.name ORDER BY component.name"
```

The query returns Orders and Storefront. It follows the dependency chain rather than requiring the application to know in advance how many hops separate each component from the database.

The same pattern applies to software dependency maps, recommendation systems, fraud investigations and knowledge graphs used by AI applications.

**Valkey’s future aligns with graph workloads.** [The session “Durability and Beyond” at ValkeyConf 2026](https://valkey.io/blog/Valkeyconf-closing-keynote/) describes four areas of ongoing development that are particularly relevant to FalkorDB.

### Data tiering: making room for more tenant graphs

In a multi-tenant application, each tenant can have its own graph, but not every graph is active at the same time. Keeping infrequently accessed graphs entirely in memory can become expensive as the number of tenants grows.

Valkey’s proposed data-tiering architecture would keep hot data in memory while offloading colder values to lower-cost storage. For FalkorDB, this presents an opportunity to explore moving idle graph data out of memory and bringing it back when needed. Supporting module-managed graph data will require integration work, but the potential benefit is clear: capacity planning could depend less on keeping every tenant’s complete dataset resident at once.

### Durability: supporting system-of-record workloads

For applications that treat a graph as authoritative data, the behavior of an acknowledged write during failure is critical. Query speed alone is not enough.

Valkey’s durability work includes synchronous replication and stronger guarantees around when writes are acknowledged and exposed to readers. This direction aligns with our ambition to support more workloads where FalkorDB serves as the system of record. For example, an AI application could use FalkorDB to store an agent’s long-term memory, including user preferences and decisions the agent needs to recall across sessions. Delivering those guarantees for graph operations will require validating the full path through the module, replication, persistence and failover.

### Active-active replication: bringing access closer to users

Geographically distributed applications benefit when users can read and write through a nearby region rather than send every write across continents.

Valkey’s active-active work explores that model, with updates replicated between regions and conflicts resolved so state can converge. For graph applications, concurrent changes introduce additional questions about relationships and graph integrity. We see an opportunity to help address those requirements as the design develops.

The goal is to give applications low-latency access to graph data in their own region while updates propagate asynchronously across regions.

## A new release, with deployment choice

FalkorDB 6.2 brings together several changes:

- **Valkey module support:** load FalkorDB into Valkey to run graph workloads.
- **Valkey by default in Docker:** FalkorDB’s Docker image now uses Valkey by default. The previous runtime remains supported through a separate image tag on Docker Hub.
- **FalkorDB 6.x general availability:** the new Rust-based module reaches GA.
- **A choice of licenses:** FalkorDB is available under AGPL or SSPL. The AGPL option is OSI-approved; Valkey retains its own BSD license.

## Build with us

With FalkorDB 6.2, applications can retrieve connected context and trace multi-hop dependencies directly in Valkey using low-latency Cypher queries. Making Valkey our default container runtime reflects our commitment to that direction. We invite the Valkey community to try FalkorDB, share graph-workload requirements, report issues and contribute. You can find the project on Valkey's [integration page](https://valkey.io/integrations/) or [GitHub](https://github.com/FalkorDB/FalkorDB) and learn more in the [FalkorDB documentation](https://docs.falkordb.com/).

We are excited about what we can build on Valkey and what we can contribute back.
