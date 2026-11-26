+++
title = "When persistence is enough in Valkey"
description = "By default, Valkey acknowledges a write as soon as it is in memory. Learn which failures each persistence and replication setting protects you from, and how to pick the combination your workload needs."
date = 2027-01-15
authors = ["dragosandriciuc"]
draft = false

[taxonomies]
blog_type = ["How-to"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-04.webp"
+++

Imagine you run Valkey for a video game company.
One player decides to buy a sword, the game server gets an OK from Valkey, and a second later the Valkey server crashes.
Is the sword still in the player's inventory?

The answer to this question depends on which persistence and replication settings you run.
Each setting you make in Valkey covers a different failure, and no single setting covers them all.
By the end of this post, you can match each setting to the failure it covers and pick a combination that best fits your data.

Before you change any setting, ask one question about each kind of data you keep in Valkey: if Valkey lost it, could you rebuild it?
The sections below show which failures each setting protects against, and the last section turns your answer into settings.

The examples use Valkey 9.2.0 on a single node.
Later sections add replicas.

## What does persistence actually do?

Valkey keeps your whole dataset in memory, and it loses all of it when the process stops.
Persistence writes your dataset to disk, so Valkey can load it back on the next start.

It does this in two ways, both described in the [persistence documentation](https://valkey.io/topics/persistence/).

- RDB takes a point-in-time snapshot of the whole dataset and writes it to a single file.
- AOF (append-only file) logs every write command, and Valkey replays the log when it starts.

You can run either one, both, or neither.

## What OK means with Valkey's default settings

Let's take a look at how persistence works using Valkey's default settings.
Run the following steps on a test machine with no other Valkey server running, because they kill the server process.
[Start a server](https://valkey.io/topics/installation/) with no configuration file and check the two settings that control persistence with [`CONFIG GET`](https://valkey.io/commands/config-get/):

```shell
valkey-server --daemonize yes --logfile v.log
valkey-cli CONFIG GET save appendonly
```

```text
1) "appendonly"
2) "no"
3) "save"
4) "3600 1 300 100 60 10000"
```

AOF is off, because `appendonly` is `no`.
RDB is on, with three save points.
Valkey writes a snapshot after `3600` seconds if at least `1` change happened, after `300` seconds if at least `100` changes happened, or after `60` seconds if at least `10000` changes happened.

The [official container image](https://hub.docker.com/r/valkey/valkey) for 9.2.0 reports the same values.
Linux packages ship a configuration file that can change them, so check your own server with the same command.
If you run the container image, mount a volume at `/data`.
Without one, the snapshot stays in the container's own storage: it survives `docker restart`, but it is gone once you remove the container.

Now let's buy the sword with the [`HSET`](https://valkey.io/commands/hset/) command and verify what reached the disk with the [`INFO`](https://valkey.io/commands/info/) command:

```shell
valkey-cli HSET player:42:inventory sword 1
valkey-cli INFO persistence | grep -E "^(rdb_changes_since_last_save|aof_enabled)"
```

```text
(integer) 1
rdb_changes_since_last_save:1
aof_enabled:0
```

Here Valkey replied to `HSET`, but `rdb_changes_since_last_save:1` shows that the change is not in any snapshot yet.
In this case, with these defaults, OK means the write is currently in memory.

Let's now simulate a crash by killing the process, then start it again and read the inventory with [`HGETALL`](https://valkey.io/commands/hgetall/):

```shell
pkill -9 valkey-server
valkey-server --daemonize yes --logfile v.log
valkey-cli HGETALL player:42:inventory
```

```text
(empty array)
```

The server hit no save point, so Valkey never saved the change to a snapshot, and the sword in the player's inventory is now gone.

A clean stop is different though.
When Valkey receives the `SIGTERM` [signal](https://valkey.io/topics/signals/), the signal a service manager sends to stop a process, or a [`SHUTDOWN`](https://valkey.io/commands/shutdown/) command, and the configuration has save points, it writes a final snapshot before it exits.
By default, if that snapshot fails, Valkey logs an error and keeps running instead of exiting.
So with the defaults, a planned restart keeps the sword.
A crash, or the kernel killing the process when the machine runs out of memory, does not.

Valkey writes each snapshot to a temporary file, flushes it to disk, and only then renames it to `dump.rdb`.
A crash in the middle of a save leaves the previous snapshot in place.

## Turn on AOF and try again

Let's test this again with the append-only file enabled.

Stop the server, then repeat the test:

```shell
valkey-cli SHUTDOWN NOSAVE
valkey-server --daemonize yes --logfile v.log --appendonly yes
valkey-cli HSET player:42:inventory sword 1
pkill -9 valkey-server
valkey-server --daemonize yes --logfile v.log --appendonly yes
valkey-cli HGETALL player:42:inventory
```

```text
(integer) 1
1) "sword"
2) "1"
```

This time, after the `pkill` command, the sword survives.
To see why, follow the three steps a write takes to reach the disk.

1. Valkey adds the command to a buffer in its own memory.
2. Before it replies, Valkey normally writes that buffer to the AOF file, and the operating system keeps it in the page cache.
3. An `fsync` call tells the operating system to move the data from the page cache to the disk.

The page cache belongs to the operating system, not to Valkey, so it survives Valkey's process dying.
A crash of the Valkey process only loses what had not reached step 2, and the sword had.

You can see where the write went.
With AOF on, Valkey keeps its files in the `appendonlydir` directory, inside the directory set by `dir`:

```shell
ls appendonlydir
```

```text
appendonly.aof.1.base.rdb  appendonly.aof.1.incr.aof  appendonly.aof.manifest
```

Where:

- `appendonly.aof.1.base.rdb` is the starting point, a snapshot in RDB format.
- `appendonly.aof.1.incr.aof` holds every write since then, in [RESP](https://valkey.io/topics/protocol/), the same format clients use to send commands.
- `appendonly.aof.manifest` tells Valkey which files to load on startup, and in which order.

The last lines of the incremental file are the `HSET` that bought the sword:

```shell
tail -n 8 appendonlydir/appendonly.aof.1.incr.aof
```

```text
$4
HSET
$19
player:42:inventory
$5
sword
$1
1
```

That covers a crash of the Valkey process.
However, if the whole machine loses power, the page cache is lost too, so only what reached step 3 survives.
The `appendfsync` setting controls when step 3 happens, as the next section shows.

## Power loss and appendfsync

Back to the game, with AOF still on.
The player now buys a shield, the game server gets an OK, and a moment later the whole machine loses power.
Is the shield in the inventory when the server comes back?

If you run without AOF, this section does not apply, because a power loss loses everything since the last snapshot.

So what survives a power loss?
Only writes that reached step 3, the `fsync`, as long as the disk itself honors the flush.
The `appendfsync` setting decides when Valkey calls `fsync`, and whether the reply waits for it.
Check the current value:

```shell
valkey-cli CONFIG GET appendfsync
```

```text
1) "appendfsync"
2) "everysec"
```

The default here is `everysec`, and there are three values you can choose from:

| `appendfsync` | When Valkey calls `fsync` | Does the reply wait for it? | Acknowledged writes at risk on power loss |
|---|---|---|---|
| `always` | Before replying | Yes | None, Valkey flushed each one to disk before replying |
| `everysec` | In a background thread, about once per second | No | About the last second of writes, more if the disk is slow |
| `no` | Not during normal writes, the operating system flushes on its own schedule | No | Anything the operating system had not flushed yet, which the persistence documentation puts at about 30 seconds on Linux |

The table only covers power loss.
On a crash of the Valkey process alone, all three values normally keep every acknowledged write, because each one already reached the page cache in step 2.

To see what that means for a real power cut, I ran Valkey 9.2.0 with `appendfsync everysec` in a virtual machine and sent it a steady stream of `INCR` commands from outside the VM, logging every reply.
I then forcefully powered the VM off without shutting it down, three times.
After each restart, Valkey was missing 21, 10, and 0 of the writes it had acknowledged.
In one of the timed runs, the 10 lost writes covered the last 0.42 seconds before the power cut.

So, is the shield still there after the power loss?
With the `always` option, yes.
However, with the default `everysec`, it can be lost, along with the other purchases from about the last second.
If that is not acceptable for the inventory, you can use `always` to close that gap, but then every write waits for the disk, so you trade speed for durability.

## About replicas and acknowledged writes

So far, everything happened on one machine.
Suppose the game grows, and every primary gets a replica, a copy of its data on another server.
A player buys a ring, the game server gets an OK, and a moment later the primary dies and a replica takes over.
Is the ring still in the player's inventory?

Not always, because the primary replies without waiting for its replicas, and sends them the write afterwards.
If the primary dies before the replica receives the write, then once the replica takes over, the ring is gone, no matter what persistence settings were on the primary.
Three settings help with this, all described in the [replication documentation](https://valkey.io/topics/replication/):

| Setting | What it does | Its limit |
|---|---|---|
| [`WAIT`](https://valkey.io/commands/wait/) | Waits until a number of replicas confirm they received the write, and returns how many did | The write may only be in the replicas' memory, and a count lower than you asked for does not undo the write |
| [`WAITAOF`](https://valkey.io/commands/waitaof/) | Waits until the primary and a number of replicas have flushed the write to their AOF files, and returns how many did | It needs AOF turned on, and unless every node confirmed, a failover or restart can still lose the write, as the `WAITAOF` documentation notes |
| `min-replicas-to-write` | Rejects writes when fewer replicas than this number have been in contact within `min-replicas-max-lag` seconds, `10` by default | It does not confirm that a replica has the write, and a replica that went silent less than 10 seconds ago still counts |

`WAIT` and `WAITAOF` only count writes made on the same connection, so send them right after the write, from the same client.

A test with the configuration of this [six-node cluster setup](https://github.com/edithturn/valkey-setups/tree/main/valkey-cluster-docker-compose), running Valkey 9.2.0, shows the problem.
With the replica cut off, the primary acknowledged the ring and `WAIT` returned `0`.
Killing the primary then promoted a replica that did not have the ring.
With `min-replicas-to-write 1`, the primary rejected the same write with `NOREPLICAS Not enough good replicas to write.` instead.

## So do you need persistence?

Back to the question from the start: if Valkey lost your data, could you rebuild it?

- Data you can reload from another database or recompute does not need persistence, and the persistence documentation lists turning it off as an option when you use Valkey only as a cache.
- Data you can rebuild, but slowly, benefits from RDB snapshots, because Valkey restarts with the last snapshot loaded instead of an empty database.
- Data that exists only in Valkey, like the player's inventory, needs persistence, and you need to know which failures your settings need to cover.

In the game's example, a leaderboard rebuilt from match history fits the first case.
The inventory fits the last one.

You can then pick the settings by what you can afford to lose:

| What you can afford to lose | Proposed settings |
|---|---|
| Everything, because you can rebuild it | No persistence: `save ""` and `appendonly no` |
| The writes since the last snapshot, up to an hour with the default save points | RDB, the default |
| About the last second of writes after a power loss | AOF with `appendfsync everysec` |
| No acknowledged write on a single machine | AOF with `appendfsync always` |
| As few writes as possible when a replica takes over | `WAIT 1 1000` or `WAITAOF 1 1 1000` after important writes in the game server, and `min-replicas-to-write 1` on the primary |

## Try it yourself

Run `valkey-cli CONFIG GET save appendonly appendfsync` on each of your servers, and find the row in the table above that matches what you can afford to lose.
If your settings do not match that row, the [persistence documentation](https://valkey.io/topics/persistence/) shows how to change them.
Share which combination you chose, and why, in [GitHub Discussions](https://github.com/valkey-io/valkey/discussions) or the [Valkey community](https://valkey.io/community/).
