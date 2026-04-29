+++
title = "Architecting for 1B+ RPS: Safety Nets, Not Benchmarks"
date = 2026-05-05
description = "When Valkey metrics look fine but your app is failing, the problem is usually coordination. Real lessons from Uber and Snap running Valkey at 1B+ RPS."
authors = ["allenhelton"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-04.webp"
+++


The alerts are firing. Users cannot complete requests. The cache dashboard shows CPU normal, memory normal, hit rate normal, p99 within SLA. The Valkey node metrics are all green. The cluster topology has not changed. Yet the application is still failing.

This is one of the more disorienting situations in distributed systems. The component everyone assumes is the culprit is behaving perfectly, and the system is broken anyway. The failure is not in the cache itself. It is in how the cache interacts with everything around it: the clients, the connection pools, the proxies, and the retry logic baked into client libraries that were never designed to account for a fleet of thousands of service instances all responding to the same transient error at the same millisecond.

At extreme scale, the hardest failures rarely come from a single component breaking. They come from *thousands of systems reacting to the same failure at the same moment*.

At [Unlocked San Jose](https://unlockedconf.io) earlier this year, engineers from Uber and Snap each walked through what operating cache infrastructure at extreme scale teaches you. Uber runs roughly 1 billion cache operations per second across 2,000 clusters. Snap recently completed a migration of 350 caches off a long-lived Redis fork to Valkey. Neither talk was primarily about throughput. Both were about the failure modes that benchmarks never surface, and the safety mechanisms they use to prevent outages.

## **Benchmarks do not model your retry behavior**

There is a specific failure mode called a [connection storm](https://www.gomomento.com/blog/understanding-the-nxm-problem-in-distributed-caches/). It's a classic example of a system doing exactly what it was designed to do and making everything worse.

Uber's microservices run many instances, each using a client with a connection pool per Valkey node. Under normal conditions this is efficient and fast. Then a node becomes briefly unavailable due to a network hiccup, a host reboot, or a momentary resource spike. The client detects the I/O error, closes the connection, and creates a new one. That is correct behavior for a single client.

The problem is that this happens across hundreds or thousands of instances simultaneously. Every instance that touched that node in the last few hundred milliseconds sees the same error. Every one of them closes its connection and immediately sends new connection requests to the already-stressed node. TCP handshakes, TLS negotiation, and authentication all land at once. The node, which might have recovered in seconds, instead hits 100% CPU and stops responding.

![Illustration showing what happens when one node slows down](architecting_for_1b_1.webp)

The retry behavior that protects a single client destroys the cluster at fleet scale. Benchmarks never capture this because they do not model thousands of clients responding to shared state simultaneously.

Uber's immediate fix was to use [`iptables` rules](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-using-iptables-on-ubuntu-14-04) to cut traffic to the impacted node before the feedback loop completed. Stopping the amplification gives the node space to recover without a continuing flood of new connection attempts.

The longer-term fix was structural. Upgrading their client from Go Redis v8 to v9 removed the aggressive connection reaping behavior that made the storm so severe. Adding per-node client-side rate limiters and circuit breakers meant that even if a node degraded, the client fleet could no longer amplify that degradation into an outage.

## **How Valkey responds to connection storms**

This is where Valkey's architecture becomes directly relevant to the connection storm failure mode. The problem during a storm is that TLS handshakes and socket polling are expensive operations that compete with command execution on the main thread.

Valkey 8.0 significantly [overhauled I/O threading](https://valkey.io/blog/valkey-8-0-0-rc1/#performance), allowing the main thread and I/O threads to operate concurrently. I/O threads handle reading and parsing commands, writing responses, polling for I/O events via `epoll_wait`, and memory deallocation. Previously, `epoll_wait` alone consumed more than [20% of main thread time](https://valkey.io/blog/unlock-one-million-rps/#high-level-design). Offloading it frees the main thread to spend more cycles executing commands rather than managing I/O.

The performance results from that release were substantial: throughput increased approximately 230%, from 360K to 1.19M requests per second compared to Valkey 7.2, with average latency decreasing 69.8% from 1.792ms to 0.542ms. These numbers were measured with 8 I/O threads on an AWS EC2 C7g.16xlarge instance using 3M keys, 512-byte values, and sequential SET commands.

Valkey 8.1 went further, [offloading TLS negotiation to I/O threads](https://valkey.io/blog/valkey-8-1-0-ga/#i-o-threads-improvements). That change alone improved the rate of accepting new connections by around 300%, directly addressing the scenario where a burst of new connections during a storm previously blocked the main thread from serving existing ones. The same release also offloaded `SSL_pending()` and `ERR_clear_error()` calls to I/O threads, producing a measured 10% improvement in `SET` throughput and 22% in `GET` throughput for TLS workloads.

To configure I/O threading, the key parameter is `io-threads`. One important detail: the count includes the main thread. Setting `io-threads 6` launches 5 dedicated I/O threads plus the main thread. The Valkey 9.0 [large cluster benchmark](https://valkey.io/blog/1-billion-rps/#benchmarking) used the following configuration on 8-core r7g.2xlarge nodes, pinning 2 cores to interrupt affinity and assigning the remaining 6 to Valkey:

```bash
# valkey.conf
cluster-enabled yes
cluster-config-file nodes.conf
cluster-require-full-coverage no
cluster-allow-reads-when-down yes
io-threads 6
maxmemory 50gb
save ""
```

That setup achieved over 1 billion `SET` requests per second across a 2,000-node cluster, with throughput scaling nearly linearly with primary count. For production sizing, the practical starting point is `io-threads` equal to the available core count minus 1 to 2, with the remainder reserved for OS and interrupt handling.

### Cluster-level storms

The connection storm problem is not limited to application clients. Uber observed it between service instances and Valkey nodes. Valkey 9.0 addressed an analogous problem inside the cluster itself.

When hundreds of nodes fail simultaneously, each surviving node was attempting to reconnect to all failed nodes every 100ms, consuming significant CPU on connection management rather than serving requests. Valkey 9.0 introduced a [throttling mechanism](https://github.com/valkey-io/valkey/pull/2154) scoped to the configured `cluster-node-timeout`, ensuring enough reconnect attempts occur within a reasonable window while preventing surviving nodes from being overwhelmed by their own recovery behavior. This is the same principle as Uber's `iptables` approach, applied natively inside the cluster bus.

### The proxy can be the storm too

Uber's architecture includes an L4 proxy between application instances and Valkey. During the migration to native clusters, their team found a second form of connection storm originating at the proxy layer.

During bursts of new connections, the proxy becomes a bottleneck. TLS setup, memory allocation for new connection state, and file descriptor management all compete for resources. Existing connections slow down. Slower connections trigger application timeouts. Timeouts trigger more retries. More retries create more new connections. The same feedback loop, one layer upstream.

To address this issue, Uber added fairness algorithms in the proxy to explicitly prioritize traffic from established connections over new ones. Under pressure, the proxy serves the work it has already committed to before taking on new work.

![Illustration showing fairness prioritization of connections](architecting_for_1b_2.webp)

A proxy that explicitly delays new connections while existing ones flow smoothly will look worse in a benchmark, but it behaves far better during an incident. Accepting less work is often more reliable than accepting all work slowly.

### Where the storms really come from

Both of these storms are downstream of a structural issue: *too many connections.*

At Uber, each stateless service instance maintains a pool of `p` connections per Valkey node. If `n` instances are running, each node sees `n x p` connections. For a large service with thousands of instances and a pool size of even 5 to 10, a single node can see tens of thousands of connections under normal operation. During a retry storm, that number spikes sharply.

This is not a misuse of the system. It is what direct-connect architectures look like at scale. The surface area for connection-related failure grows with every new service instance and every node added to the cluster.

Uber's mitigations focused on reducing the effective connection rate: client-side caching for hot keys to reduce round trips, request deduplication, and batching operations like hash-field deletions into multi-key commands. They explored I/O multiplexing through Java's Lettuce client (also available in [Valkey GLIDE](https://glide.valkey.io/concepts/architecture/async-execution/#rust-core-multiplexing)), which allows a single connection to carry many concurrent requests and directly reduces the `p` in the `n × p` equation.

## **Build the safeguards before you need them**

Snap moved 350 caches off KeyDB, a multithreaded Redis 6.2 fork, to Valkey without application teams noticing the change. A proxy abstraction in front of their clusters made that possible. Application code kept using the same APIs while the backend swapped underneath.

But the interesting part of the story is what they built to make the migration safe.

### Write throttling at 95% CPU

When a cluster's CPU utilization crosses 95%, Snap throttles write requests. This sounds counterintuitive. The team is deliberately degrading write throughput before the system is actually saturated. The reason becomes clear at 100%: administrative commands can no longer reach the cluster. Operators cannot reconfigure it, diagnose it, or intervene. Throttling at 95% preserves the headroom that operators and automation need to respond.

Snap [contributed this behavior](https://github.com/valkey-io/valkey/issues/1688) to the Valkey project. It is not on by default, but the pattern of reserving a fixed percentage of capacity for operational access is directly applicable as an application-layer or proxy-layer control for any team running write-heavy workloads.

![Illustration showing what happens when headroom is reserved](architecting_for_1b_3.webp)

### Replication buffer management and dual-channel replication

For high-memory workloads, Snap measured how quickly replication buffers filled during full syncs. In the traditional single-channel replication model, the primary buffers all new write commands in its Client Output Buffer (COB) while the RDB snapshot is being transferred. If the COB fills before the transfer completes, the replica is disconnected and the process starts over, resulting in a full-sync loop that never completes. From the outside it looks like slow replication, but in reality, it is an infinite retry cycle.

Valkey 8.0 introduced [dual-channel replication](https://valkey.io/blog/valkey-8-0-0-rc1/#replication) to address this directly. Rather than a single connection handling both the RDB transfer and the incremental command stream, dual-channel replication opens a dedicated RDB channel for bulk data while maintaining a separate main channel for streaming updates. The replica buffers incremental updates locally while loading the snapshot and applies them once loading completes. COB pressure on the primary drops substantially because the primary no longer needs to buffer the entire write stream for the duration of a large sync. In scenarios with heavy read commands, sync time can be cut by up to 50%. Dual-channel replication is on by default in Valkey 9.0.

![Illustration showing moving client output buffer pressure off the primary](architecting_for_1b_4.webp)

For teams not yet on Valkey 9.0, enabling dual-channel replication is a single config line. The flag can be toggled at runtime without a restart, which makes it straightforward to validate against a live workload before committing:

```bash
# valkey.conf
dual-channel-replication-enabled yes
```

Replication progress during dual-channel sync is observable via `INFO replication`. The fields `replicas_repl_buffer_size` and `replicas_repl_buffer_peak` show accumulated replication stream data in bytes on the replica side, since with dual-channel replication that buffer now lives on the replica rather than the primary.

Snap's operational approach layered on top of this: they measured buffer fill rates under realistic write load, selected a 15-minute threshold as safe for migration, and applied write throttling before buffers reached capacity. Now the intervention happens before the failure, instead of in response to it.

## **The principle underneath it all**

These failure modes and their mitigations are variations on the idea that systems that hold up under pressure are the ones that make deliberate choices about what to do before they are overwhelmed.

Uber's `iptables` approach does not help a node that is already at 100% CPU. It prevents the feedback loop from reaching 100% by stopping retry amplification early. Snap's write throttling does not kick in when the cluster is already unmanageable. It preserves management access by acting at 95%. The replication buffer threshold is configured before the first migration starts, not after a sync loop incident.

![Illustration showing two ways to visualize reliability](architecting_for_1b_5.webp)

Valkey's architectural trajectory sits on the right side of that diagram. I/O threading in 8.0 freed the main thread from socket polling. TLS offload in 8.1 removed a critical bottleneck in new connection acceptance. Dual-channel replication in 8.0 moved COB pressure off the primary. The cluster bus reconnection throttle in 9.0 prevented surviving nodes from overwhelming themselves during mass failure events. All of these are deliberate choices to keep the system manageable under load, not just fast in a benchmark.

## **What to carry out of this**

The questions you ask at this scale are about what happens when one node slows down and thousands of clients respond simultaneously. They are about whether the proxy prioritizes established connections under load. They are about whether write capacity is reserved for operational access before the cluster saturates. For teams running large memory workloads, they are about whether dual-channel replication is enabled and whether `replicas_repl_buffer_size` is being monitored and not just assumed to be fine.

The benchmark tells you the ceiling. The safety net determines how far you fall when you exceed it, and whether recovery is possible.

*To go deeper, watch the [Unlocked session replays](https://unlockedconf.io/san-jose-replays) and read the Valkey 8.0, 8.1, and 9.0 release posts linked throughout this article. Be sure to review your own client, proxy, and replication failure modes before they become production incidents.*
