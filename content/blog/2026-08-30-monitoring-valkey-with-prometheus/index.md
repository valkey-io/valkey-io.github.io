+++
title = "Monitoring Valkey with Prometheus"
date = 2026-08-30
description = "Learn how to expose Valkey metrics to Prometheus, visualize them in Grafana, and choose the right exporter for your deployment." 
authors =  ["dragosandriciuc"]
[taxonomies]
blog_type = ["Community Highlight"]
[extra]
featured = true
+++

Imagine this: your application is running fine, until one day, out of the blue, requests start timing out. The only thing you know for certain is that you implemented Valkey to be somewhere in the request path. Is it memory pressure? A lagging replica? A burst of slow commands? Without metrics, "somewhere in the request path" is as specific as your diagnosis gets.

Enter Prometheus. This post covers two popular ways to get Valkey metrics into Prometheus format, shows how to wire them up for live dashboards in Grafana, and walks through a docker compose setup you can run locally in a few minutes.

## What is Prometheus?

[Prometheus](https://prometheus.io/) is an open-source systems monitoring and alerting toolkit designed for reliability, multi-dimensional data collection and querying even during outages or broken architectures. It scrapes and periodically pulls metrics from instrumented jobs exposed by the systems it monitors, storing them as time series (changes over time) in its own local database, which allows you to query, graph, and alert on that data using its flexible query language, PromQL.

Each Prometheus server is standalone and runs independently, it relies only on:

- a local storage such as an HDD or SSD
- and [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/), which handles routing and deduplicating notifications

In Valkey's case there is a catch, Prometheus does not talk to Valkey natively. Valkey does not expose any metrics endpoint on its own however it does expose operational data through the [`INFO` command](https://valkey.io/commands/info/).

## Why monitor Valkey with Prometheus?

If you can't see your Valkey database or cache, it will continue to keep serving requests while its fragmentation goes unnoticed and memory creeps toward the `maxmemory` ceiling, or replicas lag behind and the first sign of trouble is often a latency spike somewhere downstream, long after the root cause started.

Putting Valkey behind Prometheus provides several advantages.

- **Trend visibility**: View the operations per second, hit ratio, memory usage, and connection counts over time, not just a snapshot from `INFO` when something's already broken.
- **Alerting before things break**: Set alert rules and manage those alerts using Alertmanager
which send out notifications using methods such as email, on-call notification systems, and chat platforms.
- **A single pane of glass**: Your Valkey metrics sit alongside your application, database, and infrastructure metrics in the same Prometheus and [Grafana](https://grafana.com/) stack using a standalone exporter, so you can correlate a request-latency spike in your app with what Valkey was doing at that exact moment.
- **Capacity planning**: Long-running historical data makes it much easier to answer "when do we need to scale this" instead of blindly guessing metrics.
- **Cluster and replication awareness**: For Valkey Cluster or primary/replica setups, per-node metrics make split-brain-adjacent issues (replication lag, slot imbalance) visible instead of silent by tracking deltas and slot assignments across them.

## Tools for exporting Valkey metrics to Prometheus

Two tools are useful when talking about exporting Valkey metrics with Prometheus: **BetterDB** and **redis_exporter**. They solve overlapping but distinct problems.

### BetterDB

[BetterDB](https://www.betterdb.com/) is a Valkey-native observability platform built by Kristiyan Ivanov (you'll find him active on the Valkey Slack). The project started because Valkey is growing quickly but it has mostly inherited tooling that predates it rather than tooling built to take advantage of what Valkey now offers natively, things like [`COMMANDLOG`](https://valkey.io/commands/commandlog/) and [`CLUSTER SLOT-STATS`](https://valkey.io/commands/cluster-slot-stats/).

BetterDB is a full monitoring and observability application that provides real-time dashboards, anomaly detection, and operational intelligence for your Valkey deployment, not only a metrics-to-Prometheus bridge.

### What metrics does BetterDB cover

It exposes its own metrics at `GET /prometheus/metrics` in the standard text/plain format and standard Node.js process metrics from `prom-client`. It covers the following:

- **Core Valkey performance**: Operations processed per second, memory usage, and network throughput, derived from `INFO`.
- **ACL audit metrics**: Denied ACL events, broken down by reason and by username, useful for catching misconfigured permissions or attempted unauthorized access.
- **Client connection metrics**: Current and peak connection counts, broken down by client name and by ACL user.
- **Slowlog metrics**: Metrics data such as average duration, and percentage share, grouped by query *pattern* rather than raw individual queries, which makes it much easier to spot "this class of query is the problem" instead of scrolling through a slowlog manually.
- **COMMANDLOG metrics (Valkey 8.1+)**: Large-request and large-reply counts, surfacing a Valkey-only capability that plain `INFO`-based tools cannot retrieve.
- **Vector Index / AI metrics**: This is for deployments running [`valkey-search`](https://valkey.io/topics/search/), a dedicated set of per-index health metrics and gauges (indexed docs, index memory, indexing failures, percent indexed).
- **Node.js process metrics**: Since the monitor itself is a Node.js application, it also exposes its own CPU, event-loop metrics, and HEAP/GC metrics, useful for keeping an eye on the monitoring tool's own health.

### Example for BetterDB

A snippet of what BetterDB exposes on its Prometheus endpoint looks like this:

```text
# Client connections
betterdb_client_connections_current{connection="172.17.0.4:6379"} 1
betterdb_client_connections_by_name{connection="172.17.0.4:6379",client_name="BetterDB-Monitor"} 1

# Memory
betterdb_memory_used_bytes{connection="172.17.0.4:6379"} 1281040
betterdb_memory_fragmentation_ratio{connection="172.17.0.4:6379"} 10.35

# Throughput
betterdb_commands_processed_total{connection="172.17.0.4:6379"} 319
betterdb_instantaneous_ops_per_sec{connection="172.17.0.4:6379"} 0

# Anomaly detection (this is BetterDB's differentiator)
betterdb_anomaly_events_total{connection="172.17.0.4:6379",severity="warning",metric_type="fragmentation_ratio",anomaly_type="spike"} 1
betterdb_correlated_groups_total{connection="172.17.0.4:6379",pattern="memory_pressure",severity="warning"} 1
```

You can get it to run using this one-liner with Docker or `npx`:

```bash
docker run -d --name betterdb -p 3001:3001 -e DB_HOST=your-valkey-host-ip -e DB_PORT=6379 betterdb/monitor
```

Then point Prometheus at `http://<host>:3001/prometheus/metrics`, and open `http://<host>:3001` for your built-in dashboard.

### redis_exporter (Valkey-compatible)

[redis_exporter](https://github.com/oliver006/redis_exporter) is a long-standing, community-standard Prometheus exporter for Valkey metrics. It supports Valkey 7.x, 8.x, and 9.x.

However, redis_exporter has no UI of its own. It's a single-purpose exporter: you connect to the datastore, pull data, republish it in the Prometheus format, and export it. You can use this to feed Grafana dashboards and Prometheus alerting rules instead of an actual dashboard.

### What metrics does redis_exporter cover

Most items from Valkey's `INFO` command are exported directly:

- **Memory**: Used memory, RSS, fragmentation ratio, `maxmemory`, and (through `redis_memory_max_bytes`) the configured memory ceiling.
- **Throughput and commands**: Total commands processed, ops/sec, commandstats (with `--include-config-metrics` and related flags), and latency histograms.
- **Keyspace**: Per-database total key counts, expiring key counts, and average key TTL.
- **Clients and connections**: Connected clients, blocked clients, rejected connections and optionally a full client list breakdown with `--export-client-list`.
- **Replication**: Role (primary/replica), connected replicas, replication offset and lag.
- **Persistence**: RDB save status, AOF status, last save time and duration.
- **Keyspace hits/misses**: The raw data needed for a cache hit-ratio panel.
- **Cluster support**: With `--is-cluster`, it can discover and scrape every node in a Valkey Cluster using the `/discover-cluster-nodes` endpoint in the Prometheus configuration.
- **Custom and key-level metrics**: Using `--check-keys`, `--check-single-keys`, and `--check-key-groups`, you can export the size or length of specific keys or key patterns (handy for tracking the size of a specific queue or sorted set), and even aggregate memory usage by key-naming convention using Lua scripts run on the server-side.

**Example**

Running the exporter and hitting `/metrics` gives you plain Prometheus text output like this:

```text
# Server status
redis_up 1
redis_instance_info{valkey_version="9.1.1",role="master",...} 1

# Memory
redis_memory_used_bytes 1.30248e+06
redis_mem_fragmentation_ratio 10.22

# Throughput
redis_commands_processed_total 11823
redis_net_input_bytes_total 237055

# Keyspace
redis_db_keys{db="db0"} 0
redis_keyspace_misses_total 367

# Exporter self-metrics
redis_exporter_scrapes_total 1
redis_exporter_last_scrape_error{err=""} 0
```

This is an example of a minimal Prometheus scrape configuration for it:

```yaml
scrape_configs:
  - job_name: redis_exporter
    static_configs:
      - targets: ['redis-exporter:9121']
```

## Pros and cons

BetterDB and redis_exporter operate at different layers of the monitoring stack. While BetterDB is an integrated monitoring application that collects, stores, analyzes, and presents Valkey data, redis_exporter focuses on exposing Valkey metrics to Prometheus so you can build your own dashboards and alerts around them. The comparison below focuses on what each tool provides rather than treating the absence of a built-in UI or analysis feature as a lack of underlying metrics.

| | BetterDB | redis_exporter |
|---|---|---|
| **What it is** | Full monitoring application including dashboard, a Prometheus endpoint, an audit trail and anomaly detection | Single-purpose Prometheus exporter with no UI |
| **Setup** | One Docker container or `npx @betterdb/monitor`; configurable storage backend | One Docker container; typically paired with your own Grafana dashboards |
| **Valkey-specific features** | The `COMMANDLOG`, `CLUSTER SLOT-STATS` | Exposes many Valkey metrics through INFO and dedicated collectors, including `COMMANDLOG`; does not provide BetterDB's higher-level analysis of those features |
| **Vector/AI search visibility** | Dedicated tab and metrics for `valkey-search` | Optional, using the `--include-search-indexes-metrics` flag, less purpose-built |
| **Slowlog analysis** | Grouped by query pattern, with duration and percentage breakdowns | Exported by default but no detailed slowlog entry analysis |
| **Maturity / ecosystem** | Newer project, smaller community, actively evolving | Long-established (originally for Redis), ~3.6k GitHub stars, huge base of existing Grafana dashboards and alerting "mixins" |
| **Cluster support** | Supported, with docs specifically for cluster setup | Built-in cluster node discovery via `--is-cluster` and `/discover-cluster-nodes` |
| **Extensibility for custom app metrics** | Not really the point of the tool | Strong with Lua scripting (`--script`), custom key/key-group tracking |
| **Overhead** | Runs its own Node.js process and storage backend; larger footprint than a pure exporter | Lightweight single Go binary; designed for low-overhead metrics collection |
| **Licensing model** | MIT-licensed core with additional proprietary/source-available features | Fully open-source (MIT), community-maintained, no commercial layer |
| **Best fit** | Teams that want a ready-made dashboard, audit trail, and Valkey-native visibility without assembling Grafana dashboards themselves | Teams that already run Grafana, Prometheus, Alertmanager and want a proven, low-overhead metrics source to plug into that existing stack |

These are not mutually exclusive and it is common to run redis_exporter feeding your existing Grafana and Alertmanager stack for the operational baseline (memory, ops/sec, replication, keyspace), and add BetterDB when you specifically want slowlog pattern analysis, ACL audit visibility, or vector-search monitoring that plain `INFO` scraping does not provide.

## Running everything locally

Here is a docker compose setup that spins up Valkey, redis_exporter, Prometheus, and Grafana together, so you can see metrics flowing end-to-end on your laptop.

Create a project directory with these files:

1. Create the **`compose.yml`** file:

  ```yaml

  services:
    valkey:
      image: valkey/valkey:8-alpine
      container_name: valkey
      ports:
        - "6379:6379"
      command: ["valkey-server", "--save", "", "--enable-debug-command", "yes"]

    redis_exporter:
      image: oliver006/redis_exporter:latest
      container_name: redis_exporter
      environment:
        - REDIS_ADDR=redis://valkey:6379
      ports:
        - "9121:9121"
      depends_on:
        - valkey

    prometheus:
      image: prom/prometheus:latest
      container_name: prometheus
      volumes:
        - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      ports:
        - "9090:9090"
      depends_on:
        - redis_exporter

    grafana:
      image: grafana/grafana:latest
      container_name: grafana
      ports:
        - "3000:3000"
      environment:
        - GF_SECURITY_ADMIN_PASSWORD=admin
      depends_on:
        - prometheus
  ```

2. Create the **`prometheus.yml`** file:

  ```text
  global:
    scrape_interval: 15s

  scrape_configs:
    - job_name: redis_exporter
      static_configs:
        - targets: ['redis_exporter:9121']
  ```

3. Bring the whole setup up:

  ```bash
  docker compose up -d
  ```

For the above examples:

- **Valkey** is reachable on `localhost:6379`
- The link to **redis_exporter metrics** is: `http://localhost:9121/metrics`
- You can access the **Prometheus UI** at: `http://localhost:9090` (try the query `redis_connected_clients` or `rate(redis_commands_processed_total[1m])`)
- You can access **Grafana** at: `http://localhost:3000` (login `admin` / `admin`), then add Prometheus (`http://prometheus:9090`) as a data source and import the [community redis_exporter dashboard](https://grafana.com/grafana/dashboards/763-redis-dashboard-for-prometheus-redis-exporter-1-x/) (ID `763`) for an instant, pre-built view.

If you want to add BetterDB to the same stack instead of, or alongside, redis_exporter then add this service and point Prometheus at it too:

  ```yaml
    betterdb:
      image: betterdb/monitor
      container_name: betterdb
      environment:
        - DB_HOST=valkey
        - DB_PORT=6379
        - STORAGE_TYPE=memory
      ports:
        - "3001:3001"
      depends_on:
        - valkey
  ```

  ```yaml
    # add to prometheus.yml scrape_configs:
    - job_name: betterdb
      static_configs:
        - targets: ['betterdb:3001']
      metrics_path: /prometheus/metrics
  ```

Then open `http://localhost:3001` to access BetterDB's own dashboard, in addition to querying its metrics from Prometheus and Grafana.

You can also generate some traffic to see the dashboards move:

  ```shell
  docker exec -it valkey valkey-cli --no-raw
  > SET foo bar
  > GET foo
  > DEBUG SLEEP 0.1
  ```

Or, for a sustained load, run `valkey-benchmark` from inside the container:

  ```shell
  docker exec -it valkey valkey-benchmark -q -n 100000
  ```

The above is a complete, disposable local loop with Valkey, an exporter, Prometheus scraping it, and Grafana visualizing it. This is a hypothetical mirror of what you'd run in production, just without the TLS, ACLs, and persistence you'd want to layer on before shipping it anywhere real.

Monitoring is one of the easiest ways to improve the reliability of your Valkey deployment. Whether you choose a lightweight exporter such as redis_exporter or a more feature-rich platform like BetterDB, exposing metrics to Prometheus lets you detect memory pressure, replication issues, and performance regressions before they affect your applications and architecture.

Start by deploying the local Docker Compose stack from this guide, explore the available metrics, then adapt the configuration for your own environment by adding authentication, TLS, alerting rules, and dashboards.Historical Valkey metrics collected by Prometheus make troubleshooting and capacity planning far easier than relying on isolated `INFO` snapshots.
