---
title: "PUBSUB NUMPAT"
description: "PUBSUB NUMPAT command reference documentation"
---

Returns the number of unique patterns that are subscribed to by clients (that are performed using the [`PSUBSCRIBE`](psubscribe.md) command).

Note that this isn't the count of clients subscribed to patterns, but the total number of unique patterns all the clients are subscribed to.

Cluster note: in a Valkey Cluster clients can subscribe to every node, and can also publish to every other node. The cluster will make sure that published messages are forwarded as needed. That said, the replies from [`PUBSUB`](pubsub.md) in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.
