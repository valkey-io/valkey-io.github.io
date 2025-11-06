+++
title = "Valkey Helm: The new way to deploy Valkey on Kubernetes"
date = 2025-11-05 
description = "A guide on why the new Valkey Helm chart exists, how it helps, and how to migrate from Bitnami." 
authors =  ["maheshcherukumilli"]
[extra]
featured = true
featured_image = "/assets/media/featured/valkey-helm.webp"
+++

Bitnami is changing how it publishes and supports many container images and Helm charts (see [charts issue #35164](https://github.com/bitnami/charts/issues/35164), [charts issue #36215](https://github.com/bitnami/charts/issues/36215), and the [Bitnami Secure Images announcement](https://news.broadcom.com/app-dev/broadcom-introduces-bitnami-secure-images-for-production-ready-containerized-applications)). Some images move behind new terms, and older tags may not be available as before. If your pipelines pull Bitnami charts or images during deploys, you can see rollouts fail (`ImagePullBackOff`, auth/404), clusters drift (staging keeps old cached bits while prod can’t pull or resolves a different tag), and “invisible” upgrades when a moved tag points to a new digest. During incidents, rollbacks slow down or fail because the old image isn’t fetchable. Compliance can break, security patches can stall behind limits or paywalls, and you may face surprise licensing or mirroring costs. Net effect: slower releases, harder debugging, inconsistent environments, and higher operational and business risk.

To reduce the impact on Valkey deployments, the community created an official, project-maintained Helm chart (request: [issue #2371](https://github.com/valkey-io/valkey/issues/2371), chart: [valkey-helm](https://github.com/valkey-io/valkey-helm)). With the official chart, you can pin chart and image versions, keep `values.yaml` in code, and upgrade on your schedule without depending on vendor policy changes.

### Why a Valkey maintained chart helps

With the official chart, you run what you intend, not what a third party changes. Pin a chart release from the Valkey repo (for example `--version 0.7.7` from [https://github.com/valkey-io/valkey-helm](https://github.com/valkey-io/valkey-helm)) and lock the Valkey image tag in your `values.yaml`. Because the chart follows Valkey releases and docs, you can bump versions in a pull request, test in staging, then promote the same versions to production. If something breaks, use Helm history to roll back with `helm rollback <release> <revision>`. Keep your values in source control, often per environment (`values.staging.yaml`, `values.prod.yaml`), and you get a clean GitOps flow. For details and examples, see the [README](https://github.com/valkey-io/valkey-helm#readme).


### Essential capabilities in the Valkey Helm Chart.

This chart focuses on the basics. It gives you a clean default and a few knobs you actually need.

* **Small cache for one service.** One Valkey pod, no persistence, ClusterIP service. Fast to start. Good for stateless caches. See the install steps in the [README](https://github.com/valkey-io/valkey-helm#readme).
* **Read-heavy traffic.** One primary with two replicas. Point reads at a separate service if you prefer. Writes still go to the primary. Configure replicas in `values.yaml` and upgrade with Helm.
* **Simple durability.** Turn on PVCs. Pick a storage class your cluster supports. Back up PVCs with your platform’s snapshot tools while chart-level hooks are being designed.
* **Safe deploys.** Pin your chart version and Valkey image tag in `values.yaml`. Use `helm diff` in CI. If probes fail after an upgrade, roll back immediately with Helm.

## How to migrate from Bitnami to the Valkey Helm chart (in-place).

**This path has downtime.** Plan a short **maintenance window** and pause writers during the swap.

### 1) Find your release and namespace

```
helm list --all-namespaces# Example: NAME=valkey-prod  NAMESPACE=acme-valkey
kubectl get pods,svc,sts,pvc -n acme-valkey

```

### 1) Back up and capture current values

```
helm get values valkey-prod -n acme-valkey -o yaml > current-values.yaml# Also take an AOF/RDB or storage snapshot

```

### 2) Add the Valkey-helm repo

```
helm repo add valkey https://valkey.io/valkey-helm/
helm repo update
```

### 3) Prepare migration overrides

Match names so the new chart **reuses the same PVCs and Services**. Create `migrate-values.yaml`:

```
# Set to the names your Bitnami release created
nameOverride: "<bitnami-short-name>"      # e.g., "valkey"
fullnameOverride: "<bitnami-full-name>"   # e.g., "valkey-master"
service:
name: "<existing-service-name>"         # e.g., "valkey"
port: 6379
persistence:
enabled: true
size: "<existing-pvc-size>"             # e.g., "8Gi"
storageClass: "<existing-class-or-null>"

```

Tip: confirm with

```
kubectl get sts,svc,pvc -n acme-valkey -o wide
```

### 4) Dry run (recommended)

```
helm upgrade valkey-prod valkey/valkey \
  -n acme-valkey \
  -f current-values.yaml \
  -f migrate-values.yaml \
  --dry-run
```

### 5) Enter maintenance window (pause writes)

### 6) Perform the in-place swap

```
helm upgrade valkey-prod valkey/valkey \
  -n acme-valkey \
  -f current-values.yaml \
  -f migrate-values.yaml \
  --atomic --wait --timeout 10m
```

`--atomic` will auto-rollback if health checks fail.

### 7) Verify and reopen traffic

```
helm status valkey-prod -n acme-valkey
kubectl get pods,svc,sts,pvc -n acme-valkey
```

### Rollback (if needed)

```
helm history valkey-prod -n acme-valkey
helm rollback valkey-prod <REVISION> -n acme-valkey --wait

```

**Notes**

* PVC reuse depends on matching names; `fullnameOverride` is key.
* Keep ports and Service names the same to avoid app changes.
* Copy auth/TLS settings into the new chart before the swap.

If you run into issues use the chart repo issues at https://github.com/valkey-io/valkey-helm/issues.

## Next steps

The [issue](https://github.com/bitnami/charts/issues/36215) outlines the planned improvements for the official Valkey Helm chart, which is being actively developed in the open at the [valkey-io/valkey-helm](https://github.com/valkey-io/valkey-helm) repository.

* **Cluster mode.** Make it easy to run primaries and replicas across slots with sane defaults.
* **Security.** Expose TLS, auth, and Secrets cleanly in values, with copy-paste examples.
* **Observability.** Add a metrics toggle (Prometheus exporter and sample dashboards).
* **Backups.** Provide a simple path to schedule snapshots and store them in S3 or GCS.
* **Upgrades.** Publish notes tied to Valkey releases. Add hooks and checks so failures are obvious and quick to revert.
* **Docs.** Keep them short. Add clear examples. Link to deeper guides only when needed.

If you currently rely on Bitnami, test this chart in a dev cluster and try your normal workflows. If something is missing, open an issue at [valkey-io/valkey-helm](https://github.com/valkey-io/valkey-helm/issues). Once you try out the official Valkey helm chart please share feedback so the chart grows in the right direction.