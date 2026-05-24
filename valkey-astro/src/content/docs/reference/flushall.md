---
title: "FLUSHALL"
description: "FLUSHALL command reference documentation"
---

Delete all the keys of all the existing databases, not just the currently selected one.
This command never fails.

By default, `FLUSHALL` will synchronously flush all the databases.
Setting the **lazyfree-lazy-user-flush** configuration directive to "yes" changes the default flush mode to asynchronous.

It is possible to use one of the following modifiers to dictate the flushing mode explicitly:

* `ASYNC`: flushes the databases asynchronously
* `SYNC`: flushes the databases synchronously

Note: an asynchronous `FLUSHALL` command only deletes keys that were present at the time the command was invoked. Keys created during an asynchronous flush will be unaffected.

Because `FLUSHALL` operates on every database, the caller must have ACL access
to all databases (the `alldbs` rule). See
[database permissions](../topics/acl.md#database-permissions).
