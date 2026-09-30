+++
title = "Finding Hot Keys in Valkey"
date = 2026-09-14

description = "A single hot key can saturate one server while the rest of your deployment idles, and knowing it exists is far easier than naming it. Valkey's new HOTKEYS command answers the naming part on the server, for under 1% of throughput at its default settings."
authors = ["alonare"]
[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-03.webp"
+++

The alert is never *"`product:8fd21a` is taking 48,000 requests per second."*

What you get instead is a server pinned at 98% CPU while its neighbours coast at 30%, and because the dashboards average across every node, the graph you watch insists nothing is wrong.
Scaling out does not help, which is the moment the diagnosis arrives: a key lives in one slot and a slot lives on one shard, so adding shards cannot split a single key.
Scaling up buys headroom rather than a fix, and in standalone mode there is nowhere to spread the load at all.

By then you are fairly certain you have a hot key.
Naming it is the part that takes the hours.

Valkey now answers that on the server with [`HOTKEYS`](https://valkey.io/commands/hotkeys/), backed by a bounded heavy-hitter summary that costs under 1% of throughput at its default settings [^1].
This post covers why naming the key was hard, how the summary works, what it measured, and where it still falls short.

## Why hot keys are hard to find

Valkey already tells you a great deal about your workload.
The gap is narrow and specific: none of the existing mechanisms hands you *the name of the key taking an outsized share of traffic in the last few seconds*, which is the one thing you need at 3am.

[`MONITOR`](https://valkey.io/commands/monitor/) gets closest, because it streams every command as it happens.
The problem is the price: the documentation measures a single `MONITOR` client reducing throughput by more than 50% [^4], and a statistically meaningful picture means leaving it running — on the node you are trying to rescue — while you grep a firehose for a key you cannot yet name.

`valkey-cli --hotkeys` walks the keyspace and asks each key how popular it has been.
It reads the least-frequently-used (LFU) counters, so it requires an `*lfu` `maxmemory-policy`, and those counters measure long-run popularity with decay rather than the current rate.
More practically, it is a full keyspace walk calling [`OBJECT FREQ`](https://valkey.io/commands/object-freq/) on every key, so on a large keyspace the answer can take a long time to arrive.

[`CLUSTER SLOT-STATS`](https://valkey.io/commands/cluster-slot-stats/) tells you which slot is hot, and it is the right tool for judging whether your data is unevenly distributed and whether resharding will help.
What it cannot do is name the key, since a slot holds many — so it narrows a keyspace walk rather than replacing one.

Client-side sampling answers the question precisely, provided every client is already instrumented.
Instrumenting them once an incident is under way is a second incident rather than a plan.

There is also a blind spot all of these share except `MONITOR`: a key that does not exist generates no keyspace entry to scan, so a client hammering a missing key is invisible to any approach that inspects stored data.

**Note:** The scenario above is a composite rather than a single postmortem. In the case it draws on, the key was eventually found by correlating the hot slot against a deploy that had changed a cache key template earlier that day. That works when somebody remembers the deploy, which is luck rather than a method.

## Balancing memory efficiency with accuracy

The useful realization is that the question is far smaller than the traffic behind it.
A server handling 200,000 requests per second across millions of keys still only owes you a list of about ten, so what you want is a compact list of the heavy hitters, maintained by the server and cheap enough to leave running *before* the next incident.

Exact counting is the obvious approach and the first to fail: a counter per key adds several bytes to every key you store, and across billions of keys that overhead becomes the dominant cost of answering a question about ten of them.

The first suggestion for server-side hot-key tracking was contributed by [li-benson](https://github.com/li-benson) in [#2965](https://github.com/valkey-io/valkey/pull/2965), using a Count-Min Sketch (CMS).
A CMS estimates how often a given key was seen, and it cannot rank on its own: ranking needs a companion structure and an admission rule, and in #2965 that rule was an absolute, operator-configured requests-per-second threshold — a knob with no right value across shards of different size.

Space-Saving, which is what shipped, folds the ranking into a single bounded structure instead.
Picture a fixed array of slots, each holding a key name, its database number, a count, and an error bound.
On each observed access the server increments the key if it already holds a slot, takes a free slot if one is available, and otherwise displaces the slot with the smallest count — handing the incoming key that count plus one.

That last step is what produces the ranking.
Because a new key inherits the score of the one it displaced it arrives on probation rather than at zero: a genuinely hot key holds its slot, while a key touched once lands in the weakest slot and is displaced by the next arrival needing the room.
(This displacement happens inside the summary, and is unrelated to keyspace eviction or `maxmemory` policy.)

There is exactly one knob, which is worth stating plainly rather than calling the structure self-tuning.
That knob is `K`, the number of slots, and it sets both how long your list is and how tight: any key above `N/K` of the sampled traffic is guaranteed to be tracked, where `N` is the number of samples in the window.
More slots buy a longer list *and* a smaller error bound, and each entry reports its own bound, so accuracy belongs to the entry rather than to the structure.

One design choice remains.
In contrast with the alternatives considered, rates come from a window that completes and then freezes rather than from a running counter: cumulative counters never forget, which would let yesterday's hot key outrank today's, and exponential decay would need a clock read on every sampled access plus a half-life to tune.
The reported rate uses that window's measured duration rather than its nominal length, so a late rotation on a busy server does not inflate the number.

## What changes for you

Detection is off by default.
Turning it on is a runtime configuration change, and one window later the list is there:

```text
127.0.0.1:6379> CONFIG SET hotkeys-top-k 16
OK
127.0.0.1:6379> HOTKEYS GET
1) 1) "key"
   2) "product:8fd21a"
   3) "db"
   4) (integer) 0
   5) "qps"
   6) (integer) 48200
```

Each entry names the key, the database it was accessed in, and its estimated rate in requests per second, sorted highest first [^3].
Tracking is per database, which has one consequence worth knowing: the same key name in two databases is two different tracked keys, so it can occupy two slots and appear twice in the list.

`HOTKEYS` reports load whether or not the key exists.
A bad key template or an eviction stampede can leave a client hammering a key that was never written, which is invisible to a keyspace scan and surfaces here.

Three parameters control it, all settable at runtime:

| Parameter | Default | Range | Meaning |
| --- | ---: | ---: | --- |
| `hotkeys-top-k` | 0 | 0–1000 | How many keys to track. Setting it to `0` disables tracking |
| `hotkeys-sampling-percentage` | 1 | 1–100 | Percentage of key accesses that are sampled |
| `hotkeys-window-seconds` | 1 | 1–300 | Length of the reporting window |

Read `INFO hotkeys` alongside the list, which reports how much evidence is behind it:

```text
127.0.0.1:6379> INFO hotkeys
# Hotkeys
hotkeys_last_window_samples:211833
hotkeys_last_window_duration_ms:1022
```

`hotkeys_last_window_samples` is the `N` in that `N/K` bound: at 211,833 samples over 16 slots, anything above roughly 13,000 sampled accesses is guaranteed to be in the list, so the top entries are trustworthy.
When that number is small — a quiet server, or a low sampling percentage over a short window — the guarantee weakens with it, and the ordering of the lower entries stops being meaningful even though the list is still returned.

## Benchmarks

A server at 98% CPU is where you can least afford a heavy diagnostic, so I measured the impact before trusting it.

| Property | Value |
| --- | --- |
| Instances | 2 × `c7g.16xlarge`, same availability zone, client and server on separate machines |
| Valkey | `unstable` at the commit that merged the feature [^1] |
| Dataset | 3,000,000 keys, 512-byte values |
| Workload | 20% `SET` / 80% `GET`, uniform random key selection, 800 connections |
| Disabled | TLS, replicas, cluster mode, I/O threads |
| Per run | 20s warm-up (excluded), then 60s measured |
| Repetitions | 5 per configuration, order reshuffled between repetitions |
| Total | 270 measured runs |

With detection off, the impact on throughput is zero, since nothing on the access path is doing anything.
The figures below are the reduction in total throughput against that baseline.

**Note:** Keys were drawn uniformly at random. With no genuine heavy hitters almost every sampled access displaces a slot and copies a key name, which makes this closer to a worst case for the algorithm than a typical workload.

### Throughput impact

![Reduction in throughput against sampling percentage, by key name length](images/sampling-cost.png)

| Key name length | 1% sampling | 10% | 50% | 100% |
|---|---:|---:|---:|---:|
| 16 B | +0.43% | +0.92% | +2.40% | +1.89% |
| 32 B | −0.25% | +0.57% | +0.96% | +2.13% |
| 64 B | +0.08% | +0.33% | +1.66% | +2.64% |
| 128 B | +0.29% | +0.47% | +1.82% | +3.94% |
| 256 B | +0.74% | +1.39% | +4.12% | +7.10% |
| 512 B | +0.49% | +1.87% | +7.14% | **+12.05%** |

The spread between those lines is the result I did not expect.
Sampling rate alone does not set the impact — the length of your key *names* scales it, because the key copy that happens when a slot is displaced gets more expensive the longer the name is.

At the default 1% sampling the reduction stays below **0.75%** at every key size tested, which is inside the benchmark's own run-to-run variation.
Sampling every access is where key length shows: roughly 1.9% with 16-byte names, rising to **12% at 512-byte names**.

**Note:** The 16-byte row is not monotonic, and the −0.25% at 32 B is not a speed-up. At short key names the whole effect is close to the run-to-run variation, which reached 2% for the 16-byte configuration. Read those two rows as "inside the noise" rather than as an ordering.

Tracking more keys is close to free by comparison: at full sampling with 16-byte names, every `hotkeys-top-k` from 1 to 64 landed between 1.2% and 2.1%, overlapping enough between repetitions that only the largest separates from the middle of the range.
So if you want a better answer, widening the list costs less than raising the sampling rate — and it tightens the `N/K` bound at the same time.

That shapes the practical advice: leaving detection on at the default 1% costs less than the noise floor whatever your key names look like, while raising sampling to 100% is affordable with short key names and a deliberate trade at 256 bytes and above.

### Latency

![GET p99 latency against sampling percentage](images/latency.png)

Latency tells the same story from the other side, as it must when the bottleneck is a single saturated thread — server CPU measured 1.00 core in all 270 runs, including the baseline.
With 512-byte key names, `GET` p99 drifts from 7.71 ms to 8.78 ms as sampling goes from off to 100%; with 16-byte names it barely moves, from 6.93 ms to 7.07 ms.
No cliff appears anywhere in the sweep, which is what makes the sampling percentage safe to raise on a server already under strain.

## Known limitations

Every number above describes one workload on one machine type, and the bias runs in a known direction: a skewed workload — the case where a hot key genuinely exists — should cost less, since hot keys hold their slots and most sampled accesses become a plain increment. That case was not measured.

`HOTKEYS` consumes only a few kilobytes regardless of keyspace size, holding one fixed summary of `hotkeys-top-k` entries per window — and that bound has consequences.
With no genuine heavy hitters you still get a full list, because the slots always hold something, and those rates describe slot churn rather than your traffic.
The reply also gives a rate without the error bound behind it, which is why `INFO hotkeys` matters: check the sample count before trusting the ordering.

Detection is per-node, so you query each node and combine the answers yourself; aggregating across a cluster belongs in tooling above the server.
Reads and writes currently share one summary, so a write-hot key and a read-hot key arrive looking identical, and splitting them is a natural follow-up.

## Try it

None of this retires the tools it sits beside.
`MONITOR` is still right when you need every command, `CLUSTER SLOT-STATS` is still how you judge slot-level distribution and resharding, and the LFU counters are still the right input for eviction decisions.
What changed is narrow, and it is the part that costs the hours: getting from *"one server is unhappy"* to *"this key is responsible"* no longer depends on somebody remembering a deploy.

To see it work, enable it on a server you are curious about, point some skewed traffic at it, then read the list:

```bash
valkey-cli CONFIG SET hotkeys-top-k 16
valkey-cli CONFIG SET hotkeys-sampling-percentage 100
# send skewed traffic, wait at least one window, then:
valkey-cli HOTKEYS GET
valkey-cli INFO hotkeys
```

If hot keys are a recurring shape of incident for you, the more useful step is to leave `hotkeys-top-k 16` on at the default sampling percentage, so the answer is already waiting the next time one server runs hot.

Two of the limitations above are open work and both are good first contributions: separating read-hot from write-hot keys, and exposing the per-entry error bound in the reply so an operator can see the confidence rather than infer it.
To pick one up — or if the answer you got was not the one you needed — [open an issue](https://github.com/valkey-io/valkey/issues) with your version and configuration.
Knowing which key is hot is only the first question, and I would like to know what you ask next.

## References

[^1]: [PR #3708 — Server-side hot key detection](https://github.com/valkey-io/valkey/pull/3708)
[^2]: [PR #2965 — The earlier Count-Min Sketch proposal](https://github.com/valkey-io/valkey/pull/2965)
[^3]: [`HOTKEYS GET` command reference](https://valkey.io/commands/hotkeys-get/)
[^4]: [`MONITOR` command reference — cost of running MONITOR](https://valkey.io/commands/monitor/)
