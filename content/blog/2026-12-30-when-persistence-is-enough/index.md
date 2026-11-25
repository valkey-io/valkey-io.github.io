+++
title = "When persistence is enough in Valkey"
description = "By default, Valkey acknowledges a write as soon as it is in memory. Learn which failures each persistence and replication setting protects you from, and how to pick the combination your workload needs."
date = 2026-01-15
authors = ["dragosandriciuc"]
draft = false

[taxonomies]
blog_type = ["How-to"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-08.webp"
+++

Imagine you run Valkey for a video game company.
One player decides to buy a sword, the game server gets an OK from Valkey, and a second later the Valkey server crashes due to an unexpected issue.
Is the sword still in the player's inventory?

The answer to this question depends on which persistence and replication settings you run.
Each setting you make in Valkey covers a different failure, and no single setting covers them all.
By the end of this post, you can match each setting to the failure it covers and pick a combination that best fits your data.

The examples use Valkey 9.2.0 on a single node.
Later sections add replicas.

## What does persistence actually do?

In Valkey, your whole dataset is kept in memory, but the contents of that are lost when the process stops.
This is where persistence comes in: it writes your dataset to disk, so Valkey can load it back on the next start.

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

In the above example, AOF is off with `appendonly` replying with `no`.
RDB is on, with three save points.
What happens is that Valkey writes a snapshot after `3600` seconds if at least `1` change was made, after `300` seconds if at least `100` changes were made, or after `60` seconds if at least `10000` changes were made.

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

Because the change was not saved in any snapshot, since no save point was reached, the sword in the player's inventory is now gone.

A clean stop however is different.
When Valkey receives the `SIGTERM` [signal](https://valkey.io/topics/signals/), the signal a service manager sends to stop a process, or a [`SHUTDOWN`](https://valkey.io/commands/shutdown/) command, and save points are configured, it writes a final snapshot before it exits.
If that snapshot fails, Valkey logs an error and keeps running instead of exiting.
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
Valkey normally writes each change to the AOF file before it sends the reply back.
At that point the data sits in the operating system's page cache, which survives Valkey's process dying.

You can see where the write went.
With AOF on, Valkey keeps its files in the `appendonlydir` directory, inside the directory set by `dir`:

```shell
ls appendonlydir
tail -n 8 appendonlydir/appendonly.aof.1.incr.aof
```

```text
appendonly.aof.1.base.rdb  appendonly.aof.1.incr.aof  appendonly.aof.manifest
$4
HSET
$19
player:42:inventory
$5
sword
$1
1
```

Where:

- `appendonly.aof.1.base.rdb` is the starting point, a snapshot in RDB format.
- `appendonly.aof.1.incr.aof` holds every write since then, in [RESP](https://valkey.io/topics/protocol/), the same format clients use to send commands.
- `appendonly.aof.manifest` tells Valkey which files to load on startup, and in which order.

The last lines of the incremental file are the `HSET` that bought the sword.

That covers a crash of the Valkey process.
However, if the whole machine loses power then the page cache is lost too, and the question is whether the operating system had already flushed that data to the disk.
That is what the `appendfsync` setting controls, described in the following section.

<!--To add: what happens when power loss/appendfsync (testing on vm). What 'always' costs the user if on, 
and a final "do you need persistence" where I combine every command so the reader can choose themselves
+ CTA to try the above themselves -->

