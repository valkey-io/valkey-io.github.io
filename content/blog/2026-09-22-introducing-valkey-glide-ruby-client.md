+++
title = "Introducing the Valkey GLIDE Ruby Client: Now Generally Available!"
description = "The Ruby client for Valkey GLIDE, valkey-glide-rb, is now generally available, bringing GLIDE's shared Rust core and native observability to the Ruby ecosystem. Freshworks built it to replace years of Ruby client sprawl — redis-rb, redis-client, and moneta — with one client and one set of connection defaults."
date = 2026-09-22
authors = ["sasidharan-gopal"]

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = false
featured_image = "/assets/media/featured/default.webp"
+++

We are pleased to announce the **general availability** of the Ruby client for [Valkey GLIDE](https://github.com/valkey-io/valkey-glide), [valkey-glide-rb](https://github.com/valkey-io/valkey-glide-ruby).
This release brings the shared Rust core that powers [GLIDE](https://github.com/valkey-io/valkey-glide)'s [Java](https://github.com/valkey-io/valkey-glide/tree/main/java), [Python](https://github.com/valkey-io/valkey-glide/tree/main/python), [Node.js](https://github.com/valkey-io/valkey-glide/tree/main/node), and [Go](https://github.com/valkey-io/valkey-glide/tree/main/go) clients to the Ruby community — with an API designed to feel familiar to anyone coming from [redis-rb](https://github.com/redis/redis-rb).

[Freshworks](https://www.freshworks.com/) needed a Valkey-native Ruby client that could slot into our existing [redis-rb](https://github.com/redis/redis-rb) based workflows while giving us [GLIDE](https://github.com/valkey-io/valkey-glide)'s connection management, reliability, and observability out of the box — but Ruby wasn't on [GLIDE](https://github.com/valkey-io/valkey-glide)'s language roadmap.
Building on top of [GLIDE](https://github.com/valkey-io/valkey-glide)'s shared core meant we didn't have to reinvent cluster handling, retries, or tracing ourselves; we could focus purely on the Ruby surface and let the Rust core do the heavy lifting.
In this post, we cover why Freshworks took this on, what GA means for the Ruby ecosystem, and how to get started — whether you're evaluating [GLIDE](https://github.com/valkey-io/valkey-glide) for the first time or migrating off [redis-rb](https://github.com/redis/redis-rb).

## What GLIDE Brings to Ruby Developers

If you run Ruby services against [Valkey](https://github.com/valkey-io/valkey) or [Redis OSS](https://github.com/redis/redis) today, you're almost certainly using [redis-rb](https://github.com/redis/redis-rb), [redis-client](https://github.com/redis-rb/redis-client), or a caching abstraction like [moneta](https://github.com/moneta-rb/moneta) sitting on top of one of them — each with its own connection pooling, retry, and TLS (Transport Layer Security) story.
[GLIDE](https://github.com/valkey-io/valkey-glide) gives Ruby a client that's:

- **Consistent** with every other [GLIDE](https://github.com/valkey-io/valkey-glide) language client, so platform/infra teams can reason about client behavior once and apply it everywhere.
- **Built on a shared Rust core** ([glide-core](https://github.com/valkey-io/valkey-glide/tree/main/glide-core)) instead of a pure-Ruby protocol implementation, which means connection management and retry/backoff logic are inherited — not re-implemented and re-debugged per team.
- **Observable by default**, with native OpenTelemetry tracing and client statistics that don't depend on wrapping every call in your own instrumentation.

## The Freshworks Story: Why We Built This

Freshworks runs a large portfolio of SaaS products, and Ruby is a primary language across many of those product engineering teams.
That scale created a problem that will sound familiar to anyone running Redis/Valkey at a large organization: **client sprawl with zero standardization.**

### The problem

As the team responsible for Redis/Valkey infrastructure at Freshworks, we had visibility into the *servers*, but almost none into how client applications talked to them.
In practice, that meant:

- Different teams depended on different gems for the same job — [redis-rb](https://github.com/redis/redis-rb), [redis-client](https://github.com/redis-rb/redis-client), [moneta](https://github.com/moneta-rb/moneta) (with a Redis/Valkey backend), and in some cases hand-rolled wrappers around [connection_pool](https://github.com/mperham/connection_pool) and [hiredis](https://github.com/redis/hiredis-rb).
- Connection pooling, timeout, and retry/backoff settings were configured independently per team, with no shared defaults — so failure behavior during a network blip was inconsistent across the fleet.
- There was no shared observability story: when a team reported "Redis is slow," the platform team had no client-side traces or statistics to correlate against server-side metrics, and every investigation started from scratch.
- Upgrading TLS settings, rotating credentials, or rolling out a new connection strategy meant coordinating changes across `redis-rb`, `redis-client`, `moneta`, `connection_pool`, and `hiredis` — five configuration patterns instead of one.

None of this is a knock on [redis-rb](https://github.com/redis/redis-rb) or [moneta](https://github.com/moneta-rb/moneta) — they're solid, widely used libraries.
The issue was entirely about **not having one client with shared, centrally-owned defaults** that the platform team could reason about and evolve.

### Why GLIDE

Freshworks was already evaluating (or using) Valkey [GLIDE](https://github.com/valkey-io/valkey-glide) in other parts of the stack and liked the model: one core, written once in Rust, with consistent behavior — proactive reconnection, connection-storm protection, native observability — exposed through a thin, idiomatic layer per language.
That's exactly the standardization story the Redis platform team wanted for Ruby.

The problem: [**GLIDE**](https://github.com/valkey-io/valkey-glide) **had no Ruby client.**
Java, Python, Node.js, and Go were covered — Ruby wasn't on the roadmap.

So Freshworks engineers, alongside the broader Valkey [GLIDE](https://github.com/valkey-io/valkey-glide) community, built it.
From an empty repository to a GA gem: the FFI (Foreign Function Interface) bindings to glide-core, the command surface (strings, hashes, sets, sorted sets, streams, geo, bitmaps, scripting, pub/sub groundwork, JSON and vector-search module support, cluster commands), a [redis-rb](https://github.com/redis/redis-rb)-flavored API and [lint suite](https://github.com/valkey-io/valkey-glide-ruby/tree/main/test/lint), native builds across Linux (glibc/musl) and macOS, cluster and TLS test infrastructure, and OpenTelemetry integration.

### Why this matters for a company our size

- **One client, centrally owned.** The Redis/Valkey platform team can now set — and evolve — connection, retry, TLS, and observability defaults in one place instead of chasing down every team's Gemfile.
- **Consistency with our other stacks.** Although we haven't started using GLIDE in other languages yet, we're looking forward to using it to ensure connection-management behavior is the same for Ruby, creating one mental model and one on-call runbook instead of N.
- **Built-in observability.** Native OpenTelemetry spans and `get_statistics` give the platform team the client-side signal they never had, without asking every product team to add instrumentation.
- **A path off client sprawl.** Teams still on [redis-rb](https://github.com/redis/redis-rb) or [moneta](https://github.com/moneta-rb/moneta)-over-Redis have a clear, supported target to migrate to, backed by the same team that runs the infrastructure.

## Key Features

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

Under the hood, [GLIDE](https://github.com/valkey-io/valkey-glide):

- **Discovers topology automatically** from a single seed node — no need to enumerate every node address.
- **Proactively monitors topology** with periodic background checks so the client's view of the cluster stays current as nodes are added, removed, or slots move.
- **Resolves topology by consensus**, querying multiple nodes and preferring the view with the highest agreement, reducing the risk of stale or conflicting slot maps.
- **Throttles topology-management traffic** so keeping the map fresh doesn't add load to the cluster.

### Enhanced Connection Management

- **Proactive reconnection** — [GLIDE](https://github.com/valkey-io/valkey-glide) monitors connection state in the background and reconnects before a request detects a broken connection, rather than incurring reconnection latency on the request path.
- **Connection storm prevention** — reconnection attempts are spread out using backoff with jitter, so a network blip doesn't turn into a thundering herd against your servers.
- **Multiplexed connections** — one connection per node rather than a pool.

```ruby
client = Valkey.new(
  host: "localhost",
  port: 6379,
  reconnect_attempts: 10,
  reconnect_delay: 5,        # initial delay, ms
  reconnect_delay_max: 50    # max delay, ms
)
```

### Built for Performance

The Ruby client keeps the synchronous, blocking API Ruby developers already expect from [redis-rb](https://github.com/redis/redis-rb) — each command call blocks the calling thread, matching familiar client patterns.
But under the hood, every FFI call into the Rust core is declared `blocking: true`, which releases Ruby's GVL (Global VM Lock) for the duration of the I/O.
That means multiple Ruby threads sharing one Valkey client can issue commands concurrently — the GVL isn't held while [GLIDE](https://github.com/valkey-io/valkey-glide)'s core is talking to the server — and [GLIDE](https://github.com/valkey-io/valkey-glide)'s single multiplexed connection per node pipelines those concurrent requests efficiently instead of opening a connection per thread:

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
```

```ruby
results = client.pipelined do |pipe|
  pipe.set("key1", "value1")
  pipe.get("key1")
  pipe.incr("counter")
end
# => ["OK", "value1", 1]
```

Pipelining batches multiple commands from a single thread into one round trip; the threaded example above is the concurrent-callers case — both paths route through the same multiplexed connection.

### Native Observability: OpenTelemetry and Statistics

This is one of the features Freshworks cared most about — client-side observability without instrumenting every call site by hand.

**OpenTelemetry** is configured once per process, in the native core (not the Ruby [opentelemetry-sdk](https://rubygems.org/gems/opentelemetry-sdk) gem):

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

Spans can also be linked into your application's existing trace context via `parent_span_context_provider`, so Valkey/Redis calls show up as children of the request span instead of independent root spans — important when correlating a slow command with the request that triggered it.

**Client statistics** are available on demand, no exporter required:

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

client.set("mykey", "hello world")
# => "OK"

client.get("mykey")
# => "hello world"

client.close
```

### Connecting via URL

```ruby
client = Valkey.new(url: "redis://localhost:6379/0")
# Also accepts: rediss://, valkey://, valkeys:// (TLS)

client.ping
# => "PONG"
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

### Not-yet-wrapped commands: `call` / `call_v`

The command surface is broad, but if something isn't wrapped yet, `call`/`call_v` are an escape hatch that mirrors redis-client's API:

```ruby
client.call("SET", "mykey", "value")
client.call_v(["MGET"] + keys)
client.call("SET", "k", "v", nx: true, ex: 60)
# equivalent to: call("SET", "k", "v", "NX", "EX", "60")
```

## Advanced Configuration

[GLIDE](https://github.com/valkey-io/valkey-glide) exposes a handful of connection-level knobs that used to require a specific gem, a custom wrapper, or careful manual tuning to get right.
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
The `AZ_AFFINITY` options are particularly valuable in a multi-AZ (availability zone) deployment: keeping read traffic in the same availability zone as the client cuts cross-AZ data-transfer cost and latency, both of which add up quickly at Freshworks' request volume.

### Authentication and TLS

```ruby
client = Valkey.new(
  host: "localhost",
  port: 6380,
  username: "myuser",
  password: "mypassword",
  ssl: true,
  ssl_params: { ca_file: "/path/to/ca.pem" }
)
```

### Timeouts

```ruby
client = Valkey.new(
  host: "localhost",
  port: 6379,
  timeout: 2.0,          # per-request timeout, seconds
  connect_timeout: 1.0   # connection timeout, seconds
)
```

## Migrating from redis-rb, redis-client, or moneta

valkey-glide-rb is **not a drop-in replacement** — it's a different client with its own connection model — but it deliberately follows familiar Ruby conventions to keep the migration cost low:

| Feature | [redis-rb](https://github.com/redis/redis-rb) / [redis-client](https://github.com/redis-rb/redis-client) | [moneta](https://github.com/moneta-rb/moneta) (Redis backend) | valkey-glide-rb |
| --- | --- | --- | --- |
| **Connection model** | Per-thread pool ([connection_pool](https://github.com/mperham/connection_pool)) | Wraps [redis-rb](https://github.com/redis/redis-rb)/[redis-client](https://github.com/redis-rb/redis-client) | Single multiplexed connection per node |
| **Cluster topology** | Manual/partial | N/A (not cluster-aware) | Automatic discovery + maintenance |
| **Reconnection** | App/pool-managed | Delegated | Proactive, backoff + jitter |
| **Observability** | Bring your own | Bring your own | Native OpenTelemetry + `get_statistics` |
| **API style** | `.set`, `.get`, `pipelined`, `multi` | Hash-like `Moneta::Adapters::Redis` | `.set`, `.get`, `pipelined`, `multi` ([redis-rb](https://github.com/redis/redis-rb)-flavored) |

A shared [lint suite](https://github.com/valkey-io/valkey-glide-ruby/tree/main/test/lint) checks the gem's command methods against [redis-rb](https://github.com/redis/redis-rb) conventions, and `call`/`call_v` cover anything not yet wrapped — so teams can move over incrementally rather than rewriting call sites in one pass.

## Behind the Scenes: Technical Architecture

Like the other [GLIDE](https://github.com/valkey-io/valkey-glide) language clients, the Ruby gem is a thin layer over the shared Rust core:

```text
+------------+      +-----+      +------------+      +------------+
|            |      |     |      |            |      |            |
|   Ruby     |----->| FFI |----->|   Rust     |----->|   Valkey   |
|  Client    |      |gem  |      |   Core     |      |   Server   |
|            |<-----|     |<-----|            |<-----|            |
+------------+      +-----+      +------------+      +------------+
```

- **Ruby client** ([lib/valkey.rb](https://github.com/valkey-io/valkey-glide-ruby/blob/main/lib/valkey.rb), [lib/valkey/commands/*](https://github.com/valkey-io/valkey-glide-ruby/tree/main/lib/valkey/commands)) — the idiomatic, [redis-rb](https://github.com/redis/redis-rb)-flavored interface.
- **[ffi](https://github.com/ffi/ffi) gem** — calls into the prebuilt native library (`libglide_ffi.so` on Linux, `.dylib` on macOS) with zero compilation step for consumers.
- **[glide-core](https://github.com/valkey-io/valkey-glide/tree/main/glide-core)** — the same Rust driver used by the Java, Python, Node.js, and Go clients: connection management, cluster topology, retries, OpenTelemetry.

This is the same FFI approach used by [GLIDE](https://github.com/valkey-io/valkey-glide)'s Go and Python-sync clients — different from Java (JNI) or Python-async (PyO3 + UDS) — chosen for straightforward native builds across Ruby's supported platforms (glibc- and musl-based Linux, and macOS).

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

---

*Valkey GLIDE Ruby is available now on [RubyGems](https://rubygems.org/gems/valkey-glide-rb) and [GitHub](https://github.com/valkey-io/valkey-glide-ruby).*
