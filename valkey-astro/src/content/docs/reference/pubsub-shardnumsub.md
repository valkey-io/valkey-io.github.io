---
title: "PUBSUB SHARDNUMSUB"
description: "PUBSUB SHARDNUMSUB command reference documentation"
---

Returns the number of subscribers for the specified shard channels.

Note that it is valid to call this command without channels, in this case it will just return an empty list.

Cluster note: in a Valkey Cluster, the replies from [`PUBSUB`](pubsub.md) in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.

## Examples

```
> PUBSUB SHARDNUMSUB orders
1) "orders"
2) (integer) 1
```
