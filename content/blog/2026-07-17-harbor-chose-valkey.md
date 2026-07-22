+++
title = "Harbor Chose Valkey"
date = 2026-07-17 01:01:01
description = "With v2.15.2, Harbor replaced Redis with Valkey as its internal cache backend. Here is why the CNCF graduated container registry made the switch and how you can run it today."
authors = ["edithpuclla", "orlinvasilev"]
[taxonomies]
blog_type = ["Community Highlight"]
+++

With **Harbor v2.15.2**, the Harbor team replaced Redis with Valkey as its internal cache backend. This was a deliberate open source choice, and it is worth celebrating.

[Harbor](https://goharbor.io/) is a CNCF graduated open source container registry, a place where organizations can store, manage, and secure container images, Helm charts, OCI artifacts, CNAB (Cloud Native Application Bundles), and AI models via ModelPack. Among organizations that self-host their container registries for production Kubernetes, Harbor is one of the most widely adopted solutions. What you might not know is that Harbor has always depended on Redis under the hood. With v2.15.2, that changed.

The Harbor team opened [issue #22935](https://github.com/goharbor/harbor/issues/22935) in March 2026, merged [PR #23157](https://github.com/goharbor/harbor/pull/23157) on April 28, and shipped the change in [v2.15.2](https://github.com/goharbor/harbor/releases/tag/v2.15.2). The reason is simple: **open source projects should not carry license risk from their dependencies**.

## Why Harbor uses a cache

Harbor is not a simple file server. Every time someone pushes or pulls an image, Harbor is doing a lot of work simultaneously. Things like:

- **Session storage** that serves OCI manifest data without hitting the database on every pull.
- **Job queue** that manages background tasks like vulnerability scans, garbage collection, and replication jobs.
- **Quota counter** for tracking push concurrency per project.

All of this needs a fast in-memory store. That is why Redis has been part of Harbor since the beginning; it is the engine behind every interaction with the registry. Now with Valkey, Harbor keeps doing exactly the same work, with a better open source foundation underneath.

## Why Valkey?

Valkey is a fork of Redis 7.2.4 (the last fully open source Redis release). **Valkey** is an open source (BSD licensed), in-memory data structure store used as a database, cache, message broker, and streaming engine. It provides data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams.

It was created in March 2024 under the Linux Foundation, backed by a broad coalition of companies including AWS, Google Cloud, Oracle, Ericsson, Percona, Snap, Canonical, and many others, and is already packaged as the default in major Linux distributions like Fedora and Alpine.

What makes it the right choice for Harbor:

- **BSD 3-Clause license**: permissive, no legal risk, no restrictions.
- **Wire compatible**: same RESP protocol as Redis; no code changes needed in Harbor.
- **Actively maintained**: governed by the Linux Foundation with a clear release cadence.
- **Production ready**: already the recommended in-memory store on AWS ElastiCache, and Google Cloud offers it as a fully managed service through Memorystore for Valkey.
- **Performance**: 
    - Valkey has improved significantly since its 7.2 baseline, [Valkey 9.1](https://valkey.io/blog/valkey-9-1-delivers-improvements-in-security-performance-and-more/) delivers up to 2M requests per second in [official benchmarks](https://valkey.io/performance/), more than double the throughput of Valkey 7.2.
    - Multiple memory optimizations across Valkey 8.x and 9.x, including a redesigned hash table and small string optimization, can reduce memory usage by up to 38% compared to Valkey 7.2.

For Harbor, the migration was clean. Same protocol, few application code changes, and a dependency that is fully aligned with open source principles.

## Install Harbor with Valkey

Harbor v2.15.2 ships with `valkey-photon` as its internal cache image. However, the official Helm chart has not been updated yet to reflect this; it still defaults to the Redis image. To run Harbor with Valkey today, we override the internal cache image with `goharbor/valkey-photon` from Docker Hub.

First, add the Harbor Helm repo:

```bash
helm repo add harbor https://helm.goharbor.io
helm repo update
```

Then install Harbor pointing to the Valkey image:

```bash
helm install harbor harbor/harbor \
  --namespace harbor \
  --create-namespace \
  --set expose.type=nodePort \
  --set expose.tls.enabled=false \
  --set externalURL=http://localhost:30003 \
  --set harborAdminPassword="your-secure-password" \
  --set redis.internal.image.repository=goharbor/valkey-photon \
  --set redis.internal.image.tag=v2.15.2
```

The first lines are basic setup so Harbor can start and be accessible. The last two lines tell the Helm chart to use the `valkey-photon` image from Docker Hub instead of the default Redis one.

The Harbor team chose Valkey not just as a technical decision, but as a commitment to keeping Harbor fully open source. And it is a reminder that the open source ecosystem can respond quickly and effectively when a foundational dependency changes direction.

Harbor v2.15.2 is out. [Try the latest release of Harbor](https://github.com/goharbor/harbor/releases/tag/v2.15.2) today!