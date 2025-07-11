### From Tweet to Tailored Feed: How We Built Lightning‑Fast Agent Communication with **Valkey**

---

## Why Agentic Architectures Matter

The software world is quickly shifting toward **agent‑based** architectures—small, autonomous programs that sense, decide, and act. When you are running hundreds of these agents, their communication layer must be

* **Blazing‑fast** (so the system feels alive)
* **Observable** (so you can prove it is alive)
* **Flexible** (so you can evolve without rewiring everything)

**Valkey**—a community‑driven fork of Redis—hits the sweet spot: Redis‑grade speed, an Apache‑2 license, built‑in Streams, Lua, JSON, Search, plus an extension mechanism that lets you keep everything in a single lightweight server.

---

## The Demo Pipeline

```
NewsFetcher ➜ Enricher ➜ Fan‑out ➜ UserFeedBuilder (React UI)
```

Each box is a **tiny Python agent** talking over Valkey Streams. A one‑liner (`make dev`) launches the full stack—Valkey, Prometheus, Grafana, agents, and a React UI—in ≈ 5 minutes on a fresh EC2 box (GPU optional).

---

## What the System Does

1. **`NewsFetcher`** ingests raw news articles into the `news_raw` Stream.
2. **`Enricher`** classifies each article’s topic and writes it to `topic:<slug>` Streams.
3. **`Fan‑out`** distributes every article to thousands of personalised per‑user feeds.
4. **`UserFeedBuilder`** (a thin WebSocket gateway) pushes updates straight into browsers.

Users see a personalised timeline **instantly**—no duplicates, tiny memory footprint.

---

## Why We Picked Valkey

* **Streams + Consumer Groups** → sub‑millisecond hops, at‑least‑once delivery.
* **Server‑side Lua** → heavy fan‑out logic stays *inside* Valkey.
* **JSON & Search Modules** → enrich / query payloads without touching disk.
* **First‑class Metrics** → Prometheus exporter shows backlog, latency, memory.
* **Language‑agnostic** → today Python, tomorrow Rust/Go, same API.

---

## Battle‑tested Fixes (and the Code Behind Them)

### 1. Smoothing the “Slinky Backlog” with Lua

Bursty input created staircase‑shaped queues.
Instead of trimming in Python we let Valkey do it:

```lua
-- fanout.lua  – executed atomically inside Valkey
-- KEYS[1]  = topic stream key
-- ARGV[1]  = max_len
redis.call('XTRIM', KEYS[1], 'MAXLEN', tonumber(ARGV[1]))
return 1
```

Loaded once, invoked thousands of times per second—no extra RTT, no backlog waves.

---

### 2. Killing Duplicates with a 24 h “Seen” Set

```python
# agents/fanout.py  (excerpt)
seen_key = f"feed_seen:{uid}"
added = await r.sadd(seen_key, doc_id)
if added == 0:        # already delivered → skip
    DUP_SKIP.inc()
    continue
await r.expire(seen_key, SEEN_TTL, nx=True)   # lazy‑set 24 h TTL
```

A six‑line patch helped to get rid of duplicate posts.

---

### 3. GPU? Flip One Flag, Export One Metric

```python
# agents/enrich.py  (device auto‑select + Prometheus gauge)
USE_CUDA_ENV = os.getenv("ENRICH_USE_CUDA", "auto").lower()
DEVICE = 0 if USE_CUDA_ENV == "1" or (
    USE_CUDA_ENV == "auto" and torch.cuda.is_available()) else -1

GPU_GAUGE = Gauge(
    "enrich_gpu",
    "1 if this enrich replica is running on GPU; 0 otherwise",
)
GPU_GAUGE.set(1 if DEVICE >= 0 else 0)
```

Replica‑level visibility means Grafana instantly shows how many workers actually run on CUDA after a deploy.

---

### 4. Autoscaling the Feed Reader—No K8s Required

```python
# agents/user_reader.py  (dynamic pops / sec)
latest_uid = int(await r.get("latest_uid") or 0)
target_rps = min(MAX_RPS, max(1.0, latest_uid * POP_RATE))
delay = 1.0 / target_rps
TARGET_RPS.set(target_rps)      # Prometheus gauge
```

More users appear → the agent raises its own throughput linearly, capped for safety. Zero orchestrator glue code.

---

### 5. CI Guardrails: “Fail Fast if Valkey is Mis‑configured”

```yaml
# .github/workflows/build.yml
- name: Verify Valkey JSON module present
  run: |
    docker run -d --name valkey-check valkey/valkey-extensions:8.1-bookworm
    for i in {1..5}; do
      if docker exec valkey-check valkey-cli MODULE LIST | grep -q json; then
        docker rm -f valkey-check && exit 0
      fi
      sleep 1
    done
    echo "Valkey JSON module missing"; docker logs valkey-check || true; exit 1
```

One flaky staging deploy convinced us to turn the check into a mandatory gate.

---

## Running on GPU (the Docker Magic)

A two‑stage Dockerfile keeps the final image small **and** ships a warmed‑up HF model cache:

```dockerfile
# builder stage
FROM python:3.12-slim AS DEPS
...
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch==2.2.1+cu118 -f https://download.pytorch.org/whl/torch_stable.html
RUN --mount=type=cache,target=/opt/hf_cache \
    python - <<'PY'
from transformers import pipeline
pipeline('zero-shot-classification',
         model='typeform/distilbert-base-uncased-mnli')
PY

# runtime stage – just copy deps + cache
FROM python:3.12-slim
COPY --from=DEPS /usr/local      /usr/local
COPY --from=DEPS /opt/hf_cache/  /opt/hf_cache/
```

Cold‑start on an EC2 g5.xlarge? **≈ 30 s** until the first batch is classified.

---

## Observability Feels Native

Prometheus + Grafana came almost “for free” because every agent exports its own counters & histograms. Highlights:

* `enrich_classifier_latency_seconds` → p99 stays < 12 ms on A10G.
* `topic_stream_len` → reveals hot topics at a glance.
* `histogram_quantile()` over Valkey’s ping histogram → live *µs* latency.

Grafana auto‑generates a 4‑column dashboard (yes, via a Python script in `tools/bootstrap_grafana.py`!), so adding a metric is a one‑line change.

---

## Performance Snapshot

| Metric                 | Value                          |
| ---------------------- | ------------------------------ |
| Articles ingested      | **250 / s**                    |
| Personalised feed msgs | **300 k / s**                  |
| Valkey RAM             | **12 MB** steady               |
| p99 Valkey op          | **< 200 µs**                   |
| GPU uplift             | **3.6×** faster classification |

Scaling up was as simple as:

```bash
docker compose up \
  --scale enrich=6 \
  --scale fanout=3 \
  --scale reader=4
```

---

## Looking Ahead

* **LangChain integration** – drop‑in `ValkeyStreamTool`.
* **Message‑Control‑Plane (MCP)** – auto‑provision streams & ACLs.
* **Rust agents** – same Streams API, zero Python.

PRs, ideas, and critiques are all welcome—**join us!**

---

## Why This Matters to You

If you are building…

* an AI‑driven recommendation engine,
* a real‑time feature store, **or**
* an IoT swarm with thousands of sensors,

…Valkey is the **glue layer** that keeps state consistent and messages flying while your agents stay blissfully simple.

---

## Try It Yourself

```bash
git clone https://github.com/vitarb/valkey_agentic_demo.git
cd valkey_agentic_demo
make dev        # Valkey + agents + Grafana + React UI
```

Open:

* **Feed UI:** [http://localhost:8500](http://localhost:8500)
* **Grafana:** [http://localhost:3000](http://localhost:3000)  (`admin / admin`)

Questions? Ideas? Open an issue or PR—we’d love to see what you build next.

