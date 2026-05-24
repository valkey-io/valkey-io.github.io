---
title: "SYNC"
description: "SYNC command reference documentation"
---

Initiates a replication stream from the primary.

The `SYNC` command is called by Valkey replicas for initiating a replication
stream from the primary. It has been replaced in newer versions of Valkey by
 [`PSYNC`](psync.md).

For more information about replication in Valkey please check the
[replication page][tr].

[tr]: ../topics/replication.md
