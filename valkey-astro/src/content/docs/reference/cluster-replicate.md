---
title: "CLUSTER REPLICATE"
description: "CLUSTER REPLICATE command reference documentation"
---

The command reconfigures a node as a replica of the specified primary.
If the node receiving the command is an *empty primary*, as a side effect
of the command, the node role is changed from primary to replica.

Once a node is turned into the replica of another primary node, there is no need
to inform the other cluster nodes about the change: heartbeat packets exchanged
between nodes will propagate the new configuration automatically.

A replica will always accept the command, assuming that:

1. The specified node ID exists in its nodes table.
2. The specified node ID does not identify the instance we are sending the command to.
3. The specified node ID is a primary.

If the node receiving the command is not already a replica, but is a primary,
the command will only succeed, and the node will be converted into a replica,
only if the following additional conditions are met:

1. The node is not serving any hash slots.
2. The node is empty, no keys are stored at all in the key space.

If the command succeeds the new replica will immediately try to contact its primary in order to replicate from it.
