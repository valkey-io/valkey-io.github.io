+++
title = "Valkey Helm: The new way to deploy Valkey on Kubernetes"
date = 2026-01-06
description = "A guide on why the new Valkey Helm chart exists, how it helps, and how to migrate from Bitnami." 
authors =  ["sgissi","maheshcherukumilli"]
[extra]
featured = true
featured_image = "/assets/media/featured/valkey-helm.webp"
+++

Last year, Bitnami changed how it publishes and supports many container images and Helm charts (see [charts issue #35164](https://github.com/bitnami/charts/issues/35164), [charts issue #36215](https://github.com/bitnami/charts/issues/36215), and the [Bitnami Secure Images announcement](https://news.broadcom.com/app-dev/broadcom-introduces-bitnami-secure-images-for-production-ready-containerized-applications)). Some images move behind new terms, and older tags may not be available as before.

If your pipelines pull Bitnami charts or images during deploys, you may experience significant operational issues: rollouts can fail with `ImagePullBackOff` or auth/404 errors, clusters can drift when staging keeps old cached images while production can't pull or resolve a different tag, and "invisible" upgrades can occur when a moved tag points to a new digest. During incidents, rollbacks may slow down or fail entirely because the old image isn't fetchable.

To reduce the impact on Valkey deployments, the community created an official, project-maintained Helm chart (request: [issue #2371](https://github.com/valkey-io/valkey/issues/2371), chart: [valkey-helm](https://github.com/valkey-io/valkey-helm)). With the official chart, you can pin chart and image versions, keep `values.yaml` in code, and upgrade on your schedule without depending on vendor policy changes.

## Why a Valkey maintained chart helps

With the official chart, you control exactly which versions you deploy, without third-party vendor policies forcing unexpected changes. Pin a chart release from the Valkey repo (for example `--version 0.9.2` from [https://github.com/valkey-io/valkey-helm](https://github.com/valkey-io/valkey-helm)) and lock the Valkey image tag in your `values.yaml`. Because the chart follows Valkey releases and docs, you can bump versions in a pull request, test in staging, then promote the same versions to production.

## Capabilities in the Valkey Helm Chart

The official Valkey Helm chart supports the following:

* **Standalone instance** - Deploy a single Valkey instance with or without data persistence, perfect for simple caching layers and development environments.

* **Replicated read-heavy workloads** - Use a primary-replica topology with separate read and read-write endpoints, distributing read traffic across all replica instances while routing writes to the primary node.

* **ACL-based authentication** - Enable authentication using Access Control Lists for fine-grained user permissions and password-based authentication.

* **TLS encryption** - Enable TLS for encrypted client-server and replica-primary communication, protecting data in transit.

* **Metrics** - Collect Valkey metrics by enabling the Prometheus exporter.

For details on how to configure these capabilities and customize your deployment, see the [chart README](https://github.com/valkey-io/valkey-helm/tree/main/valkey).

## Migrating from Bitnami to the Official Valkey Chart

Because of differences in how the two charts structure resources, labels, and StatefulSets, you can't upgrade in-place from Bitnami. The charts use incompatible naming conventions and resource management approaches. Instead, deploy the official Valkey chart alongside your existing Bitnami installation and migrate the data. Plan for a brief maintenance window to ensure all writes are fully replicated before switching your applications to the new endpoints.

### Before You Migrate

Review the [official chart documentation](https://github.com/valkey-io/valkey-helm/tree/main/valkey) to understand configuration options and match your current Bitnami settings. Bitnami's default configuration deploys one primary with three replicas, protected by a randomly-generated password and without TLS. The migration steps below will configure the official chart the same way — adjust the chart parameters to match your current deployment.

Ensure you are using Bitnami Valkey chart version 2.0.0 or higher. That release updated service names and labels from `master` to `primary` for consistency with current terminology, and the migration steps below assumes that naming convention.

The following commands should be executed from a Bash shell. You'll need `kubectl` configured to access your Kubernetes cluster, `helm` to install the new chart, and the standard utilities `grep` and `base64`.

### Step 1: Find existing pods, services and namespace

```bash
# List all pods in all namespaces with app name 'valkey'
kubectl get pods --all-namespaces -l app.kubernetes.io/name=valkey -o custom-columns=Pod:.metadata.name,Namespace:.metadata.namespace,Instance:.metadata.labels.app\\.kubernetes\\.io\\/instance
# * Sample Output *
# Pod                                 Namespace   Instance
# valkey-bitnami-primary-0            apps-test   valkey-bitnami
# valkey-bitnami-replicas-0           apps-test   valkey-bitnami
# valkey-bitnami-replicas-1           apps-test   valkey-bitnami
# valkey-bitnami-replicas-2           apps-test   valkey-bitnami
```

Replace values below with the namespace and instance above:

```bash
export NAMESPACE="apps-test"
export INSTANCE="valkey-bitnami"
```

Save current environment details to be used for replication:

```bash
# Identify the name of the current primary service
export SVCPRIMARY=$(kubectl get service -n $NAMESPACE -l app.kubernetes.io/instance=$INSTANCE,app.kubernetes.io/name=valkey,app.kubernetes.io/component=primary -o jsonpath='{.items[0].metadata.name}')

# Fetch the default user password
export PASS=$(kubectl get secret -n apps-test -l app.kubernetes.io/name=valkey,app.kubernetes.io/instance=valkey-bitnami -o jsonpath='{.items[0].data.valkey-password}' |  base64 -d)
```

### Step 2: Deploy a new Valkey server

Choose an instance name for the new deployment. It must be different from the current instance to avoid overwriting resources.

```bash
export NEWINSTANCE="valkey"
```

Add the official Helm chart repository:

```bash
helm repo add valkey https://valkey.io/valkey-helm/
helm repo update
```

Create a `values.yaml` file that matches your current deployment, for details on the configuration options, check the chart [README](https://github.com/valkey-io/valkey-helm/tree/main/valkey) and [values.yaml](https://github.com/valkey-io/valkey-helm/blob/main/valkey/values.yaml). The script below will generate a file that matches the default Bitnami Valkey configuration:

**Note**: The example below provides the password as plain-text for simplicity. In production, store the password in a Kubernetes Secret and reference it using the `auth.usersExistingSecret` setting.

```bash
cat << EOF > values.yaml
auth:
  enabled: true
  aclUsers:
    default:
      password: "$PASS"
      permissions: "~* &* +@all"

replica:
  enabled: true
  replicas: 3
  persistence:
    size: 8Gi

valkeyConfig: |
  appendonly yes
EOF
```

Install the new Valkey instance:

```bash
helm install -n $NAMESPACE $NEWINSTANCE valkey/valkey -f values.yaml
```

Check it is running as expected:

```bash
# List new pods and ensure they are in 'Running' state
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/instance=$NEWINSTANCE
# * Sample Output *
# NAME       READY   STATUS    RESTARTS   AGE
# valkey-0   1/1     Running   0          2m33s
# valkey-1   1/1     Running   0          2m16s
# valkey-2   1/1     Running   0          2m4s
# valkey-3   1/1     Running   0          103s

# Check that server is responding to CLI commands
kubectl exec -n $NAMESPACE $NEWINSTANCE-0 -c valkey -- valkey-cli -a $PASS --no-auth-warning ping
# * Sample Output *
# PONG

# Check that the current instance is reachable from the new instance
kubectl exec -n $NAMESPACE $NEWINSTANCE-0 -c valkey -- valkey-cli -a $PASS -h $SVCPRIMARY --no-auth-warning ping
# * Sample Output *
# PONG
```

Create shell aliases to call the Valkey CLI on the new and current instances:

```bash
alias new-valkey-cli="kubectl exec -n $NAMESPACE $NEWINSTANCE-0 -c valkey -- valkey-cli -a $PASS --no-auth-warning"
alias current-valkey-cli="kubectl exec -n $NAMESPACE $NEWINSTANCE-0 -c valkey -- valkey-cli -a $PASS -h $SVCPRIMARY --no-auth-warning"
```

### Step 3: Enable replication

Replicate data from current instance and ensure it is replicating:

```bash
# Configure password to connect to existing Valkey instance
new-valkey-cli config set primaryauth $PASS
# * Sample Output *
# OK

# Configure new instance to replicate data from the current instance
new-valkey-cli replicaof $SVCPRIMARY 6379
# * Sample Output *
# OK

# Check status of replication, it should return a 'slave' role and master_link_status as 'up'
new-valkey-cli info replication | grep '^\(role\|master_host\|master_link_status\)'
# * Sample Output *
# role:slave
# master_host:valkey-bitnami-primary
# master_link_status:up
```

### Step 4: Enter maintenance window

Pause all clients connecting to the Valkey server deployed using Bitnami's chart. The failover process will pause client writes, ensure changes are replicated, and promote the new instance to primary:

```bash
# Retrieve the new instance Pod IP
export PODPRIMARY=$(kubectl get pod -n $NAMESPACE $NEWINSTANCE-0 -o jsonpath='{.status.podIP'})
# Initiate failover
current-valkey-cli failover to $PODPRIMARY 6379
# * Sample Output *
# OK

# Check that instance role is 'master'
new-valkey-cli info | grep '^role:'
# * Sample Output *
# role:master
```

### Step 5: Switch clients to new endpoints

Update all clients to use the new Valkey read-write and read-only endpoints which are exposed as services. To list the service endpoints:

```bash
echo "Read-Write (primary): $NEWINSTANCE.$NAMESPACE.svc.cluster.local"
echo "Read-only (all instances): $NEWINSTANCE-read.$NAMESPACE.svc.cluster.local"
```

## What's next for Valkey Helm?

The chart [milestones](https://github.com/valkey-io/valkey-helm/milestones) outlines the planned improvements for the official Valkey Helm chart, which is being actively developed in the open at the [valkey-io/valkey-helm](https://github.com/valkey-io/valkey-helm) repository. High-availability via Sentinel for automated failover is the next upcoming feature [#22](https://github.com/valkey-io/valkey-helm/issues/22), alongside more control over data persistence [#88](https://github.com/valkey-io/valkey-helm/issues/88), followed by Cluster support [#18](https://github.com/valkey-io/valkey-helm/issues/18).

## Get started today

If you currently rely on Bitnami, test this chart in a dev cluster and try your normal workflows. The official Valkey Helm chart provides a stable, community-maintained path forward that puts you in control of your deployment lifecycle.

If something is missing or you encounter issues, the Valkey community is here to help. Open an issue at [valkey-io/valkey-helm](https://github.com/valkey-io/valkey-helm/issues) or reach out on the [#valkey-helm](https://valkey-oss-developer.slack.com/archives/C09JZ6N2AAV) Slack channel. Your feedback helps ensure the chart grows in the right direction for the entire community.
