---
title: "SLAVEOF"
description: "SLAVEOF command reference documentation"
---

**A note about the word slave used in this man page and command name**: If not for backward compatibility, the Valkey project no longer uses the words "master" and "slave". Please use the new command `REPLICAOF`. The command `SLAVEOF` will continue to work for backward compatibility.

The `SLAVEOF` command can change the replication settings of a replica on the fly.
If a Valkey server is already acting as replica, the command `SLAVEOF` NO ONE will
turn off the replication, turning the Valkey server into a MASTER.
In the proper form `SLAVEOF` hostname port will make the server a replica of
another server listening at the specified hostname and port.

If a server is already a replica of some primary, `SLAVEOF` hostname port will stop
the replication against the old server and start the synchronization against the
new one, discarding the old dataset.

The form `SLAVEOF` NO ONE will stop replication, turning the server into a
MASTER, but will not discard the replication.
So, if the old primary stops working, it is possible to turn the replica into a
primary and set the application to use this new primary in read/write.
Later when the other Valkey server is fixed, it can be reconfigured to work as a
replica.
