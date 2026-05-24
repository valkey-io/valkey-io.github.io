---
title: "CLUSTER GETKEYSINSLOT"
description: "CLUSTER GETKEYSINSLOT command reference documentation"
---

The command returns an array of key names stored in the contacted node and
hashing to the specified hash slot in the currently selected database. 
The maximum number of keys to return is specified via the `count` argument, 
so that it is possible for the user of this API to batch-process keys.
Note that this works only when deleting keys, as the same `count` keys are
returned on each call unless removed.

The main usage of this command is during rehashing of cluster slots from one
node to another. The way the rehashing is performed is exposed in the [Valkey
Cluster specification](../topics/cluster-spec.md), or in a more simple to digest form, as an appendix
of the [`CLUSTER SETSLOT`](cluster-setslot.md) command documentation.

```
> CLUSTER GETKEYSINSLOT 7000 3
1) "key_39015"
2) "key_89793"
3) "key_92937"
```
