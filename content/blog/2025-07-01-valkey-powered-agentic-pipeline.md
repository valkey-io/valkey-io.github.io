# Lightning-Fast Agent Messaging with Valkey

## From Tweet to Tailored Feed

### Why Messaging Matters for Agentic Systems

As modern software shifts toward ecosystems of intelligent agents—small, purpose-built programs that sense, decide, and act—the infrastructure underneath has to keep up. These systems aren’t batch-driven or monolithic; they’re always on, highly parallel, and relentlessly evolving. What they need is a messaging backbone that’s fast, flexible, and observable by design.

That requirement led us to **Valkey**: an open-source, community-driven, in-memory database fully compatible with Redis. Streams give us an append-only event log; Lua scripting runs coordination logic server-side where it’s cheapest; JSON & Search handle structured payloads without external ETL. In short, Valkey provides our agents a fast, shared nervous system.

In this post we’ll put that claim to the test. We built a real-time content pipeline—five autonomous agents that pull headlines, enrich them with topics, route stories to interested users, and push live updates to the browser. Everything runs in Docker (GPU optional) and lights up Grafana dashboards the moment messages start flowing. We’ll walk through the stages, the code, the rough spots, and the fixes that took us from works-on-laptop to 250 msgs/s on commodity hardware.

All source lives in the [**valkey‑agentic‑demo repository**](https://github.com/vitarb/valkey_agentic_demo). Clone it and follow along.

## Inside the Pipeline — Code & Commentary

```
Stage 1  NewsFetcher      →  
Stage 2  Enricher         →  
Stage 3  Fan-out          →  
Stage 4  UserFeedBuilder  →  
Stage 5  Reader (self-tuning) →
React UI
```

We’ll step through each stage and call out the snippet that makes it tick.

### Stage 1 – NewsFetcher (pushes raw headlines)

```python
# fetcher.py – ~250 msgs/s
await r.xadd("news_raw", {"id": idx, "title": title, "body": text})
```

Publishes each raw article into the `news_raw` stream so downstream agents can pick it up exactly once.

### Stage 2 – Enricher (tags topics & summarizes)

```python
# enrich.py – pick device, expose GPU status
DEVICE = 0 if torch.cuda.is_available() else -1
GPU_GAUGE.set(1 if DEVICE >= 0 else 0)       # Prometheus metric
```

Detects a GPU and records the fact for Grafana.

```python
# enrich.py – zero-shot topic classification via LangChain
from langchain_community.llms import HuggingFacePipeline
from transformers import pipeline

zeroshot = pipeline(
    "zero-shot-classification",
    model="typeform/distilbert-base-uncased-mnli",
    device=DEVICE,
)
llm = HuggingFacePipeline(pipeline=zeroshot)

topic = llm(
    "Which topic best fits: " + doc["title"],
    labels=TOPICS
).labels[0]

payload = {**doc, "topic": topic}
pipe.xadd(f"topic:{topic}", {"data": json.dumps(payload)})
```

Wraps Hugging Face in LangChain so future chains can be composed declaratively. Publishes enriched articles into `topic:<slug>` streams.

### Stage 3 – Fan-out (duplicates & deduplicates)

```lua
-- fanout.lua – keeps streams bounded
redis.call('XTRIM', KEYS[1], 'MAXLEN', tonumber(ARGV[1]))  -- e.g. 10000
```

Trims each topic stream inside Valkey—no Python round-trip—so spikes never explode memory.

```python
# fanout.py – skip repeats per user
added = await r.sadd(f"feed_seen:{uid}", doc_id)
if added == 0:
    continue                  # already delivered
await r.expire(f"feed_seen:{uid}", 86_400, nx=True)  # 24 h TTL
```

Guarantees idempotency: a user never sees the same article twice.

### Stage 4 – UserFeedBuilder (WebSocket push)

```python
# gateway/main.py – tail & push
msgs = await r.xread({stream: last_id}, block=0, count=1)
await ws.send_json(json.loads(msgs[0][1][0][1]["data"]))
```

Streams new feed entries straight to the browser, keeping UI latency sub-100 ms.

### Stage 5 – Reader (self-tuning load consumer)

```python
# user_reader.py – scale pops per user
target_rps = min(MAX_RPS, max(1.0, latest_uid * POP_RATE))
await asyncio.sleep(1.0 / target_rps)
```

Acts as a load generator and back-pressure sink, pacing itself to active-user count—no K8s HPA required.

Boot-up: one `make dev` spins the whole constellation—Valkey, agents, Grafana, React UI—on a fresh EC2 box in \~5 min. If a GPU exists, the Enricher uses it automatically.

## Why We Picked Valkey for the Job

| Valkey Feature            | Why It Helped                                                               |
| ------------------------- | --------------------------------------------------------------------------- |
| Streams + Consumer Groups | Ordered, at-least-once delivery with sub-millisecond round trips.           |
| Server-side Lua           | Runs fan-out trimming inside Valkey—no network hop, avoids Python GIL lock. |
| JSON & Search Modules     | Stores structured payloads without Postgres or Elasticsearch.               |
| INFO‑rich Metrics         | One command exposes memory, I/O, latency, fragmentation, and more.          |
| Redis Compatibility       | Swapped Redis OSS 7.2 with Valkey—zero config changes.                      |

## Real-World Bumps (and the Fixes That Worked)

**CPU-bound Enricher throttled the entire pipeline**
On a c6i.large we stalled at \~10 msgs/s. Moving classification to an A10G and batching 32 docs per call lifted throughput to 60 msgs/s and cleared topic backlogs.

**Pending messages got “stuck”**
A missed `XACK` left IDs in the PENDING list. We now XACK immediately after each write and run a tiny “reaper” coroutine that reclaims any entry older than 30 s.

**Duplicate articles spammed user feeds**
A crash between pushing to a user list and trimming the topic stream caused retries. The `feed_seen` set (see code) made idempotency explicit—duplication rate fell to zero and the skip counter in Grafana confirms it.

**Readers lagged behind synthetic user spikes**
A fixed 50 pops/s couldn’t keep up when we seeded 10k users. The self-tuning delay now scales to 200 pops/s automatically and holds feed backlog near zero.

All fixes are now defaults in the repository.

## Observability That Comes Standard

Valkey’s INFO command and Prometheus-client hooks expose almost everything we care about:

| Metric                              | Question It Answers                                    |
| ----------------------------------- | ------------------------------------------------------ |
| `enrich_in_total` / `fan_out_total` | Are we ingesting and routing at expected rates?        |
| `topic_stream_len`                  | Which topics are running hot—and about to back up?     |
| `reader_target_rps`                 | Is the reader keeping pace with user growth?           |
| `histogram_quantile()`              | Are p99 Valkey commands still < 250 µs?                |
| Dataset memory                      | Is trim logic holding memory at 12 MB steady?          |

A one-liner (`tools/bootstrap_grafana.py`) regenerates the dashboard whenever we add a metric, keeping panels tidy and color-coded.

## Performance Snapshot

| Metric                     | Result                 |
| -------------------------- | ---------------------- |
| Raw articles ingested      | 250 msgs/s             |
| Personalized feed messages | 300 k msgs/s           |
| Valkey RAM (steady)        | 12 MB                  |
| p99 Valkey op latency      | ≈ 200 µs               |
| GPU uplift (A10G)          | ≈ 5× faster enrichment |

Scaling up is a single Docker command—no Helm, no YAML spelunking.

## What's Next

Our goal is agent networks you can spin up—and evolve—in minutes.

* **LangChain-powered Message Control Plane (MCP)** – declare a chain and get a Valkey stream, ACL, and metrics stub automatically.
* **Rust agents** – same Streams API, lower memory footprint.
* **Auto-provisioned ACLs & dashboards** driven by the MCP server.

Contributions and design discussions are very welcome.

## Why It Might Matter to You

If you’re building recommendation engines, real-time feature stores, or IoT swarms, Valkey supplies stateful speed, built-in observability, and room to evolve—while your agents stay blissfully focused on their own jobs.

## Try It Yourself

Spin up the full system in one command:

```bash
git clone https://github.com/vitarb/valkey_agentic_demo.git
cd valkey_agentic_demo
make dev
```

Then open:

* **Feed UI**: [http://localhost:8500](http://localhost:8500)
* **Grafana**: [http://localhost:3000](http://localhost:3000) (admin / admin)

