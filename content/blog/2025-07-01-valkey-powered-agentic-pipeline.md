## Lightning-Fast Agent Messaging with Valkey

Modern applications are slipping away from monoliths toward fleets of specialised agents—small programs that sense, decide, and act in tight, real-time loops. When hundreds of them interact, their messaging layer must be lightning-quick, observable, and flexible enough to evolve without painful rewrites.

That need led us to **Valkey**—an open-source, community-driven, in-memory database fully compatible with Redis. Streams, Lua scripting, a mature JSON & Search stack, and a lightweight extension mechanism all live inside one process, giving our agents a fast, shared nervous system.

---

### Inside the Pipeline — Code & Commentary

Whenever a headline arrives, it passes through four focused agents. We’ll trace that journey and highlight the micro-optimisations that keep agent-to-agent latency in the low microseconds.

```text
NewsFetcher → Enricher → Fan-out → UserFeedBuilder → React UI
```

#### Stage 1 – NewsFetcher (pushes raw headlines)

```python
# fetcher.py – 250 msgs / s
await r.xadd("news_raw", {"id": idx, "title": title, "body": text})
```

Adds each raw article to the `news_raw` stream so downstream agents can pick it up.

#### Stage 2 – Enricher (classifies on GPU if available)

```python
# enrich.py – device pick, GPU gauge
DEVICE = 0 if torch.cuda.is_available() else -1          # −1 → CPU
GPU_GAUGE.set(1 if DEVICE >= 0 else 0)
```

Detects whether a GPU is present and records the result in a Prometheus gauge.

```python
# classify then publish to a topic stream
pipe.xadd(f"topic:{doc['topic']}", {"data": json.dumps(payload)})
```

Writes the enriched article into its `topic:<slug>` stream for later fan-out.

#### Stage 3 – Fan-out (duplicates to per-user feeds + dedupe)

```lua
-- fanout.lua – smooths burst traffic
-- ARGV[1] = max stream length (e.g. 10000)
-- Trim ensures old messages don’t balloon memory or backlog
redis.call('XTRIM', KEYS[1], 'MAXLEN', tonumber(ARGV[1]))
```

Atomically trims each topic stream inside Valkey to keep memory and queues flat.

```python
# fanout.py – per-user de-duplication
added = await r.sadd(f"feed_seen:{uid}", doc_id)
if added == 0:
    continue                              # duplicate → skip
# 24h TTL for dedup tracking; NX avoids overwriting if already set
await r.expire(f"feed_seen:{uid}", 86_400, nx=True)
```

Skips any article a user has already seen by tracking IDs in a 24-hour set.

#### Stage 4 – UserFeedBuilder (tails the stream over WebSockets)

```python
# gateway/main.py – live feed push
msgs = await r.xread({stream: last_id}, block=0, count=1)
await ws.send_json(json.loads(msgs[0][1][0][1]["data"]))
```

Continuously reads from the user’s feed stream and pushes each new item over a WebSocket.

#### Self-Tuning Readers (load generator & consumer)

```python
# user_reader.py – dynamic pacing
target_rps = min(MAX_RPS, max(1.0, latest_uid * POP_RATE))
await asyncio.sleep(1.0 / target_rps)
```

Adjusts its own consumption rate to match the current user count—no external autoscaler needed.

---

A single `make` command spins up Valkey, agents, Grafana, and the UI under Docker Compose in roughly five minutes. If the host has a GPU, the Enricher detects and uses it automatically; otherwise it proceeds on CPU with the same code path.

---

### Why We Bet on Valkey

Streams and consumer groups move messages in well under a millisecond, Lua keeps heavy fan-out logic server-side, and JSON / Search lets enrichment stay in memory. Grafana began charting backlog lengths and latency immediately, and swapping Python agents for Rust or Go required no datastore changes. The Redis compatibility is genuine—we didn’t tweak a single configuration knob when moving from Redis to Valkey.

---

### Challenges on the Road — and How We Solved Them

**Bursty traffic turned streams into “slinkies.”**
Our first load test looked like a staircase: sudden article bursts piled up and only drained once the wave had passed. Pushing a ten-line Lua XTRIM script into Valkey meant trimming happened atomically, right where the data lived. Queue lengths flattened almost instantly.

**Users started seeing déjà-vu in their feeds.**
A subtle race caused the same article ID to reach a user twice. We fixed it by introducing a tiny “seen” set per user (`feed_seen:<uid>`). If `SADD` returns 0, the item is silently skipped. Dupes dropped from roughly 3% to effectively zero, and the extra memory footprint was trivial.

**Some replicas bragged about GPUs they didn’t have.**
On mixed CPU/GPU clusters, a few Enricher containers claimed CUDA but actually ran on CPU. Emitting a one-shot Prometheus gauge (`enrich_gpu`) exposed the truth in Grafana, so mis-scheduled pods are obvious at a glance.

**Reader throughput lagged behind user growth.**
Instead of wiring up a Kubernetes HPA, we let the reader recalculate its own pops-per-second each second (`latest_uid * POP_RATE`). More users? Faster loop. Peak load? The delay clamps at a safe maximum. No Helm charts, no YAML deep dives.

**A missing module once took down staging.**
Someone built Valkey without the JSON module; enrichment crashed only after deploy. Our CI pipeline now boots a throw-away Valkey container, runs `MODULE LIST`, and fails the build if anything critical is absent—misconfigurations caught before merge.

---

### Observability That Comes Standard

Because every agent exports counters and histograms, Grafana’s Agent Overview dashboard fills itself:

* ingestion, enrichment, and fan-out rates
* topic-specific backlog lengths
* p50 / p99 command latency (µs)
* dataset-only memory use, network throughput, connected-client count
* exact number of Enricher replicas running on GPU right now

A helper script (`tools/bootstrap_grafana.py`) rewrites the dashboard whenever we add a metric, so panels stay readable and colour-coded.

---

### Performance Snapshot

* **Raw articles ingested:** 250 / s
* **Personalised feed messages:** 300k / s
* **Valkey RAM (steady):** 12 MB
* **p99 Valkey op latency:** ≈ 200 µs
* **GPU uplift (A10G):** 3.6× faster enrichment

Scaling up is a single Docker command—no Helm charts, no YAML deep dives.

---

### What’s Next

Our long-term goal is to make agent networks something you can spin up and evolve in minutes, not weeks. We’re betting that agent-based infrastructure is the next primitive—and we want it to be drop-in simple.

* **LangChain integration** — idiomatic `ValkeyStreamTool` for LLM workflows
* **Message Control Plane** — auto-provision streams, ACLs, metrics
* **Rust agents** — lower memory, same Streams API

Pull requests and fresh ideas are always welcome.

---

### Why It Might Matter to You

Whether you’re building a recommendation engine, a real-time feature store, or an IoT swarm, Valkey supplies stateful speed, built-in observability, and room to evolve—while your agents stay blissfully focused on their own jobs.

---

### Try It Yourself

You can spin up the full system in one command:

```bash
git clone https://github.com/vitarb/valkey_agentic_demo.git
cd valkey_agentic_demo
make
```

Then open:

* **Feed UI**: [http://localhost:8500](http://localhost:8500)
* **Grafana**: [http://localhost:3000](http://localhost:3000) (admin / admin)

