# Lightning-Fast Agent Messaging with Valkey

## From Tweet to Tailored Feed

Modern applications are moving beyond monoliths into distributed fleets of specialized agents—small programs that sense, decide, and act in real-time. When hundreds of these interact, their messaging layer must be lightning-fast, observable, and flexible enough to evolve without rewrites.

That requirement led us to **Valkey**: an open-source, community-driven, in-memory database fully compatible with Redis. With streams, Lua scripting, a mature JSON & Search stack, and a lightweight extension system, Valkey provides our agents with a fast, shared nervous system.

## Inside the Pipeline: Code & Commentary

Each incoming headline flows through four agents. Here's that journey, including key optimizations that keep agent-to-agent latency in the low microseconds:

```
NewsFetcher → Enricher → Fan-out → UserFeedBuilder → React UI
```

### Stage 1 – NewsFetcher (pushes raw headlines)

```python
# fetcher.py – ~250 msgs/s
await r.xadd("news_raw", {"id": idx, "title": title, "body": text})
```

Adds each raw article to the `news_raw` stream for downstream agents to consume.

### Stage 2 – Enricher (tags topics and summarizes)

```python
# enrich.py – device pick, GPU gauge
DEVICE = 0 if torch.cuda.is_available() else -1
GPU_GAUGE.set(1 if DEVICE >= 0 else 0)
```

Detects GPU availability and exposes the result to Prometheus.

```python
# enrich.py – run the classifier with LangChain
from langchain_community.llms import HuggingFacePipeline
from transformers import pipeline

zeroshot = pipeline(
    "zero-shot-classification",
    model="typeform/distilbert-base-uncased-mnli",
    device=DEVICE,
)
llm = HuggingFacePipeline(pipeline=zeroshot)

topic = llm("Which topic best fits: " + doc["title"], labels=TOPICS).labels[0]
payload = {**doc, "topic": topic}
pipe.xadd(f"topic:{topic}", {"data": json.dumps(payload)})
```

Uses a Hugging Face zero-shot model—wrapped in LangChain—to label articles and route them into topic streams.

### Stage 3 – Fan-out (duplicates to per-user feeds + deduplication)

```lua
-- fanout.lua – smooths burst traffic
-- ARGV[1] = max stream length (e.g. 10000)
redis.call('XTRIM', KEYS[1], 'MAXLEN', tonumber(ARGV[1]))
```

Trims topic streams inside Valkey to prevent unbounded growth.

```python
# fanout.py – per-user de-duplication
added = await r.sadd(f"feed_seen:{uid}", doc_id)
if added == 0:
    continue  # duplicate → skip
await r.expire(f"feed_seen:{uid}", 86_400, nx=True)
```

Skips already-seen articles by tracking IDs in a 24-hour `feed_seen` set.

### Stage 4 – UserFeedBuilder (streams updates via WebSockets)

```python
# gateway/main.py – live feed push
msgs = await r.xread({stream: last_id}, block=0, count=1)
await ws.send_json(json.loads(msgs[0][1][0][1]["data"]))
```

Tails the per-user stream and emits new entries directly to the browser.

### Self-Tuning Readers (load generator & consumer)

```python
# user_reader.py – dynamic pacing
target_rps = min(MAX_RPS, max(1.0, latest_uid * POP_RATE))
await asyncio.sleep(1.0 / target_rps)
```

Dynamically adjusts consumption rate based on user count—no external autoscaler needed.

A single `make` command launches Valkey, agents, Grafana, and the UI via Docker Compose in \~5 minutes. If a GPU is present, the Enricher uses it automatically.

---

## Why We Bet on Valkey

Valkey Streams and consumer groups move messages in <1 ms. Lua keeps fan-out logic server-side. JSON/Search allows enrichment to stay in-memory. Grafana charts latency and backlog immediately. Python agents can be swapped for Rust or Go with no changes to the datastore.

Redis compatibility was seamless—no config changes needed.

## Real-World Bumps (and the Fixes That Worked)

**1. Enricher bottlenecked the pipeline**
A c6.xlarge maxed out at \~10 msg/s on CPU. GPU offload + batch processing (32 articles) on an A10G raised throughput to 60 msg/s.

**2. Messages got stuck in consumer groups**
Missed `XACK` left IDs in `PENDING`. Fix: immediately `XACK` after processing + a 30s "reaper" to reclaim old messages.

**3. Duplicate articles appeared**
Fan-out crashes between user push and stream trim caused retries. `feed_seen` set made idempotency explicit. Dupes dropped to zero.

**4. Readers fell behind during spikes**
Fixed 50 pops/sec couldn’t keep up with 10k users. Self-tuning delay (`latest_uid * POP_RATE`) scaled up to 200 pops/sec.

All fixes are now defaults in the repo.

---

## Observability That Comes Standard

Every agent exports metrics. Grafana's dashboard auto-populates:

* Ingestion, enrichment, and fan-out rates
* Topic-specific backlog lengths
* p50 / p99 command latency (in µs)
* Dataset memory use, network throughput, connected clients
* Enricher replicas on GPU (via `enrich_gpu` gauge)

`tools/bootstrap_grafana.py` auto-updates the dashboard when new metrics are added.

## Performance Snapshot

| Metric                     | Result                 |
| -------------------------- | ---------------------- |
| Raw articles ingested      | 250 /s                 |
| Personalized feed messages | 300k /s                |
| Valkey RAM (steady)        | 12 MB                  |
| p99 Valkey op latency      | ≈ 200 µs               |
| GPU uplift (A10G)          | 5x faster enrichment |

Scaling up? One Docker command. No Helm. No YAML deep dives.

---

## What's Next

We aim to make agent networks something you can spin up in minutes, not weeks. Our roadmap:

* **LangChain-powered MCP (Message Control Plane)** to declaratively wire chains to Valkey.
* **Rust agents** using the same Streams API but with lower memory.
* **Auto-provisioned ACLs & metrics** via the MCP server.

Pull requests and fresh ideas welcome.

## Why It Might Matter to You

Whether you're building recommendation engines, real-time feature stores, or IoT swarms—Valkey offers stateful speed, built-in observability, and freedom to evolve. Your agents stay blissfully focused on their own jobs.

## Try It Yourself

Spin up the full system in one command:

```bash
git clone https://github.com/vitarb/valkey_agentic_demo.git
cd valkey_agentic_demo
make dev
```

Then open:

* **Feed UI**: [http://localhost:8500](http://localhost:8500)
* **Grafana**: [http://localhost:3000](http://localhost:3000) (login: `admin` / `admin`)

