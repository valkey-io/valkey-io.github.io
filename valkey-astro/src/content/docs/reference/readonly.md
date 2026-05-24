---
title: "READONLY"
description: "READONLY command reference documentation"
---

Enables read queries for a connection to a Valkey replica node.

In cluster mode, replica nodes will redirect clients to the authoritative primary for
the hash slot involved in a given command, however clients can use replicas
in order to scale reads using the `READONLY` command.

`READONLY` tells a Valkey Cluster replica node that the client is willing to
read possibly stale data and is not interested in running write queries.

When the connection is in readonly mode, the cluster will send a redirection
to the client only if the operation involves keys not served by the replica's
primary node. This may happen because:

1. The client sent a command about hash slots never served by the primary of this replica.
2. The cluster was reconfigured (for example resharded) and the replica is no longer able to serve commands for a given hash slot.
3. Since Valkey 8.0, if a slot migration is ongoing.
   In this case the replica can return an ASK redirect or a TRYAGAIN error reply.
   In earlier versions, replicas are not aware of ongoing slot migrations.

In standalone mode, by default, clients accessing a replica node can execute read queries, (which might read stale data) without entering readonly mode.

Since Valkey 8.0, if a client in standalone mode uses the [`CLIENT CAPA redirect`](client-capa.md) command to declare its capability to handle redirections, then the replica node will send redirection messages to the client when executing both read and write commands. The client must issue the `READONLY` command to enter readonly mode before it can execute read commands.
