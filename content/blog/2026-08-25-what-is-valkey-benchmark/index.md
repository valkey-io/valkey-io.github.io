+++
title = "Simulating Real Workloads with valkey-benchmark"
date = 2026-08-25
description = "A practical guide to shaping valkey-benchmark's default run into a realistic workload simulation"
authors = ["dragosandriciuc"]
[taxonomies]
blog_type = ["How-to"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-05.webp"
+++

Benchmarking your Valkey deployment allows you to understand how your infrastructure behaves under load and where its limits are. And Valkey leverages this with an easy-to-use tool that allows you to get actionable figures for your deployment and to evaluate that performance.

This blog post explores the functions of the tool and some common traps you might encounter on your first run.

## What is `valkey-benchmark`?

Valkey ships with `valkey-benchmark`, a CLI load-generation tool that simulates multiple clients sending commands at a Valkey deployment on your hardware. The tool helps you answer "how does my server perform under load", and not "how fast is Valkey" in your environment.

You can use the tool by running `valkey-benchmark` with no arguments against your local deployment, using multiple client connections to the server to give you a quick benchmark of your system.

For example, you can run the benchmark with the default configuration against 127.0.0.1:6379:

```text
valkey-benchmark
```

And the example result is:

```text
Summary:
        throughput summary: 67204.30 requests per second
        latency summary (msec):
        avg       min       p50       p95       p99       max
        0.471     0.080     0.343     1.015     1.999    12.007
```

_NOTE: You need to have a running Valkey deployment before launching the benchmark._

That's a real number, given how simple this default run is, but it's worth asking exactly what it's measuring before you trust it for capacity planning.

### The default run isn't your workload

A bare run like the above result rarely reflects how your system behaves under real load. The 67k req/s hit the same single key. There is no real key-space pressure, no cache-miss behavior and no memory access patterns resembling real-life production environments.

The actual payload was 3 bytes, which is certainly smaller than anything most applications actually store. With no pipelining, one in-flight request per connection, it resembles a network-bound worst case rather than anything a real pipelining client would produce.

However, it answers a more focused question that most people assume, "how fast can 50 unpipelined connections hit one key?", not "how will my application perform".

And the default run is not bad, it's just not representative of a realistic workload.

## Three ways to make your benchmark resemble production

Before diving in, it's worth stating the golden rule of a useful benchmark: compare apples to apples. In this case, you can compare different versions of Valkey on the same workload or the same version of Valkey, but with different options.

### Simulate a real keyspace

By default, `valkey-benchmark` repeatedly accesses the same key. Most applications operate over thousands or millions of keys. A realistic keyspace introduces cache misses, different memory access patterns, and a workload that more closely resembles production.

You can generate more realistic keyspace benchmarks using random keys with the `-r` option:

```text
valkey-benchmark -t set -r 100000 -n 1000000
```

Instead of repeatedly updating a single key, each operation selects a random key from a space of 100,000 possible keys. After one million requests you end up with roughly 100,000 keys stored, closely resembling an application repeatedly writing into an existing dataset.

> On an empty database, the above command produces approximately 100,000 stored keys for a total of about 100mb of data. Existing keys may be overwritten, you can verify this with the `DBSIZE` command. While 100mb is fine for getting to know the benchmarking tool it could possibly fit into a large L3 cache. Going up to 1,000,000 stored keys will reliably avoid any hardware caches.

The important point isn't the exact number of keys. It is choosing a keyspace that resembles your own application. A session cache, leaderboard, and job queue all exercise memory differently.

In the above case, the example result is:

```text
Summary:
        throughput summary: 103734.44 requests per second
        latency summary (msec):
                avg       min       p50       p95       p99       max
                0.279     0.072     0.231     0.567     1.007     3.615
```

_NOTE: The exact numbers vary from run to run, the point is the change in what's being tested, not a numeric ranking._

### Use realistic payload transmissions

The default `valkey-benchmark` stores values that are 3 bytes long. It keeps the benchmark lightweight, but realistically session data, cached API responses and serialized objects are often much larger.

The payload size often has little effect until you cross a certain threshold once you're pipelining, because 10-byte, 100-byte, and 1000-byte payloads all produce roughly the same throughput when accessing Valkey over an ethernet network, with the effect breaking down once payloads approach the ethernet packet size (~1500 bytes).

These larger values not only affect memory consumption, but also increase network bandwidth usage requiring more memory to copy and allocate, which expose more performance characteristics than the default payloads.

You can change the generated value size with the `-d` option. Combining this with a realistic keyspace (-r) allows you to simulate a workload that is representative of a realistic application rather than the benchmark's default configuration:

```text
valkey-benchmark -t set -r 100000 -n 1000000 -d 1024
```

```text
Summary:
        throughput summary: 111135.80 requests per second
        latency summary (msec):
                avg       min       p50       p95       p99       max
                0.263     0.088     0.215     0.559     1.175     5.119
```

The result numbers show a modest change from adding a 1024-byte payload. A similar effect applies over ethernet networks specifically: 10-byte, 100-byte, and 1000-byte payloads all produce roughly the same throughput, with the effect breaking down near the ethernet packet size (~1500 bytes). Let's see pipelining's actual effect next.

### Pipeline requests like a real client

Most production clients do not wait for every command to finish before sending the next one. Instead, they batch several requests together using pipelining, which reduces the cost of network round trips.

In Valkey, the default benchmark has pipelining disabled, meaning each connection has only one outstanding request. However, modern applications do not have this type of conservative, network-bound workload.

Adding even a modest pipeline dramatically changes the picture, and combined with a realistic keyspace and payload size, pipelining provides a much stronger baseline for evaluating your infrastructure:

```text
valkey-benchmark -t set -r 100000 -n 1000000 -d 1024 -P 16
```

This benchmark measures how efficiently your system processes batches of commands through Valkey. Depending on your workload, throughput can increase several times over by matching the pipelining strategy used by your application.

```text
Summary:
        throughput summary: 448631.66 requests per second
        latency summary (msec):
                avg       min       p50       p95       p99       max
                1.632     0.224     1.311     3.455     5.943    13.991
```

The trade-off is that the throughput roughly quadruples, but per-request latency also rises: p50 climbs from 0.215ms to 1.311ms. 
The rise in throughput is expected: Valkey is more efficient at parsing four packets at one time rather than one.
As for latency, keep in mind that the benchmark sends as much as possible all at once, paired with pipelining, it results in latency spikes from queuing.

This is exactly why matching your pipeline depth to your actual client matters: a pipeline depth that's unrealistically deep shows great throughput numbers while your real requests wait longer than your application can tolerate.

Together, these three settings: keyspace size (-r), pipeline depth (-P), and payload size (-d), move `valkey-benchmark` away from an unrealistic benchmark and toward a workload that more closely resembles production.

## Using the `--cluster` argument

If you want to benchmark a Valkey cluster that is automatically sharded across multiple Valkey cluster nodes, use the `--cluster` argument.

Compared to a standalone benchmark, two things change:

- `-c` (client connections) must be at least the number of nodes in your cluster; with fewer clients than nodes, some nodes will never get contacted.
- Custom commands need `{tag}` in the key name, a placeholder that ensures the command routes to the correct node.

If you also want to stress read replicas, add the `--rfr` (read-from-replicas) argument, with a mode of `no`, `yes`, or `all`. Use this only with read commands as writes sent to a replica are rejected.

For example, against a 6-node cluster (3 primaries and 3 replicas), reading from replicas only:

```text
valkey-benchmark --cluster -h 127.0.0.1 -p 6371 -c 6 -n 100000 --rfr yes get key-{tag}
```

_NOTE: This example requires an actual Valkey cluster deployment, it does not run against a standalone instance._

## Putting it all together

Between a realistic keyspace, representative payloads, and pipelining that matches your client, `valkey-benchmark` can move from a synthetic microbenchmark to something that actually predicts how your application behaves under load. The tool's own goal is reproducibility, so anchor your numbers to a fixed set of options, and compare against your own past runs rather than other benchmark tools.

Before actually trusting any of the above numbers for planning capacity, run the commands against your own staging environment with values that match your actual traffic. Here's a starting point you can adapt:

```text
valkey-benchmark -t set,get -r 100000 -d 1024 -P 16 -n 1000000 -q
```

_NOTE: Add `-q` for quiet output once you're running this repeatedly rather than reading the full summary each time._

For the full set of options, including `--csv` for tracking results over time, `--dataset` for benchmarking against real data files, and more on cluster mode, see the [Valkey benchmarking tool documentation](https://valkey.io/topics/benchmark/).
