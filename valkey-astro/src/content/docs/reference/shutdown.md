---
title: "SHUTDOWN"
description: "SHUTDOWN command reference documentation"
---

The command behavior is the following:

* If there are any replicas lagging behind in replication:
  * Pause clients attempting to write by performing a [`CLIENT PAUSE`](client-pause.md) with the `WRITE` option.
  * Wait up to the configured `shutdown-timeout` (default 10 seconds) for replicas to catch up the replication offset.
* Stop all the clients.
* Perform a blocking SAVE if at least one **save point** is configured.
* Flush the Append Only File if AOF is enabled.
* Quit the server.

If persistence is enabled this commands makes sure that Valkey is switched off
without any data loss.

Note: A Valkey instance that is configured for not persisting on disk (no AOF
configured, nor "save" directive) will not dump the RDB file on `SHUTDOWN`, as
usually you don't want Valkey instances used only for caching to block on when
shutting down.

Also note: If Valkey receives one of the signals `SIGTERM` and `SIGINT`, the same shutdown sequence is performed.
See also [Signal Handling](../topics/signals.md).

## Modifiers

It is possible to specify optional modifiers to alter the behavior of the command.
Specifically:

* **SAVE** will force a DB saving operation even if no save points are configured.
* **NOSAVE** will prevent a DB saving operation even if one or more save points are configured.
* **NOW** skips waiting for lagging replicas, i.e. it bypasses the first step in the shutdown sequence.
* **FORCE** ignores any errors that would normally prevent the server from exiting.
  For details, see the following section.
* **SAFE** will return an error if it is unsafe to shut down.
  For details, see the following section.
* **FAILOVER** will trigger a failover before shutting down a primary node in a cluster.
* **ABORT** cancels an ongoing shutdown and cannot be combined with other flags.

## Conditions where a SHUTDOWN fails

When a save point is configured or the `SAVE` modifier is specified, the shutdown may fail if the RDB file can't be saved.
Then, the server continues to run in order to ensure no data loss.
This may be bypassed using the `FORCE` modifier, causing the server to exit anyway.

When the Append Only File is enabled the shutdown may fail because the
system is in a state that does not allow to safely immediately persist
on disk.

Normally if there is an AOF child process performing an AOF rewrite, Valkey
will simply kill it and exit.
However, there are situations where it is unsafe to do so and, unless the `FORCE` modifier is specified, the `SHUTDOWN` command will be refused with an error instead.
This happens in the following situations:

* The user just turned on AOF, and the server triggered the first AOF rewrite in order to create the initial AOF file. In this context, stopping will result in losing the dataset at all: once restarted, the server will potentially have AOF enabled without having any AOF file at all.
* A replica with AOF enabled, reconnected with its primary, performed a full resynchronization, and restarted the AOF file, triggering the initial AOF creation process. In this case not completing the AOF rewrite is dangerous because the latest dataset received from the primary would be lost. The new primary can actually be even a different instance (if the [`REPLICAOF`](replicaof.md) or [`SLAVEOF`](slaveof.md) command was used in order to reconfigure the replica), so it is important to finish the AOF rewrite and start with the correct data set representing the data set in memory when the server was terminated.

When the **SAFE** modifier is specified, the shutdown may fail if the Valkey instance is in an unsafe situation.
Unless the **FORCE** modifier is specified, the **SHUTDOWN** command will be refused with an error instead.
This happens in the following situations:

* In cluster mode, if the instance is a primary node and is responsible for at least one slot, shutting down such a node will cause the cluster to fail, so **SAFE** will refuse to shut down.

There are situations when we want just to terminate a Valkey instance ASAP, regardless of what its content is.
In such a case, the command `SHUTDOWN NOW NOSAVE FORCE` can be used.
In versions before 7.0, where the `NOW` and `FORCE` flags are not available, the right combination of commands is to send a [`CONFIG appendonly no`](config.md) followed by a `SHUTDOWN NOSAVE`.
The first command will turn off the AOF if needed, and will terminate the AOF rewriting child if there is one active.
The second command will not have any problem to execute since the AOF is no longer enabled.

## Minimize the risk of data loss

The server waits for lagging replicas up to a configurable `shutdown-timeout`, by default 10 seconds, before shutting down.
This provides a best effort minimizing the risk of data loss in a situation where no save points are configured and AOF is disabled.
Before version 7.0, shutting down a heavily loaded primary node in a diskless setup was more likely to result in data loss.
To minimize the risk of data loss in such setups, it's advised to trigger a manual [`FAILOVER`](failover.md) (or [`CLUSTER FAILOVER`](cluster-failover.md)) to demote the primary to a replica and promote one of the replicas to be the new primary, before shutting down a primary node.
