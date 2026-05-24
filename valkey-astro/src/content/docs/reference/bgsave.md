---
title: "BGSAVE"
description: "BGSAVE command reference documentation"
---

Save the DB in background.

Normally the OK code is immediately returned.
Valkey forks, the parent continues to serve the clients, the child saves the DB
on disk then exits.

An error is returned if there is already a background save running or if there
is another non-background-save process running, specifically an in-progress AOF
rewrite.

If `BGSAVE SCHEDULE` is used, the command will immediately return `OK` when an
AOF rewrite is in progress and schedule the background save to run at the next
opportunity.

If `BGSAVE CANCEL` is used, it will immediately terminate any in-progress RDB save or replication full sync process.
In case a background save is scheduled to run (e.g. using `BGSAVE SCHEDULE` command) the scheduled execution will be 
cancelled as well.

A client may be able to check if the operation succeeded using the [`LASTSAVE`](lastsave.md)
command.

Please refer to the [persistence documentation][tp] for detailed information.

[tp]: ../topics/persistence.md

