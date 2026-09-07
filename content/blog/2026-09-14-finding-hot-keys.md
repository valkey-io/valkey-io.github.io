+++
title = "Finding hot keys in Valkey"
date = 2026-09-14 01:01:01
description = "A single hot key can saturate one shard while the rest of your cluster idles, and until now Valkey could not tell you which key it was. The new HOTKEYS command answers that in one call."
authors = ["alonare"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-03.webp"
+++

Valkey scales by splitting work up.
Add shards and the keyspace spreads across them; add replicas and reads fan out.
One key breaks that arithmetic.

A key lives in one slot, which lives on one shard.
If a single key takes a large share of your traffic, that shard saturates no matter how many others you add, and resharding does not help because there is nothing to split.
The cluster looks half idle while one node runs at 100% CPU, and dashboards that average across the cluster show nothing wrong.

## Why hot keys were hard to find

Noticing that a node is hot is easy.
Naming the key was the hard part, because the existing tools describe the keyspace rather than the traffic.

`MONITOR` streams every command to a client, costing throughput on the node you are trying to rescue.
`valkey-cli --hotkeys` scans the whole keyspace calling `OBJECT FREQ`, so it needs a `*lfu` `maxmemory-policy` and reports least-frequently-used (LFU) counters: a decayed measure of long-run popularity, not the current rate.
Client-side sampling works if you own every client and can deploy mid-incident.

## What HOTKEYS reports

Valkey 9.2 adds [`HOTKEYS`](/commands/hotkeys/), which answers the question on the server: over the last few seconds, which keys took the most requests?

```bash
valkey-cli CONFIG SET hotkeys-top-k 16
valkey-cli HOTKEYS GET
```

```text
1) 1) "key"
   2) "product:8fd21a"
   3) "db"
   4) (integer) 0
   5) "qps"
   6) (integer) 48200
```

Each entry names the key, the database it was accessed in, and its estimated rate in requests per second (RPS), sorted highest first.
Detection is off by default and costs nothing while off.

Missing keys count too, which catches something keyspace scans cannot see: a client hammering a key that was never written, after a bad key template or an eviction stampede, is real load and shows up here.

## Configuring it for what you are looking for

Three runtime-settable parameters.
`hotkeys-top-k` doubles as the on/off switch, because tracking zero keys is the same as not tracking.

| Parameter | Default | Range | Meaning |
| --- | --- | --- | --- |
| `hotkeys-top-k` | 0 (off) | 0-1000 | How many keys to track; `0` disables detection |
| `hotkeys-sampling-percentage` | 1 | 1-100 | Fraction of key accesses sampled |
| `hotkeys-window-seconds` | 1 | 1-300 | Length of the reporting window |

Sampling sets your resolution.
The smallest non-zero rate the report can show, and the step between values, is about `100 / (sampling-percentage x window-seconds)` RPS.
At the defaults that is roughly 100 RPS: enough to find a key doing 50,000 RPS, not enough to separate 120 from 200.

For always-on monitoring, use `hotkeys-top-k 16` with 1% sampling and a 10 second window.
That keeps the cost near the noise floor and brings the step down to about 10 RPS.

During an incident, set sampling to 100 and the window to 1.
A few percent more CPU on an already-saturated node buys a near-exact answer with one-second granularity, and you can turn it back down afterwards.

To judge whether resharding will help, raise `hotkeys-top-k` to 50 and compare nodes.
Load spread over many keys reshards well; 60% of it on one key does not, and needs client-side caching or a split across several keys instead.
Detection is per-node, so collect from each node and combine the results yourself.

Two habits matter as much as the settings.
Poll at least once per window, because each report covers the last completed window and replaces the previous one: polling every 30 seconds with a one-second window observes about 3% of the timeline.
Read `INFO hotkeys` alongside the report, because `hotkeys_last_window_samples` is the number of samples behind it, and a report built from few samples is one to read loosely.

## Why Space-Saving

We needed bounded memory regardless of keyspace size, the specific key names rather than "something is hot", almost no cost on the access path, and no threshold for an operator to guess.

Exact counting fails the first requirement: a counter per key across hundreds of millions of keys is a second copy of the keyspace, and you still have to sort it.

Count-Min Sketch (CMS) came first, contributed by [li-benson](https://github.com/li-benson) in [#2965](https://github.com/valkey-io/valkey/pull/2965).
A CMS answers "how often did I see *this* key" in fixed memory, which is the wrong question when not knowing the key is the whole problem.
Ranking with it needs a second structure and a rule for what enters it, which there meant operator-configured rate thresholds.

Space-Saving keeps exactly K slots, each holding a key, a count, and an error bound.
On each observation it increments the key if present, fills a free slot if there is one, or else evicts the smallest-count slot and gives the new key that count plus one.
That eviction rule *is* the ranking, so there is no second structure and no threshold: genuinely hot keys survive eviction on their own, and one-off keys churn through the weakest slot.
Nothing needs tuning against a target error, because the filter calibrates itself against whatever the traffic is.

Two guarantees come with it.
Each entry's error bound puts the true count in `[count - error, count]`, so accuracy is per-entry rather than a property of the whole structure.
Any key above `N/K` of the sampled traffic is guaranteed to be tracked, where `N` is the sample count that `INFO` reports, which is why raising `hotkeys-top-k` gives you a longer credible list.

Rates come from a frozen window: counts accumulate, and when the window elapses the summary freezes whole and a fresh one starts, so `HOTKEYS GET` never reports a partial window.
Cumulative counters would never forget, letting yesterday's hot key outrank today's.
Exponential decay would want floating point and a clock read on every sampled access, plus a half-life to tune.

## What it costs

Detection is off by default, so baseline overhead is zero.
Enabled, the cost tracks the sampling percentage:

| Sampling percentage | Throughput | Degradation |
| ---: | ---: | ---: |
| Baseline (disabled) | 210.6K | 0.00% |
| 1 | 209.5K | 0.52% |
| 10 | 209.0K | 0.76% |
| 50 | 207.2K | 1.61% |
| 100 | 205.2K | 2.56% |

Sampling every access costs under 3% of throughput; the 1% default costs half a percent.
Memory is a few kilobytes: one fixed summary of `hotkeys-top-k` entries per window, whatever the keyspace size.

Measured on the implementation in [#3708](https://github.com/valkey-io/valkey/pull/3708): cluster-mode enabled with no replicas, `c7g.16xlarge` for client and server, 800 connections, 20/80 SET/GET split across 32 `valkey-benchmark` processes, no TLS, 3M keys of 18 bytes with 512-byte values, `io-threads` 1, `hotkeys-top-k` 16 and `hotkeys-window-seconds` 1.

## Next steps

Enable it on a node you are curious about, send some skewed traffic, and read the list:

```bash
valkey-cli CONFIG SET hotkeys-top-k 16
valkey-cli CONFIG SET hotkeys-sampling-percentage 100
valkey-cli HOTKEYS GET
valkey-cli INFO hotkeys
```

`HOTKEYS HELP` lists the subcommands, and the reference pages are [`HOTKEYS GET`](/commands/hotkeys-get/) and [`HOTKEYS RESET`](/commands/hotkeys-reset/).

Plenty is left to build.
Reads and writes share one summary today, and splitting them is a natural follow-up.
Alerting would be better served by a push notification or a short history of windows than by polling.
Aggregating across a cluster belongs in tooling above the server and would be a useful contribution.

If the answers are not the ones you needed, [open an issue](https://github.com/valkey-io/valkey/issues) with your version and configuration.
Knowing which key is hot is only the first question, and we would like to know what you ask next.
