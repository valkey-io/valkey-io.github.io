---
title: "CLUSTER ADDSLOTSRANGE"
description: "CLUSTER ADDSLOTSRANGE command reference documentation"
---

The `CLUSTER ADDSLOTSRANGE` is similar to the [`CLUSTER ADDSLOTS`](cluster-addslots.md) command in that they both assign hash slots to nodes.

The difference between the two commands is that `CLUSTER ADDSLOTS` takes a list of slots to assign to the node, while `CLUSTER ADDSLOTSRANGE` takes a list of slot ranges (specified by start and end slots) to assign to the node.

## Example

To assign slots 1 2 3 4 5 to the node, the `CLUSTER ADDSLOTS` command is:

    > CLUSTER ADDSLOTS 1 2 3 4 5
    OK

The same operation can be completed with the following `CLUSTER ADDSLOTSRANGE` command:

    > CLUSTER ADDSLOTSRANGE 1 5
    OK


## Usage in Valkey Cluster

This command only works in cluster mode and is useful in the following Valkey Cluster operations:

1. To create a new cluster, `CLUSTER ADDSLOTSRANGE` is used to initially set up primary nodes splitting the available hash slots among them.
2. In order to fix a broken cluster where certain slots are unassigned.
