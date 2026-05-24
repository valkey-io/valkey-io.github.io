---
title: "PUBSUB NUMSUB"
description: "PUBSUB NUMSUB command reference documentation"
---

Returns the number of subscribers (exclusive of clients subscribed to patterns) for the specified channels.

Note that it is valid to call this command without channels. In this case it will just return an empty list.

Cluster note: in a Valkey Cluster clients can subscribe to every node, and can also publish to every other node. The cluster will make sure that published messages are forwarded as needed. That said, the replies from [`PUBSUB`](pubsub.md) in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.
