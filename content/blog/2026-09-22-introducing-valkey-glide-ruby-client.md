+++
title = "Introducing the Valkey GLIDE Ruby Client: Now Generally Available!"
description = """The Ruby client for Valkey GLIDE, valkey-glide-rb, is now generally available, bringing GLIDE's shared Rust core, proactive connection management, cluster topology handling, and native observability to the Ruby ecosystem."""
date = 2026-09-22
authors = ["sasidharan-gopal"]

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = false
featured_image = "/assets/media/featured/default.webp"
+++

We are pleased to announce the general availability (GA) of the Ruby client for [Valkey GLIDE](https://github.com/valkey-io/valkey-glide), [valkey-glide-rb](https://github.com/valkey-io/valkey-glide-ruby).
This release brings the shared Rust core that powers GLIDE's [Java](https://github.com/valkey-io/valkey-glide/tree/main/java), [Python](https://github.com/valkey-io/valkey-glide/tree/main/python), [Node.js](https://github.com/valkey-io/valkey-glide/tree/main/node), and [Go](https://github.com/valkey-io/valkey-glide/tree/main/go) clients to the Ruby community — with an API (application programming interface) designed to feel familiar to anyone coming from [redis-rb](https://github.com/redis/redis-rb).

Ruby developers now get GLIDE's connection management, reliability, and observability out of the box, without reimplementing cluster handling, retries, or tracing in Ruby.
In this post, we cover what GA means for the Ruby ecosystem, the key capabilities of the client, and how to get started.

## What GLIDE Brings to Ruby Developers

If you run Ruby services against [Valkey](https://github.com/valkey-io/valkey) or [Redis OSS](https://github.com/redis/redis) today, you may be connecting with a variety of client libraries, each with its own connection pooling, retry, and TLS (Transport Layer Security) story.
GLIDE gives Ruby a client that:

- Behaves the same as every other GLIDE language client, so platform/infra teams can reason about client behavior once and apply it everywhere.
- Is built on a shared Rust core ([glide-core](https://github.com/valkey-io/valkey-glide/tree/main/glide-core)) instead of a pure-Ruby protocol implementation, which means connection management and retry/backoff logic are inherited — not re-implemented and re-debugged per team.
- Is observable by default, with native OpenTelemetry tracing and client statistics that don't depend on wrapping every call in your own instrumentation.

## Key Features

### Enhanced Connection Management

- Proactive reconnection — GLIDE monitors connection state in the background and reconnects before a request detects a broken connection, rather than incurring reconnection latency on the request path.
- Connection storm prevention — reconnection attempts are spread out using backoff with jitter, so a network blip doesn't turn into a thundering herd against your servers.
- Multiplexed connections — one connection per node rather than a pool.

Reconnection, timeouts, authentication, and TLS are all configured in one place:

```ruby
client = Valkey.new(
  host: "localhost",
  port: 6379,
  reconnect_attempts: 10,
  reconnect_delay: 5,        # initial delay, ms
  reconnect_delay_max: 50,   # max delay, ms
  timeout: 2.0,              # per-request timeout, seconds
  connect_timeout: 1.0,      # connection timeout, seconds
  username: "myuser",        # authentication
  password: "mypassword",
  ssl: true,                 # TLS
  ssl_params: { ca_file: "/path/to/ca.pem" }
)
```

### Advanced Cluster Topology Management

Connect to your Valkey cluster with minimal configuration — the client automatically discovers the entire cluster topology from a single seed node.

```ruby
require "valkey"

client = Valkey.new(
  nodes: [{ host: "127.0.0.1", port: 7000 }],
  cluster_mode: true
)

client.set("foo", "bar")
client.get("foo")
# => "bar"
```

Under the hood, GLIDE:

- Discovers topology automatically from a single seed node — no need to enumerate every node address.
- Proactively monitors topology with periodic background checks so the client's view of the cluster stays current as nodes are added, removed, or slots move.
- Resolves topology by consensus, querying multiple nodes and preferring the view with the highest agreement, reducing the risk of stale or conflicting slot maps.
- Throttles topology-management traffic so keeping the map fresh doesn't add load to the cluster.

### Built for Performance

The Ruby client keeps the synchronous, blocking API Ruby developers already expect from older clients where each command call blocks the calling thread, matching familiar client patterns.
But under the hood, every FFI call into the Rust core is declared `blocking: true`, which releases Ruby's GVL (Global VM Lock) for the duration of the I/O.
That means multiple Ruby threads sharing one Valkey client can issue commands concurrently — the GVL isn't held while GLIDE's core is talking to the server — and GLIDE's single multiplexed connection per node pipelines those concurrent requests efficiently instead of opening a connection per thread:

```ruby
require "valkey"

client = Valkey.new(host: "localhost", port: 6379)

# Ten threads sharing one client, all issuing commands concurrently.
threads = 10.times.map do |i|
  Thread.new do
    key, value = "key:#{i}", "value:#{i}"
    client.set(key, value)
    puts "Result for #{key}: #{client.get(key)}"
  end
end
threads.each(&:join)

# One thread batching several commands into a single round trip.
results = client.pipelined do |pipe|
  pipe.set("key1", "value1")
  pipe.get("key1")
  pipe.incr("counter")
end
# => ["OK", "value1", 1]
```

Threads let multiple callers share one client, while pipelining batches commands from a single caller; both route through the same multiplexed connection.

### Native Observability: OpenTelemetry and Statistics

Client-side observability, without instrumenting every call site by hand.

OpenTelemetry is configured once per process, in the native core (not the Ruby [opentelemetry-sdk](https://rubygems.org/gems/opentelemetry-sdk) gem):

```ruby
require "valkey"

Valkey::OpenTelemetry.init(
  traces: {
    endpoint: "http://localhost:4318/v1/traces",
    sample_percentage: 10
  },
  metrics: {
    endpoint: "http://localhost:4318/v1/metrics"
  },
  flush_interval_ms: 5000
)

client = Valkey.new(host: "localhost", port: 6379)
client.set("key", "value") # traced when sampling applies
```

Spans can also be linked into your application's existing trace context via `parent_span_context_provider`, so Valkey calls show up as children of the request span instead of independent root spans — important when correlating a slow command with the request that triggered it.

Client statistics are available on demand, no exporter required:

```ruby
stats = client.get_statistics
puts "Connections: #{stats[:total_connections]}"
puts "Clients: #{stats[:total_clients]}"
```

## Getting Started

Install the gem from [RubyGems](https://rubygems.org/gems/valkey-glide-rb):

```sh
gem install valkey-glide-rb
```

Or add it to your Gemfile:

```ruby
gem "valkey-glide-rb"
```

### Standalone Mode

```ruby
require "valkey"

client = Valkey.new(host: "localhost", port: 6379)
# Alternately using a URL like:
# client = Valkey.new(url: "redis://localhost:6379/0")
# Also accepts: rediss://, valkey://, valkeys:// (TLS)

client.set("mykey", "hello world")
# => "OK"

client.get("mykey")
# => "hello world"

client.close
```

### Cluster Mode

```ruby
nodes = [
  { host: "127.0.0.1", port: 7000 },
  { host: "127.0.0.1", port: 7001 },
  { host: "127.0.0.1", port: 7002 }
]

client = Valkey.new(nodes: nodes, cluster_mode: true)
client.set("foo", "bar")
client.get("foo")
# => "bar"
```

## Advanced Configuration

GLIDE exposes a handful of connection-level knobs that used to require a specific gem, a custom wrapper, or careful manual tuning to get right.
They're worth calling out individually because each one maps directly to an operational problem teams typically hit at scale.

### Read Strategies

By default, every client reads from the primary — simple, but it means all read traffic competes with writes on a single node even when you have healthy replicas sitting idle.
Read strategies let you route reads away from the primary without changing a single line of application code, just the client config:

```ruby
client = Valkey.new(
  nodes: [{ host: "cluster.example.com", port: 6379 }],
  cluster_mode: true,
  read_from: Valkey::ReadFrom::PREFER_REPLICA
)
```

Available strategies: `PRIMARY` (always read the freshest data from the primary), `PREFER_REPLICA` (round-robin reads across replicas, falling back to primary if none are available), `AZ_AFFINITY`, and `AZ_AFFINITY_REPLICAS_AND_PRIMARY` (the latter two require `client_az` to also be set).
The `AZ_AFFINITY` options are particularly valuable in a multi-AZ (availability zone) deployment: keeping read traffic in the same availability zone as the client cuts cross-AZ data-transfer cost and latency, both of which add up quickly at scale.

## Migrating from redis-rb, redis-client, or moneta

valkey-glide-rb is **not a drop-in replacement** — it's a different client with its own connection model — but it deliberately follows familiar Ruby conventions to keep the migration cost low:

| Feature | redis-rb / redis-client | moneta (Valkey backend) | valkey-glide-rb |
| --- | --- | --- | --- |
| **Connection model** | Per-thread pool (connection_pool) | Wraps redis-rb/redis-client | Single multiplexed connection per node |
| **Cluster topology** | Manual/partial | N/A (not cluster-aware) | Automatic discovery + maintenance |
| **Reconnection** | App/pool-managed | Delegated | Proactive, backoff + jitter |
| **Observability** | Bring your own | Bring your own | Native OpenTelemetry + `get_statistics` |
| **API style** | `.set`, `.get`, `pipelined`, `multi` | Hash-like `Moneta::Adapters::Redis` | `.set`, `.get`, `pipelined`, `multi` (redis-rb-flavored) |

A shared lint suite checks the gem's command methods against redis-rb conventions, so teams can move over incrementally rather than rewriting call sites in one pass.

## Behind the Scenes: Technical Architecture

Like the other GLIDE language clients, the Ruby gem is a thin layer over the shared Rust core:

```text
+------------+      +-----+      +------------+      +------------+
|            |      |     |      |            |      |            |
|   Ruby     |----->| FFI |----->|   Rust     |----->|   Valkey   |
|  Client    |      |gem  |      |   Core     |      |   Server   |
|            |<-----|     |<-----|            |<-----|            |
+------------+      +-----+      +------------+      +------------+
```

- **Ruby client** ([lib/valkey.rb](https://github.com/valkey-io/valkey-glide-ruby/blob/main/lib/valkey.rb), [lib/valkey/commands/*](https://github.com/valkey-io/valkey-glide-ruby/tree/main/lib/valkey/commands)) — the idiomatic, redis-rb-flavored interface.
- **[ffi](https://github.com/ffi/ffi) gem** — calls into the prebuilt native library (`libglide_ffi.so` on Linux, `.dylib` on macOS 14+ Apple silicon/arm64) with zero compilation step for consumers; Intel Mac users need to build Valkey GLIDE manually.
- **glide-core** — the same Rust driver used by the Java, Python, Node.js, and Go clients: connection management, cluster topology, retries, OpenTelemetry.

This is the same FFI approach used by GLIDE's Go and Python-sync clients — different from Java (JNI, the Java Native Interface) or Python-async (PyO3 + UDS, Unix domain sockets) — chosen for straightforward native builds across Ruby's supported platforms (glibc- and musl-based Linux, and macOS).

## Join the Journey

GA is a milestone, not a finish line.
We'd love your feedback and contributions:

- File issues or feature requests: [valkey-glide-ruby/issues](https://github.com/valkey-io/valkey-glide-ruby/issues)
- Check current command coverage: [implementation status wiki](https://github.com/valkey-io/valkey-glide-ruby/wiki/The-implementation-status-of-the-Valkey-commands)
- Browse the full GLIDE documentation: [glide.valkey.io](https://glide.valkey.io/)
- Join the conversation on [Valkey Slack](https://join.slack.com/t/valkey-oss-developer/shared_invite/zt-2nxs51chx-EB9hu9Qdch3GMfRcztTSkQ)

Pub/Sub support is actively being worked on ([#135](https://github.com/valkey-io/valkey-glide-ruby/issues/135)), and expanded command coverage and JRuby support are on the roadmap.

## Contributors

This client went from nothing to GA because of sustained work from the top four contributors, plus the broader Valkey and Freshworks community:

1. **Mohsen Alizadeh**
2. **Alex Le**
3. **Sasidharan Gopal** (Freshworks)
4. **Pratheep Kumar** (Freshworks)

With additional contributions from Alex Rehnby-Martin, James Xin, Neil Derraugh, Prateek Kumar, Taylor Curran, Yi-Pin Chen, Mos Roshanavand, Alireza Nobakht, and Olle Jonsson.

Thank you to everyone who filed issues, reviewed PRs, and tested early builds against real workloads.
