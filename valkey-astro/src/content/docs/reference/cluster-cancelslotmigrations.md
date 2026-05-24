---
title: "CLUSTER CANCELSLOTMIGRATIONS"
description: "CLUSTER CANCELSLOTMIGRATIONS command reference documentation"
---

`CLUSTER CANCELSLOTMIGRATIONS` cancels all in progress
[atomic slot migrations](../topics/atomic-slot-migration.md) initiated through
[`CLUSTER MIGRATESLOTS`](cluster-migrateslots.md).

Only slot migrations initiated on this node are cancelled. If this node is the
target of a slot migration, the cancellation must be performed on the source
node.

Because the migrations being cancelled may touch keys in any database, the
caller must have ACL access to all databases (the `alldbs` rule). See
[database permissions](../topics/acl.md#database-permissions).
