---
title: "CLIENT PAUSE"
description: "CLIENT PAUSE command reference documentation"
---

`CLIENT PAUSE` is a connections control command able to suspend all the Valkey clients for the specified amount of time (in milliseconds).

The command performs the following actions:

* It stops processing all the pending commands from normal and pub/sub clients for the given mode. However interactions with replicas will continue normally. Note that clients are formally paused when they try to execute a command, so no work is taken on the server side for inactive clients.
* However it returns OK to the caller ASAP, so the `CLIENT PAUSE` command execution is not paused by itself.
* When the specified amount of time has elapsed, all the clients are unblocked: this will trigger the processing of all the commands accumulated in the query buffer of every client during the pause.

Client pause currently supports two modes:

* `ALL`: This is the default mode. All client commands are blocked.
* `WRITE`: Clients are only blocked if they attempt to execute a write command.

For the `WRITE` mode, some commands have special behavior:

* `EVAL`/`EVALSHA`: Will block client for all scripts.
* `PUBLISH`: Will block client.
* `PFCOUNT`: Will block client.
* `WAIT`/`WAITAOF`: Acknowledgments will be delayed, so these commands will appear blocked.

This command is useful as it makes able to switch clients from a Valkey instance to another one in a controlled way. For example during an instance upgrade the system administrator could do the following:

* Pause the clients using `CLIENT PAUSE`
* Wait a few seconds to make sure the replicas processed the latest replication stream from the primary.
* Turn one of the replicas into a primary.
* Reconfigure clients to connect with the new primary.

The recommended mode for client pause is `WRITE`. This mode will stop all replication traffic, can be
aborted with the [`CLIENT UNPAUSE`](client-unpause.md) command, and allows reconfiguring the old primary without risking accepting writes after the
failover. This is also the mode used during cluster failover.

This command also prevents keys to be evicted or expired during the time clients are paused.
This way the dataset is guaranteed to be static not just from the point of view of clients not being able to write,
but also from the point of view of internal operations.
