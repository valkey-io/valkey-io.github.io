---
title: "MOVE"
description: "MOVE command reference documentation"
---

Move `key` from the currently selected database (see [`SELECT`](select.md)) to the specified
destination database.
When `key` already exists in the destination database, or it does not exist in
the source database, it does nothing.
It is possible to use `MOVE` as a locking primitive because of this.

The caller must have access to the current and the destination databases. See
[database permissions](../topics/acl.md#database-permissions).
