+++
title = "Generally Available: Valkey Helm Chart 1.0.0"
date = 2026-11-12
description = "The Valkey Helm chart 1.0.0 is generally available, with Sentinel failover, TLS, ACL authentication, and Prometheus metrics for Valkey on Kubernetes. Find out what 1.0.0 includes and how to upgrade from 0.x."
authors = ["edithpuclla", "sgissi"]

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = true
featured_image = "/assets/media/featured/valkey-helm-1-0-0.png"
+++

The [`valkey` Helm chart 1.0.0](https://github.com/valkey-io/valkey-helm/tree/main/valkey) is now generally available.
The chart deploys Valkey on Kubernetes.
Since the first commit in July 2025, the chart has been published as a series of 0.x releases, ending with 0.12.1.
The maintainers consider this the first stable release of the chart for production use.

The `valkey` chart allows you to define your configuration, topology, and resources for a standalone Valkey deployment.
The `valkey-operator` and `valkey-resources` charts in the same repository are not part of this release.

## Deployment configurations in the `valkey` Helm chart 1.0.0

Every deployment the `valkey` Helm chart runs Valkey in standalone mode: one primary holds the whole dataset.
Standalone mode is the opposite of Valkey cluster mode, which shards the dataset across multiple primaries.
The chart does not support cluster mode.

- **Single primary (default):** one Valkey pod with no replicas, behind one read-write Service.
- **Primary with replicas:** one primary and, by default, two replicas, plus a read-only Service that load-balances reads across all pods.
- **High availability with Sentinel:** the replicated setup plus three Sentinel pods, which promote a replica when the primary fails.

Both replicated configurations require persistent storage.
The chart README calls these configurations Standalone, Replicated, and Sentinel (High Availability), and the [Quick Start section](https://github.com/valkey-io/valkey-helm/tree/main/valkey#quick-start) shows the install command for each.

## Automatic failover with Sentinel in the `valkey` Helm chart 1.0.0

[Sentinel](https://valkey.io/topics/sentinel/) support is the biggest addition in 1.0.0.
In replication mode alone, pod-0 is always the primary.
If it fails, no replica takes over, and writes wait until pod-0 comes back.
Enable Sentinel, and the chart adds a Sentinel StatefulSet that watches your Valkey pods and promotes a replica when the primary stops responding.

During a rolling update or a node drain, the primary's pod asks Sentinel for a coordinated failover before it shuts down.
The primary pauses writes, waits for the replica to catch up, and then hands over.
That way, no confirmed write is lost during the switch.

Unexpected failures, like a crashed pod or a lost node, are a different story: they follow Valkey's asynchronous replication, so the most recent writes can be lost.
The [Sentinel documentation](https://valkey.io/topics/sentinel/) explains the trade-offs.

For clients that do not support Sentinel, the optional [HAProxy front-end](https://github.com/valkey-io/valkey-helm/tree/main/valkey#haproxy-front-end) gives you one endpoint that always points to the current primary.

## Production features in the `valkey` Helm chart 1.0.0

The chart also includes these production features, all disabled by default:

- **Authentication:** ACL users with passwords from a Kubernetes Secret (`auth.enabled`).
- **TLS:** encrypted connections with certificates from a Kubernetes Secret (`tls.enabled`).
- **Persistent storage:** a PersistentVolumeClaim for the Valkey data directory (`persistence.enabled`), optional for a single primary and required for the replicated configurations.
- **Prometheus metrics:** a [`redis_exporter`](https://github.com/oliver006/redis_exporter) sidecar (`metrics.enabled`), with optional ServiceMonitor, PodMonitor, and PrometheusRule resources.
- **NetworkPolicy:** a policy for the Valkey pods (`networkPolicy.enabled`); it does not cover the Sentinel or HAProxy pods.
- **PodDisruptionBudgets:** for the Valkey pods in the replicated configurations (`podDisruptionBudget.enabled`), with separate budgets for the Sentinel and HAProxy pods.

## Get started

These commands install the chart in the single-primary configuration, without authentication:

```bash
helm repo add valkey https://valkey.io/valkey-helm/
```

```bash
helm repo update
```

```bash
helm install valkey valkey/valkey --version 1.0.0
```

The chart is also published as an OCI artifact:

```bash
helm install valkey oci://ghcr.io/valkey-io/valkey-helm/valkey --version 1.0.0
```

For the Sentinel configuration with authentication, start from the example values file [`examples/ha-sentinel.yaml`](https://github.com/valkey-io/valkey-helm/blob/main/valkey/examples/ha-sentinel.yaml).
Replace its placeholder passwords with your own passwords or Kubernetes Secrets, then install:

```bash
helm install valkey valkey/valkey --version 1.0.0 -f ha-sentinel.yaml
```

When you are ready to deploy, be sure to follow the [production recommendations](https://github.com/valkey-io/valkey-helm/tree/main/valkey#before-going-to-production).

## Upgrade from the `valkey` Helm chart 0.x to 1.0.0

The `valkey` Helm chart 1.0.0 has breaking changes compared with 0.x:

- **Renamed values:** for example, `valkeyConfig` is now `extraConfig`, and a single `persistence` block replaces `dataStorage` and `replica.persistence`.
- **Valkey server 9.0 or later:** the chart 1.0.0 deploys Valkey 9.1.3 by default, so most users don't need to change anything.
  If you pinned an older Valkey server with `image.tag`, change it to a 9.x version.
  The chart requires Valkey 9.0 or later because its Sentinel configuration uses the coordinated failover option of `SENTINEL FAILOVER`, which was added in Valkey 9.0 ([valkey-io/valkey#1292](https://github.com/valkey-io/valkey/pull/1292), [Valkey Sentinel docs](https://valkey.io/topics/sentinel/)).
- **Short downtime for a single primary:** the single-primary configuration now defaults to the `Recreate` deployment strategy, so its upgrades briefly stop Valkey.

Review [UPGRADE.md](https://github.com/valkey-io/valkey-helm/blob/main/valkey/UPGRADE.md) for more.

## Open development, open community

The `valkey` Helm chart is developed in the public [`valkey-io/valkey-helm`](https://github.com/valkey-io/valkey-helm) repository, where changes are proposed and reviewed as pull requests.
Its maintainers are Mykola Voroniuk ([@mk-raven](https://github.com/mk-raven)), Silvio Gissi ([@sgissi](https://github.com/sgissi)), and Ishan Jain ([@Bloodraven21](https://github.com/Bloodraven21)).
You can join the work through:

- **GitHub:** issues, pull requests, and discussions in the [`valkey-helm`](https://github.com/valkey-io/valkey-helm) repository.
- **Slack:** the [#valkey-helm](https://valkey-oss-developer.slack.com/archives/C09JZ6N2AAV) channel in the Valkey OSS developer workspace, for questions and feedback.
- **Contributing guide:** the chart has its own [`CONTRIBUTING.md`](https://github.com/valkey-io/valkey-helm/blob/main/valkey/CONTRIBUTING.md) that explains how to propose and test changes.
- **Weekly call:** the Valkey Operator & Helm Tech Call, every Thursday at 14:00 UTC, where contributors discuss the `valkey` Helm chart and the Valkey operator. [Join the call](https://zoom-lfx.platform.linuxfoundation.org/meeting/99658320446?password=2eae4006-633e-4fed-aa93-631ab2101421).

The chart is released under the [BSD 3-Clause license](https://github.com/valkey-io/valkey-helm/blob/main/LICENSE).

## Thank you to the `valkey` Helm chart contributors

As of November 2026, more than 40 people have authored commits to the `valkey` Helm chart.
These contributions shaped 1.0.0 directly:

- Mykola Voroniuk wrote the first chart templates and has contributed the most commits since.
- Patrick Schratz added Sentinel ([#234](https://github.com/valkey-io/valkey-helm/pull/234)) and the HAProxy front-end ([#235](https://github.com/valkey-io/valkey-helm/pull/235)).
- Ishan Jain wrote the contributing guide ([#186](https://github.com/valkey-io/valkey-helm/pull/186)) and kept Valkey versions current.
- [somaz](https://github.com/somaz94) made the health probes configurable ([#217](https://github.com/valkey-io/valkey-helm/pull/217)).
- [Pierre Gindraud](https://github.com/Turgon37) improved the metrics exporter and logging. They fixed the exporter’s TLS setup ([#262](https://github.com/valkey-io/valkey-helm/pull/262)) and corrected log level ([#267](https://github.com/valkey-io/valkey-helm/pull/262)).
- [Rushabh Shah](https://github.com/Iamrushabhshahh) reviewed 1.0.0-RC1, leading to the hardened authentication ahead of 1.0 ([#277](https://github.com/valkey-io/valkey-helm/pull/277) and [#285](https://github.com/valkey-io/valkey-helm/pull/285)).
- [Joe Heyburn](https://github.com/jdheyburn), [Kyle J. Davis](https://github.com/stockholmux) and [Ishan Jain](https://github.com/Bloodraven21) organized and led the weekly Helm chart call and set the direction for each of the project’s charts. They also reviewed the 1.0 changes and gave feedback along the way.

Thank you as well to everyone who opened an issue, reviewed a pull request, or told us how the chart behaved in your environment.

## What's next

For the `valkey` chart, the next steps are:

- Rework authentication for consistency and simplify how users, passwords and ACLs are configured across Valkey and Sentinel.
- Include support for mTLS.
- Add more storage options and review the persistence requirements.

Valkey cluster mode support on Kubernetes is being developed separately, in the `valkey-operator` and `valkey-resources` charts in the same repository.

## Help improve the `valkey` Helm chart 1.0.0

The maintainers want to hear how 1.0.0 behaves in your environment.
Four kinds of feedback help the most:

- **Kubernetes distribution:** install the chart on the distribution you run, such as Amazon EKS, Google GKE, Azure AKS, OpenShift, or k3s, and report what worked and what did not.
- **Sentinel failover:** drain a node or run a rolling update on a Sentinel deployment, and report whether your application saw errors.
- **Client library:** connect your client through Sentinel or the HAProxy front-end, and report how it handled a failover.
- **Upgrade from 0.x:** upgrade a test installation from 0.x to 1.0.0, and report anything [`UPGRADE.md`](https://github.com/valkey-io/valkey-helm/blob/main/valkey/UPGRADE.md) missed.

Report results and bugs as [issues in `valkey-io/valkey-helm`](https://github.com/valkey-io/valkey-helm/issues), or ask questions in the [#valkey-helm](https://valkey-oss-developer.slack.com/archives/C09JZ6N2AAV) Slack channel.
