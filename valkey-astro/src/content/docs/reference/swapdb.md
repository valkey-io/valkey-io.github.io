---
title: "SWAPDB"
description: "SWAPDB command reference documentation"
---

This command swaps two Valkey databases, so that immediately all the
clients connected to a given database will see the data of the other database, and
the other way around. 

**Note:** `SWAPDB` is **disabled in cluster mode** to prevent shard inconsistencies,
as swapping databases on one shard while leaving others unchanged could lead to
data inconsistencies.

The caller must have ACL permission to access **both** of the databases being
swapped. See [database permissions](../topics/acl.md#database-permissions).

## Examples

```
SWAPDB 0 1
```

This will swap database 0 with database 1. All the clients connected with database 0 will immediately see the new data, exactly like all the clients connected with database 1 will see the data that was formerly of database 0.