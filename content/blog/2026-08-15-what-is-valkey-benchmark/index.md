+++
title = "Simulating Real Workloads with valkey-benchmark"
date = 2026-07-31
description = "A practical guide to shaping valkey-benchmark's default run into a realistic workload simulation"
authors = ["dragosandriciuc"]
[taxonomies]
blog_type = ["How-to"]
[extra]
featured = true
+++

Benchmarking your database instances is one of the simplest ways to understand how your infrastructure behaves under load and where its limits are. And Valkey leverages this with an easy-to-use tool that allows you to get actionable figures for your instance and to evaluate that performance.

This blog post explores the functions of the tool and some common traps you might encounter on your first run.

## What is `valkey-benchmark`?

Valkey ships with `valkey-benchmark`, a simple CLI load-generation tool that simulates multiple clients sending commands at a Valkey instance on your hardware. The tool helps you answer "how does my server perform under load", and not "how fast is Valkey" in your environment.

You can use the tool through a simple invocation, such as `valkey-benchmark` with no arguments against localhost through multiple connections to the server, giving you a quick benchmark against your system.

For example, you can run the benchmark with the default configuration against 127.0.0.1:6379:

        ```bash
        $ valkey-benchmark
        ```
And the example result is:

        ```bash
        Summary:
                throughput summary: 67204.30 requests per second
                latency summary (msec):
                avg       min       p50       p95       p99       max
                0.471     0.080     0.343     1.015     1.999    12.007
        ```
        
_NOTE: You need to have a running Valkey instance before launching the benchmark._

That number looks impressive, but it doesn't tell the whole story of what the benchmarking tool is capable of.

### The default run isn't your workload

A bare invocation like this rarely reflects how your system behaves under real load. The 67k req/s hit the same single key. There is no real key-space pressure, no cache-miss behavior and no memory access patterns resembling real life production environments.

The actual payload was 3 bytes, which is certainly smaller than anything most applications actually store. With no pipelining, one in-flight request per connection, it resembles more a network-bound worst case rather than anything a real pipelining client sees.

However, the tool's number is not wrong. It answers a more focused question that most people assume, "how fast can 50 simple, unpipelined connections hit one key?", not "how will my app perform".

And the default invocation is not bad, they're just not representative of your workload. Here's how you can make `valkey-benchmark` do that.

## Three ways to make your benchmark resemble production

It's important to point out the golden rule of a useful benchmark before moving forward, a useful benchmark compares apples to apples. In this case, you can compare different versions of Valkey on the same workload or the same version of Valkey, but with different options.

### Simulate a real keyspace

By default, `valkey-benchmark` repeatedly accesses the same key. Most applications operate over thousands or millions of keys. A realistic keyspace introduces cache misses, different memory access patterns, and a workload that more closely resembles production.

You can generate these realistic keyspace benchmarks using random keys with the `-r` option:

        ```bash
        valkey-benchmark -t set -r 100000 -n 1000000
        ```

Instead of repeatedly updating a single key, each operation selects a random key from a space of 100,000 possible keys. After one million requests you end up with roughly 100,000 keys stored, closely resembling an application repeatedly writing into an existing dataset.

The important point isn't the exact number of keys. It is choosing a keyspace that resembles your own application. A session cache, leaderboard, and job queue all exercise memory differently.

In the above case, the example result is:

        ```bash
        Summary:
                throughput summary: 103734.44 requests per second
                latency summary (msec):
                        avg       min       p50       p95       p99       max
                        0.279     0.072     0.231     0.567     1.007     3.615
        ```

_NOTE: The exact numbers vary from run to run, the point is the change in what's being tested, not a numeric ranking._

### Use realistic payload transmissions

The default `valkey-benchmark` stores values that are 3 bytes long. It keeps the benchmark lightweight, but realistically session data, cached API responses and serialized objects often reach bigger numbers of bytes.

However, the payload size often does not matter until you cross a certain threshold, for example the ethernet packet size (~1500 bytes).

These larger values not only affect memory consumption, but also increase network bandwidth requiring more memory to copy and allocate, which expose more performance characteristics than the default payloads.

You can change the generated value size with the `-d` option. Combining this with a realistic keyspace (-r) allows you to simulate a workload that is representative of a realistic application rather than the benchmark's default configuration:

        ```bash
        valkey-benchmark -t set -r 100000 -n 1000000 -d 1024
        ```

The result numbers vary, but a 1024-byte payload often has only a modest impact on throughput because it remains below the Ethernet MTU in some environments.

        ```bash
        Summary:
                throughput summary: 111135.80 requests per second
                latency summary (msec):
                        avg       min       p50       p95       p99       max
                        0.263     0.088     0.215     0.559     1.175     5.119
        ```

### Pipeline requests like a real client

Most production clients do not wait for every command to finish before sending the next one. Instead, they batch several requests together using pipelining, which reduces the cost of network round trips.

In Valkey, the default benchmark has pipelining disabled, meaning each connection has only one outstanding request. However, modern applications do not have this type of conservative, network-bound workload.

Adding even a modest pipeline dramatically changes the picture, and combined with a realistic keyspace and payload size, pipelining provides a much stronger baseline for evaluating your infrastructure:

        ```bash
        valkey-benchmark -t set -r 100000 -n 1000000 -d 1024 -P 16
        ```

This benchmark measures how efficiently your system processes batches of commands through Valkey. Depending on your workload, throughput can increase several times over simply by matching the pipelining strategy used by your application.

        ```bash
        Summary:
                throughput summary: 448631.66 requests per second
                latency summary (msec):
                        avg       min       p50       p95       p99       max
                        1.632     0.224     1.311     3.455     5.943    13.991
        ```

As with every benchmark parameter, realism is more valuable than chasing the highest requests-per-second number. Choose a pipeline depth that reflects what your client library actually uses.

Together, these three settings, keyspace size (-r), pipeline depth (-P), and payload size (-d) move `valkey-benchmark` away from a simple benchmark and toward a workload that more closely resembles production.

## Cluster mode

If you want to benchmark your application with data that is automatically sharded across multiple Valkey cluster nodes, cluster mode is the solution.

All of the above benchmarks can be done by adding the `--cluster` option. When running cluster mode with a custom command, your key names need to include `{tag}`, a placeholder that ensures the command routes to the correct node. Combined with `--rfr`, this lets you stress-test read-heavy workloads specifically.

## Putting it all together

Between a realistic keyspace, representative payloads, and pipelining that matches your client, `valkey-benchmark` can move from a synthetic microbenchmark to something that actually predicts how your application behaves under load. The tool's own goal is reproducibility, so anchor your numbers to a fixed set of options, and compare against your own past runs rather than other benchmark tools.

You can copy and paste this following benchmark command as your starting point:

        ```bash
        valkey-benchmark -t set,get -r 100000 -d 1024 -P 16 -n 1000000 -q
        ```
