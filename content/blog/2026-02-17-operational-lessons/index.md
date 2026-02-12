+++
title = "Operational Lessons from Large-Scale Valkey Deployments"
date = 2026-02-17
description = "Production lessons on tail latency, migrations, and scale from engineers operating Valkey at real-world scale."
authors = ["allenhelton", "mikecallahan"]

[extra]
featured = true
featured_image = "/assets/media/featured/random-04.webp"
+++

Engineers operating large-scale systems face a consistent challenge: what works at moderate scale often breaks in subtle ways as systems grow. Recently, contributors and platform teams gathered at the [Unlocked Conference](https://www.unlockedconf.io) to compare notes on what actually happens when Valkey is under real production load.

What follows are high-level observations from the day — directional insights that kept resurfacing across talks, questions, and small-group discussions. For teams running or evaluating Valkey, these represent the operational questions large-scale deployments are asking right now.

## Scale Changes the Nature of Problems

As [Khawaja Shams](https://www.linkedin.com/in/kshams/) put it during the opening remarks:

> "Scale exposes all truths."

Across multiple conversations throughout the day, the recurring theme was what changes once systems cross certain thresholds. Latency that once felt negligible becomes visible. Client behavior that looked harmless begins to shape tail latencies. Operational shortcuts that worked at small volumes introduce instability when workloads grow.

The takeaway was that scale changes *which questions you should be asking*. Conversations shift from "does it work?" to "what happens when it's stressed?"

This aligns with recent work in Valkey such as [Atomic Slot Migration](https://valkey.io/blog/atomic-slot-migration/), [I/O threading improvements](https://valkey.io/blog/valkey-8-1-0-ga/#i-o-threads-improvements) introduced in Valkey 8, and [copy-avoidance paths](https://github.com/valkey-io/valkey/pull/2078) for large replies. These changes reflect lessons learned at scale, where larger clusters, heavier payloads, and higher concurrency expose constraints that smaller deployments rarely encounter.

## Predictability Over Peak Throughput

Another frequently mentioned topic was reducing tail latency rather than maximizing peak throughput. A large gap between your P99 and P999 latency reveals instability caused by issues such as bursty traffic, background work, large payloads, or similar workload characteristics. The practical lesson is that outages often come from edge cases rather than the happy path.

[Madelyn Olson](https://www.linkedin.com/in/madelyn-olson-valkey/) shared the five guiding performance principles at Valkey:

![Valkey Performance Principles Screenshot](valkey-performance-principles.jpg)

With *"provide predictable user latency"* listed as the second principle, it's clear that consistency is a deliberate priority for the project. It's treated as a first-order goal alongside scalability and simplicity.

A small percentage of multi-megabyte values can distort tail percentiles even when average latency and overall throughput appear stable — behavior that Khawaja Shams explored in a [deep dive on large object handling](https://www.gomomento.com/blog/large-objects-ruin-the-party-valkey-9-tames-them/). During her systems engineering session, [Daniela Miao](https://www.linkedin.com/in/danielamiao/) emphasized a similar principle: performance work often begins by raising the floor of latency behavior before chasing peak numbers. Building predictable systems requires designing for these edge cases explicitly rather than assuming "typical" request sizes.

Valkey 9.0 introduced reply copy-avoidance paths for large values, significantly reducing the time the main event loop can be blocked by multi-megabyte responses. It's a concrete example of the broader shift from chasing peak numbers to bounding worst-case behavior so latency distributions remain stable as workloads evolve.

## Payload Size and Bandwidth Shape Outcomes

While the prior discussion focused on latency variance inside the engine, another recurring theme was variance introduced by traffic moving across the network. With high-performance systems, bottlenecks often emerge from the *shape* of traffic rather than raw CPU or memory limits. At Unlocked, teams described systems where CPU and memory looked healthy, yet latency variance and node failures increased once payload sizes grew or request patterns shifted.

Nodes can fail not from CPU exhaustion or memory pressure alone, but from the sheer volume of bytes moving across the network. As Ignacio "Nacho" Alvarez from Mercado Libre put it:

> "Nodes dying because of the volume of bytes moving in and out was the hardest problem to solve."

Bandwidth becomes a primary bottleneck and incident driver — a reminder that network throughput and payload variability can dominate system behavior long before standard utilization metrics indicate trouble.

Instead of asking "are we out of CPU or memory?", teams found themselves asking "what are we actually sending over the wire?" Payload size distribution, network behavior, and client request patterns frequently ended up being primary cost drivers compared to processor utilization alone. Nacho recounted that monitoring how large those requests were and how unevenly they arrived were crucial to Mercado Libre's stability.

This awareness is visible in recent Valkey releases as well. Valkey 9 added [pipeline memory prefetching](https://github.com/valkey-io/valkey/pull/2092) to smooth bursty workloads and [Multipath TCP](https://github.com/valkey-io/valkey/pull/1811) support to reduce network-induced latency, alongside [large-cluster resilience improvements](https://valkey.io/blog/1-billion-rps/) aimed at keeping end-to-end latency stable at higher node counts. Taken together, these changes point less toward chasing peak throughput numbers and more toward limiting the impact of uneven traffic and network variability.

## Community Participation Is the Multiplier

One of the strongest signals coming out of Unlocked wasn’t a feature announcement or benchmark — it was how openly engineers were exchanging operational lessons. Maintainers, platform teams, and end users were comparing migration strategies, performance regressions, and tooling approaches throughout the day. As Khawaja put it during the opening remarks, the goal is to ”*share what you learn and talk about the outages you caused — we’re among friends.*”

This culture of openness reflects what’s happening in Valkey itself. According to the [Valkey 2025 Year-End Review](https://valkey.io/blog/2025-year-end/), more than *300 contributors* authored commits, reviewed code, or opened issues over the course of the year. Participation here spanned testing releases, proposing features, building tooling, documenting deployment patterns, and sharing production lessons that shape future improvements.

For operators, that amount of involvement means bugs are discovered across a wider variety of real workloads, migration paths are validated by multiple organizations before becoming common practice, and performance fixes are grounded in production behavior rather than synthetic benchmarks alone. Stability improvements and tooling changes arrive already pressure-tested across different infrastructure types and scale points.

In this sense, contributions act as a multiplier. Shared experience compounds into better tooling and more predictable systems across the ecosystem. What was visible in hallway conversations and session Q&A at Unlocked mirrors what’s happening in these repositories every day: a project evolving through collective operational knowledge.

## What This Means for Operators

Across sessions and discussions, several operational priorities surfaced repeatedly for teams running or evaluating Valkey:

- Monitor P99 and P999 latency, not just medians. Tail percentiles reveal the edge cases that cause outages while median latency still looks stable.
- Instrument payload size distribution alongside traditional metrics. Bandwidth saturation often appears before CPU or memory pressure signals trouble.
- Treat traffic shape as a first-class metric. Bursty workloads, background work, and large responses frequently explain instability better than raw request counts.

These recommendations reflect the operational questions teams managing Valkey at scale are actively solving.

## Staying Current

Because these priorities continue to evolve, most of the related work and discussion happens in the open through release notes, [open issues in GitHub](https://github.com/valkey-io/valkey/issues), ongoing community conversations, and conferences like [Unlocked](https://www.unlockedconf.io).

For those interested in following where these signals continue to develop, the [Valkey Community newsletter](https://valkey.io/blog/valkey-newsletter-new/#email-signup) provides periodic summaries of new releases, tooling updates, and contributor insights as they are published.
