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

Evaluating performances for database instances is a critical part in understanding the potential weight your infrastructure can carry. And Valkey leverages this with an out of the box easy to use tool that allows you to get actionable figures for your instance and to evaluate that performance.

This blog post explores the functions of the tool and some common traps you might encounter on your first run.

## What is valkey-benchmark?

Valkey ships with valkey-benchmark, a simple CLI load-generation tool that simulates multiple clients sending commands at a Valkey instance on your hardware. The tool helps you answer "how does my server perform under load", and not "how fast is Valkey" in your environment.

You can use the tool through a simple invocation, such as valkey-benchmark with no args against localhost through multiple connections to the server, giving you a quick benchmark against your system.

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

Its default behavior does not stress the server much, however, it does more than just a simple basic invocation and benchmark run.

### The default run isn't your workload

Rarely is a simple invocation as the one above a good benchmark for a system under load. The 67k req/s hit the same single key. There is no real key-space pressure, no cache-miss behavior and no memory access patterns resembling real life production environments.

The actual payload was 3 bytes, which is certainly smaller than anything most applications actually store. With no pipelining, one in-flight request per connection, it resembles more a network-bound worst case rather than anything a real pipelining client sees.

However, the tool's number is not wrong. It answers a more focused question that most clients assume, "how fast can 50 simple, unpipelined connections hit one key?", not "how will my app perform". Which has it merit as a standard benchmark procedure.

And none of these default invocations are bad, they're just not realistic to your workload. Here's how you can make valkey-benchmark change that.

### Three levers that make it realistic

### Cluster mode

## Putting it all together
