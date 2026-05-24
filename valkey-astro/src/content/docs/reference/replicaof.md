---
title: "REPLICAOF"
description: "REPLICAOF command reference documentation"
---

The `REPLICAOF` command can change the replication settings of a replica on the fly.

If a Valkey server is already acting as replica, the command `REPLICAOF` NO ONE will turn off the replication, turning the Valkey server into a PRIMARY.  In the proper form `REPLICAOF` hostname port will make the server a replica of another server listening at the specified hostname and port.

If a server is already a replica of some primary, `REPLICAOF` hostname port will stop the replication against the old server and start the synchronization against the new one, discarding the old dataset.

The form `REPLICAOF` NO ONE will stop replication, turning the server into a MASTER, but will not discard the replication. So, if the old primary stops working, it is possible to turn the replica into a primary and set the application to use this new primary in read/write. Later when the other Valkey server is fixed, it can be reconfigured to work as a replica.

## Examples

```
> REPLICAOF NO ONE
"OK"

> REPLICAOF 127.0.0.1 6799
"OK"
```
