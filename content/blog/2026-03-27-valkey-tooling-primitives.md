+++
title = "What Valkey's new primitives tell us about the tools we need"
date = 2026-03-27
description = "Valkey ships powerful operational primitives like COMMANDLOG, SLOT-STATS, and upcoming per-thread I/O metrics — but without purpose-built tooling, much of that value goes unrealized."
authors = ["kivanow"]

[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-04.webp"
+++

Valkey is protocol-compatible with Redis and supports the full Redis 7.2.4 command API. That's one of its greatest strengths - existing clients are largely compatible, the learning curve is not steep. It's also, quietly, a problem for tooling.

Because compatibility means every tool built before Valkey existed technically "works" with it - tools that haven't been updated to take advantage of what Valkey now offers natively. And when something works well enough, nobody builds a better version. Why would they?

The release of [Valkey Admin](https://github.com/valkey-io/valkey-admin) is a signal that the community already knows this is a problem worth solving. It's also a useful frame for the broader question: what do Valkey's newer primitives actually make possible, and are the tools keeping up?

## Primitives that deserve purpose-built tooling

[LATENCY history](https://valkey.io/commands/latency-history/) has been in Valkey (and Redis before it) for a while, but it's consistently underused because the data is rarely captured continuously. Valkey maintains a history of latency events - fork operations, AOF flushes, AOF rewrites. When you collect this over time, questions like "did our latency spike coincide with an AOF flush?" become answerable. Without continuous collection, you're left staring at the current state and reasoning backward with no evidence.

Valkey has taken this further with two primitives that have no Redis equivalent.

[COMMANDLOG](https://valkey.io/commands/commandlog-get/) (8.1+) is the clearest example. Unlike SLOWLOG, which only flags commands that exceed an execution time threshold, COMMANDLOG tracks by three separate criteria: slow execution, large request payloads, and large reply payloads.

The distinction matters more than it looks. A command retrieving a 50MB hash may execute quickly - the data is in memory, the read is fast - but it's saturating your network, causing tail latency for every other client sharing that connection, and buffering data in ways that won't show up in slowlog at all. You end up with rising P99 latency and no obvious culprit, because the traditional tool for finding slow commands says everything is fine. COMMANDLOG with large-reply tracking shows you exactly which command patterns are the problem - something that simply wasn't possible to diagnose this way before.

[CLUSTER SLOT-STATS](https://valkey.io/commands/cluster-slot-stats/) (8.0+) gives you per-slot key counts, reads, writes, and CPU usage across a cluster. Before this, shard balancing was largely a guessing game based on aggregate node metrics - you could see that a node was hot, but not which slots were driving it. With SLOT-STATS you can identify specific hot slots and make targeted rebalancing decisions backed by actual data rather than intuition.

## Purpose-built tooling exists, and it's coming to Valkey

Redis recognized this early. Redis Insight and the Redis Insight VS Code extension exist precisely because the generic tools weren't enough - operators needed something that understood Redis's data model, its operational commands, and how developers actually interact with it day to day. The investment made sense because the tool could be built around the specific primitives Redis exposed.

Valkey is getting the same treatment. [Valkey Admin](https://github.com/valkey-io/valkey-admin) - the project's own operator tool, and the closest thing to a Valkey-native alternative to Redis Insight - is a clear signal that the community recognizes this. On the editor side, a VS Code extension for Valkey brings the same workflow into the development environment. But the point isn't any specific tool. The point is that the category needs to exist, and it needs to keep pace with what Valkey is shipping.

There's a harder problem underneath this though: most of Valkey's operational data is ephemeral by design. The slowlog is a circular buffer. COMMANDLOG entries don't persist across restarts. Command patterns that caused a latency spike hours ago leave no trace unless something was collecting continuously. Purpose-built tooling needs to solve for persistence, not just presentation.

## The right analogy

You can use JavaScript for backend services. Node.js is perfectly capable, the ecosystem is vast, and a lot of teams do it. But if you need high throughput or tight memory control, you probably want Go or Rust - not because JS is broken, but because the problem warrants a better fit. The same logic applies to desktop tooling: Electron works, and it ships fast, but you're bundling a browser engine to display a web UI. It runs, but it carries a lot of weight for what it's doing.

Redis-compatible tools work with Valkey for the same reason Node.js works for backends. They operate at the wire protocol level, which is compatible. But Valkey-specific primitives like COMMANDLOG have no Redis equivalent, so no Redis-era tool has a UI for it, a Prometheus exporter for it, or a way to persist and query its history. You can call it from the CLI, but that's about it. The fit just isn't there.

## What's coming in 9.1 makes this more urgent

Two PRs currently targeting 9.1 illustrate where Valkey is headed.

The first is per-thread I/O utilization metrics ([PR #2463](https://github.com/valkey-io/valkey/pull/2463)). New `used_active_time_io_thread_N` fields in `INFO` will expose how much time each I/O thread actually spends doing work versus waiting for it. Since Valkey's I/O threads do busy polling, CPU utilization alone is misleading - a thread can show near 100% CPU while barely processing any work. The new fields use a monotonic clock to measure active time, making real utilization calculable over any time window. Paired with COMMANDLOG, this opens up an interesting class of correlations: if large-request or large-reply patterns coincide with high I/O thread active time, you're likely looking at bandwidth saturation rather than a compute bottleneck.

The second is CLUSTERSCAN ([PR #2934](https://github.com/valkey-io/valkey/pull/2934)), a new cluster-native SCAN command that iterates across all slots while handling MOVED redirections automatically. The cursor format encodes slot information and a fingerprint of the memory layout - if the cluster reshards mid-scan, it restarts from the affected slot rather than returning an error. For tooling this changes what cluster-wide key inspection can look like. Every current tool handles this with node-by-node iteration. CLUSTERSCAN makes a cleaner approach possible.

Both of these need tooling adoption to be useful at scale. The I/O thread metrics need continuous collection - a one-time snapshot tells you nothing about what thread utilization looked like during the incident window. CLUSTERSCAN needs tooling to implement it before operators benefit from it in their debugging workflows. Features that don't have good tooling get underused, regardless of how good the implementation is.

## The observability gap

The reason this keeps coming up is that Valkey's development has accelerated. 8.0 shipped multi-threaded I/O and SLOT-STATS. 8.1 added COMMANDLOG. 9.0 brought hash field expiration, atomic slot migration, and multi-database cluster mode. Each of these adds operational surface.

Hash field expiration introduces TTL behavior at a new granularity - reasoning about memory behavior requires visibility into expiring-key counts at the field level, not just the key level. Atomic slot migration changes how resharding works - tooling for planning and monitoring migrations needs to understand the new model. And so on.

The community has invested heavily in the core. The more the ecosystem builds tools that treat Valkey's primitives as first-class features - not as Redis extensions to be gracefully ignored - the more value operators actually get out of them.

## Tooling is an ongoing topic, not a one-time decision

Valkey's development isn't slowing down. New primitives will keep landing, each adding operational surface that existing tools weren't built to handle. The gap between what Valkey exposes and what the tooling ecosystem can see isn't a problem to solve once - it's something to keep pace with.

The good news is the community is already moving. [Valkey Admin](https://github.com/valkey-io/valkey-admin) is open source and in preview, actively looking for contributions. A [VS Code extension for Valkey](https://github.com/BetterDB-inc/vscode) is also available if you prefer working from the editor. If you're building something in this space or have operational lessons worth sharing, [reach out on LinkedIn](https://www.linkedin.com/in/kivanow) - happy to talk through it.

