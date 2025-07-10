+++
title = "Using k0rdent MultiClusterService Template for Valkey on Kubernetes"
description = "Learn how to deploy and manage Valkey across multiple Kubernetes clusters using k0rdent's template-driven approach for simplified multi-cluster application delivery."
date = "2025-07-21 01:01:42"
authors= [ "s3rj1k"]
+++

## Introduction

Managing distributed applications across multiple Kubernetes clusters can be complex and time-consuming. This guide demonstrates how to streamline Valkey deployment using k0rdent's MultiClusterService template, providing a practical example of modern multi-cluster application delivery.

In this tutorial, we'll walk through deploying Valkey (a high-performance Redis alternative) across Kubernetes clusters using k0rdent's template-driven approach. By the end of this guide, the reader will understand how to leverage k0rdent for simplified Valkey deployment and multi-cluster application management.

## Prerequisites

It is assumed that the reader has basic knowledge of:
- Valkey and its use cases
- Kubernetes clusters and core concepts
- Helm charts and package management

The reader will also need the following tools installed:
- Docker (running as a daemon)
- kind CLI
- kubectl CLI
- helm CLI

## The k0* Family

k0rdent is part of the k0* family of tools:
- **[k0s](https://k0sproject.io/)**: Zero Friction Kubernetes Distribution
- **[k0smotron](https://k0smotron.io/)**: k0s specific CAPI providers
- **[k0rdent](https://k0rdent.io/)**: Multi-cluster management platform

## What is k0rdent?

[k0rdent](https://k0rdent.io/) is a Kubernetes-native distributed container management platform that simplifies and automates the deployment, scaling, and lifecycle management of Kubernetes clusters across multi-cloud and hybrid environments using a template-driven approach. The reader can think of it as a super control plane for multiple child clusters that are controlled by different CAPI providers across multi-cloud environments.

All providers (infrastructure, cluster) are packaged as Helm templates and exposed to the consumer via an entry point object called ClusterDeployment. The ClusterDeployment object is what the consumer uses to declaratively define a new child cluster and combined with credentials-related objects, this provides the consumer with a managed Kubernetes cluster on any platform that has existing CAPI providers.

Check out this [CNCF blog post](https://www.cncf.io/blog/2025/02/24/introducing-k0rdent-design-deploy-and-manage-kubernetes-based-idps/) for additional information.

## Service Templates and Application Delivery

For any child cluster under k0rdent management, the consumer can control application delivery via service template objects, meaning that it is possible to install applications into the child clusters and have everything controlled from the super-control-plane (management cluster) where k0rdent itself runs.

The k0rdent project maintains a public repository called the "[Catalog](https://catalog.k0rdent.io/latest/)" where the consumer can find pre-built application service templates. While templates can be created locally, and there is no hard requirement to use the catalog, we'll use the catalog for a more streamlined experience with Valkey delivery to child clusters.

## Demo Setup Overview

In this practical demonstration, we'll:

1. Use KinD for the management cluster
2. Deploy to a child cluster using Cluster API Provider Docker (CAPD)
3. Use Hyperspike's Valkey Operator to manage Valkey instances

**Note:** While we use Docker/KinD for simplicity, k0rdent supports any CAPI provider and can run on any Kubernetes distribution for production deployments.

There is no better way of getting to know something than by doing it, so I encourage the reader to follow along the steps if possible.

## Setting Up the Management Cluster

Let's start by creating a new KinD cluster with a mounted docker socket:

```bash
cat << 'EOF' | kind create cluster --name kind --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
  - hostPath: /var/run/docker.sock
    containerPath: /var/run/docker.sock
    readOnly: false
EOF
```

After KinD CLI is finished with its magic, let's install k0rdent into our new cluster:

```bash
helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm --version 1.0.0 -n kcm-system --create-namespace
kubectl wait --for=condition=Ready=True management/kcm --timeout=9000s
```

## Installing the Valkey Service Template

Now we need to install the Valkey service template like this:

```bash
helm install valkey oci://ghcr.io/k0rdent/catalog/charts/valkey-service-template --version 0.1.0 -n kcm-system
kubectl wait --for=jsonpath='{.status.valid}'=true servicetemplate/valkey-0-1-0 -n kcm-system --timeout=600s
```

## Setting Up Credentials

Let's now create a group of credentials-related objects that enable the CAPD provider to work:

```bash
kubectl apply -f - <<EOF
---
apiVersion: v1
kind: Secret
metadata:
  name: docker-cluster-secret
  namespace: kcm-system
  labels:
    k0rdent.mirantis.com/component: "kcm"
type: Opaque

---
apiVersion: k0rdent.mirantis.com/v1beta1
kind: Credential
metadata:
  name: docker-stub-credential
  namespace: kcm-system
spec:
  description: Docker Credentials
  identityRef:
    apiVersion: v1
    kind: Secret
    name: docker-cluster-secret
    namespace: kcm-system

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: docker-cluster-credential-resource-template
  namespace: kcm-system
  labels:
    k0rdent.mirantis.com/component: "kcm"
  annotations:
    projectsveltos.io/template: "true"
EOF
```

## Creating the Child Cluster

Now we are finally ready to create our new child cluster!

Let's do that like this:

```bash
kubectl apply -f - <<EOF
---
apiVersion: k0rdent.mirantis.com/v1beta1
kind: ClusterDeployment
metadata:
  name: docker-hosted-cp
  namespace: kcm-system
spec:
  template: docker-hosted-cp-1-0-0
  credential: docker-stub-credential
  config:
    clusterLabels: {}
    clusterAnnotations: {}
EOF
```

Note how we use `docker-hosted-cp-1-0-0` as the template for the new child cluster, this will give us a CAPD-based child cluster in [Hosted Control-Plane](https://docs.k0rdent.io/head/admin/hosted-control-plane/) mode.

Now we wait for the child cluster to be Ready:

```bash
kubectl wait --for=condition=Ready clusterdeployment/docker-hosted-cp -n kcm-system --timeout=600s
kubectl wait --for=jsonpath='{.status.phase}'=Provisioned cluster/docker-hosted-cp -n kcm-system --timeout=600s
kubectl wait --for=condition=Ready dockercluster/docker-hosted-cp -n kcm-system --timeout=600s
kubectl wait --for=jsonpath='{.status.ready}'=true k0smotroncontrolplane/docker-hosted-cp-cp -n kcm-system --timeout=600s
```

## Verifying the Child Cluster

Let's get the child cluster kubeconfig out and check if the cluster itself looks good:

```bash
kubectl -n kcm-system get secret docker-hosted-cp-kubeconfig -o jsonpath='{.data.value}' | base64 -d > docker-hosted-cp.kubeconfig
KUBECONFIG="docker-hosted-cp.kubeconfig" kubectl get pods -A
```

Now we have almost everything setup for actual Valkey application delivery, we need to setup the storage provider inside our child cluster, let's use `local-path-provisioner` for simplicity:

```bash
KUBECONFIG="docker-hosted-cp.kubeconfig" kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.31/deploy/local-path-storage.yaml
KUBECONFIG="docker-hosted-cp.kubeconfig" kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

**Note:** We should wait until all Pods in the child cluster are Ready, let's do that interactively, feel free to exit when pods are Ready:

```bash
watch KUBECONFIG="docker-hosted-cp.kubeconfig" kubectl get pods -A
```

## Deploying Valkey Using MultiClusterService

Whew, that was a lot of YAML, but we are finally here, we now can see how easy it is to deploy Valkey into the child cluster!

Let's first add a label to our new child cluster in the management cluster, where k0rdent is running, this label will be "group=demo":

```bash
kubectl label cluster docker-hosted-cp group=demo -n kcm-system
```

This label is needed because we will be using a MultiClusterService object that can reference multiple child clusters for service/application delivery. In our case, we will use our Docker-based cluster, still, we should keep in mind that we are not restricted as to which cluster we deliver new services, it can be a single child cluster or a group of them.

Ok, let's do this!

```bash
kubectl apply -f - <<EOF
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: MultiClusterService
metadata:
  name: valkey
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    - template: valkey-0-1-0
      name: valkey
      namespace: valkey-system
      values: |
        valkey:
          spec:
            tls: false # when enabled, needs CertManager (and some configs) inside child-cluster
EOF
```

**Note:** In our case, 'values.valkey.spec' that are exposed inside the template are Valkey Operator Helm Chart values.

## Verifying the Deployment

Let's check the object status, we should see something similar to the example output:

```bash
kubectl get MultiClusterService -A
```

Expected output:
```
NAME     SERVICES   CLUSTERS   AGE
valkey   1/1        1/1        23s
```

Now let's check how things look like inside the child cluster:

```bash
KUBECONFIG="docker-hosted-cp.kubeconfig" kubectl get pods -A
```

Expected output:
```
NAMESPACE              NAME                                                READY   STATUS    RESTARTS   AGE
kube-system            coredns-5555f45c94-bf9mb                            1/1     Running   0          23m
kube-system            konnectivity-agent-tfsr8                            1/1     Running   0          21m
kube-system            kube-proxy-thx5h                                    1/1     Running   0          21m
kube-system            kube-router-6b7s8                                   1/1     Running   0          21m
kube-system            metrics-server-7778865875-s9hsz                     1/1     Running   0          23m
local-path-storage     local-path-provisioner-74f9666bc9-5xqlf             1/1     Running   0          16m
projectsveltos         sveltos-agent-manager-79df48c686-8l6dk              1/1     Running   0          23m
valkey-system          valkey-0                                            1/1     Running   0          64s
valkey-system          valkey-operator-controller-manager-6dc5d6bf57-rbt9x 1/1     Running   0          78s
```

See how application delivery is made very simple by k0rdent, pure magic!

## Conclusion

Feel free to play around with Valkey Operator by leveraging the MultiClusterService object together with additional Helm Chart values and when finished, cleaning up this environment is as simple as deleting the KinD cluster.

This is all for today dear reader, thanks for spending this time with me!
