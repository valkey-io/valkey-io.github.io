---
title: "CLUSTER REPLICAS"
description: "CLUSTER REPLICAS command reference documentation"
---

The command provides a list of replica nodes replicating from the specified
primary node. The list is provided in the same format used by [`CLUSTER NODES`](cluster-nodes.md) (please refer to its documentation for the specification of the format).

The command will fail if the specified node is not known or if it is not
a primary according to the node table of the node receiving the command.

Note that if a replica is added, moved, or removed from a given primary node,
and we ask `CLUSTER REPLICAS` to a node that has not yet received the
configuration update, it may show stale information. However eventually
(in a matter of seconds if there are no network partitions) all the nodes
will agree about the set of nodes associated with a given primary.
