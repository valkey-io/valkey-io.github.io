---
title: Atomic slot migration
description: Overview of atomic slot migration
---

In [Valkey Cluster](cluster-spec.md), you can use a process known as slot
migration to scale your cluster in or out. During slot migration, one or more of
the 16384 hash slots are moved from a source node to a target node. Valkey 9.0
introduced a option for migrating hash slots known as **atomic slot
migration**, which is faster, more reliable, and has less impact on client
applications than the legacy `CLUSTER SETSLOT`-based migration.

## Performing an atomic slot migration using `CLUSTER MIGRATESLOTS`

Valkey 9.0 does not get rid of the legacy slot migration option, but it does
introduce atomic slot migration as a second option. To perform an atomic slot
migration, an operator performs the following steps:

1. Send `<source>`
   `CLUSTER MIGRATESLOTS SLOTSRANGE <start-slot> <end-slot> NODE <target>`
2. Poll `<source>` for progress using `CLUSTER GETSLOTMIGRATIONS`

`CLUSTER MIGRATESLOTS` initiates a migration of the designated slot range to the
specified target node. The slot migration process is then performed
asynchronously.

For more details on `CLUSTER MIGRATESLOTS` see the
[command documentation](../commands/cluster-migrateslots.md).

## Polling atomic slot migrations

The `CLUSTER GETSLOTMIGRATIONS` command allows you to poll the status of your
migration. `CLUSTER GETSLOTMIGRATIONS` can be executed on either the source node
or the target node. In progress migrations will always be shown, and recently
completed migrations will be visible up to a configurable threshold. In the case
of a failure, the slot migration will also include a short description of the
failure to allow for retry decisions.

For more details on `CLUSTER GETSLOTMIGRATIONS` see the
[command documentation](../commands/cluster-getslotmigrations.md).

## Canceling atomic slot migrations

If you need to cancel a slot migration after the process was started, Valkey
provides the `CLUSTER CANCELSLOTMIGRATIONS` command to cancel all active atomic
slot migrations for which that node is the source node. This command can be sent
to the whole cluster to cancel all slot migrations everywhere.

For more details on `CLUSTER CANCELSLOTMIGRATIONS` see the
[command documentation](../commands/cluster-cancelslotmigrations.md).

## Behind the scenes of atomic slot migration

Atomic slot migration utilizes a completely different process than
`CLUSTER SETSLOT`-based migrations:

1. Immediately after `CLUSTER MIGRATESLOTS` is received by the source node, it
   initiates a connection to the target node and performs authentication,
   similar to how a replication link is initialized.
2. Once established, the source node uses a new internal command -
   `CLUSTER SYNCSLOTS` - to inform the target of the migration.
3. The source node then forks a child process to do a one-time snapshot of the
   slot contents. The fork iterates all hash slots and serializes their contents
   over the slot migration link. The contents are subsequently replicated to any
   replicas of the target node.
4. While the child process is doing the snapshot, the parent process tracks all
   mutations performed on the migrating hash slots.
5. Once the child process snapshot finishes, the parent process sends all
   accumulated mutations. Any new mutations received during this step are also
   sent.
6. Once the amount of in-flight mutations goes below a configured threshold, the
   parent process pauses write commands temporarily to allow final
   synchronization of the hash slots.
7. Once the target node is completely caught up, it takes over the hash slots
   and broadcasts ownership to the cluster
8. When the source node finds out about the migration, it deletes the keys in
   the hash slot and unpauses write commands. Clients will now get `MOVED`
   redirections to the target node, which now owns the hash slots. The slot
   migration is completed.

### Isolation of importing hash slots from clients

Since slot ownership is not moved until the very end of the migration, commands
targeting migrating hash slots on the target node will receive `MOVED`
redirections per the cluster specification. But there are some commands that
operate on the entire database:

1. `KEYS`/`SCAN`: These commands allow a client to list out all keys on a shard.
2. `DBSIZE`/`INFO`: These commands provide statistical information about how
   many keys are on a shard.
3. `FLUSHDB`/`FLUSHALL`: These commands allow a client to drop all data in a
   database, or on all databases, on a node.

To handle this, all importing hash slots are marked specially and hidden from
read operations on both the target primary and the target replica.

`FLUSHDB` and `FLUSHALL` present a special case where we fail the slot migration
when being executed on **both the source and target node**. It is expected that
operators would retry the migration after flushing, which should now succeed
almost instantly due to an empty database.

## Configuring atomic slot migration

Some configurations may be worth tuning based on your workload:

- `client-output-buffer-limit`: Since atomic slot migration uses the
  replication process to migrate the slots, the amount of accumulated mutations
  while snapshotting could exceed that of the configured replication output
  buffer limit. Both the hard and soft limits of the `replica` client output
  buffer should be configured large enough to accumulate the accumulated
  mutations.
- `slot-migration-max-failover-repl-bytes`: By default, atomic slot migration
  will only proceed to pausing mutations on the source node once all in-flight
  mutations have been sent to the target node. However, for workloads with
  persistently high write throughput, atomic slot migration can be configured to
  do the pause so long as all in-flight mutations are under a given threshold.
- `cluster-slot-migration-log-max-len`: atomic slot migration keeps track of all
  in progress migrations and recently completed or failed migrations. These can
  be viewed with `CLUSTER GETSLOTMIGRATIONS`. The number of recently completed
  migrations stored can be increased using this configuration.
