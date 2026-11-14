+++
title = "Valkey 9.2 offers forkless snapshots, compressed replication, ACL roles, and more"
description = "Valkey 9.2 can save snapshots without forking, compress replication traffic with LZ4 or Zstandard, and group ACL rules into reusable roles. It also adds Path Hash, a new data type for prefix lookups, and a set of conditional commands."
date = 2026-11-16
draft = true
authors = ["kyledvs", "dragosandriciuc"]

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = true
featured_image = "/assets/media/featured/valkey-release-9-2.svg"
+++

Valkey 9.2 is now out, and it does more with the same hardware you already run.
Large sorted sets use 36% to 43% less memory overhead per member, replication traffic can be compressed, and background saves and full syncs can run without forking the server.
When load spikes, Valkey 9.2 keeps cluster heartbeats and replication moving, holds connections for administrators, and slows writes before a lagging replica needs a full resync.
It also adds roles to access control, Path Hash, a new data type, a set of conditional commands and more.

Read on to find out more about these changes.

## Forkless snapshots and full syncs

Valkey 9.2 adds forkless RDB snapshots, opt-in through the `forkless-infrastructure-enabled` and `forkless-policy` configurations ([#4460](https://github.com/valkey-io/valkey/pull/4460) and [#5261](https://github.com/valkey-io/valkey/pull/5261)).
Forkless operations do their work on a background thread instead of forking, avoiding the copy-on-write memory overhead a fork can incur under write-heavy load.
Full synchronization to replicas can also run forkless, serving disk-based and diskless full syncs from a background-thread snapshot ([#4797](https://github.com/valkey-io/valkey/pull/4797)).

`forkless-infrastructure-enabled` costs 4 additional bytes per key and must be set at startup, and `prefer-forkless` falls back to fork when an operation can't run forkless.
For example, start the server with:

```text
forkless-infrastructure-enabled yes
forkless-policy prefer-forkless
```

[`BGSAVE`](https://valkey.io/commands/bgsave/) then runs forkless, and `INFO persistence` reports `rdb_last_bgsave_type:forkless`.

## Compressed replication and snapshots

The new `repl-compression` configuration adds streaming compression for steady-state replication, negotiated per replica so older or opted-out replicas keep receiving plaintext ([#3853](https://github.com/valkey-io/valkey/pull/3853)).
In the PR's benchmark of 3 million keys of about 315 bytes each, LZ4 cut replication bandwidth by 52% with less than 1% throughput overhead.

`rdbcompression` now accepts `lz4` and `zstd` for whole-stream compression of RDB files, and the default per-string LZF behavior is unchanged ([#3531](https://github.com/valkey-io/valkey/pull/3531) and [#3798](https://github.com/valkey-io/valkey/pull/3798)).
Zstandard offers better compression ratios than LZ4 and is enabled at build time with `BUILD_ZSTD=yes`.
The PR points to cross-region replication as the main use for Zstandard, where network costs are high compared to compute.

## Less memory for sorted sets and hashes

Large sorted sets are now backed by a B+ tree instead of a skiplist ([#4359](https://github.com/valkey-io/valkey/pull/4359)).
The PR reports per-member memory overhead dropping from 50.3 bytes to between 28.5 and 32.0 bytes, 36% to 43% less, for 5 million members with 20-byte elements.
Expect delete-heavy workloads to land worse than that, as the B+ tree has no compaction yet.

Small hashes with field expiration now use the listpack encoding instead of always converting to a hashtable, which uses more memory ([#3212](https://github.com/valkey-io/valkey/pull/3212)).
For example, with the hash from the PR's tests, setting an expiration on one field keeps the listpack encoding:

```text
> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
> HEXPIRE myhash 1000 FIELDS 1 f1
1) (integer) 1
> OBJECT ENCODING myhash
"listpack"
> MEMORY USAGE myhash
(integer) 80
```

On Valkey 9.1.3 with the default configuration, the same commands convert the hash to a hashtable, and [`MEMORY USAGE`](https://valkey.io/commands/memory-usage/) reports 240 bytes.

## Staying responsive under load

Cluster heartbeats, replication, and slot migration are now prioritized over heavy client traffic, tunable through the new `priority-preemptive-poll-interval-us` configuration ([#4076](https://github.com/valkey-io/valkey/pull/4076)).
Connections from the CIDR ranges listed in the new `priority-subnets` configuration are tagged as prioritized, and `maxclients-reserved` caps normal clients at `maxclients` minus that many connection slots ([#4005](https://github.com/valkey-io/valkey/pull/4005)).

The optional `repl-throttling-enabled` configuration slows client writes when a replica falls behind, avoiding disconnects and full syncs ([#4356](https://github.com/valkey-io/valkey/pull/4356)).
It is built on a new client throttling framework that uses a token bucket, and it starts deferring commands that generate replication traffic once the largest replica client output buffer reaches 25% of the configured soft limit.

## ACL roles

Roles are named, reusable sets of access control list (ACL) selectors ([#3967](https://github.com/valkey-io/valkey/pull/3967)).
They let you define a permission policy once and apply it to many users, instead of repeating the same rules for each user.
Changes to a role are visible immediately to every user that holds it, and a user can add permissions on top of a role but not restrict it.

For example, create a role that can only read keys under `app:` and assign it to a user with the `role=` rule:

```text
> ACL SETROLE readonly-app ~app:* +@read
OK
> ACL SETUSER reporting on >pass1 role=readonly-app
OK
```

With `app:1` set to `hello`, the `reporting` user can read the key but not write to it:

```text
> GET app:1
"hello"
> SET app:1 x
(error) NOPERM User reporting has no permissions to run the 'set' command
```

## Path Hash

Path Hash is a new radix-tree-backed data type with `PH*` commands for exact lookup, longest-prefix matching, and prefix traversal over binary-safe paths ([#4506](https://github.com/valkey-io/valkey/pull/4506)).
Use cases include hierarchical routing, longest-prefix matching, and autocomplete indexes.

For example, with two routes stored, `PHPREFIXES` with `COUNT 1` returns the most specific route for a request path ([#5070](https://github.com/valkey-io/valkey/pull/5070)):

```text
> PHSET routes /api/v2 FIELDS 1 backend api-v2
OK
> PHSET routes /api/v2/billing FIELDS 1 backend billing
OK
> PHPREFIXES routes /api/v2/billing/invoices/123 COUNT 1 WITHVALUES
1) 1) "/api/v2/billing"
   2) 1) "backend"
      2) "billing"
```

## New and conditional commands

Valkey 9.2 lets more commands check a condition and act in the same step.
[`EXEC`](https://valkey.io/commands/exec/) now accepts `IFEQ`, `IFNE`, `NX`, and `XX` conditions, enabling optimistic locking for multi-key transactions without needing the [`WATCH`](https://valkey.io/commands/watch/) command ([#4019](https://github.com/valkey-io/valkey/pull/4019)).
The new [`DELEX`](https://valkey.io/commands/delex/) command deletes a string key only when its value matches (`IFEQ`) or differs from (`IFNE`) a given value ([#4607](https://github.com/valkey-io/valkey/pull/4607)), and [`SET`](https://valkey.io/commands/set/) now accepts `IFNE` too ([#3105](https://github.com/valkey-io/valkey/pull/3105)).

The new `INCREX` command increments a key and sets its expiration in one atomic step, with bounded increments and conditional expiration control ([#3253](https://github.com/valkey-io/valkey/pull/3253) and [#4679](https://github.com/valkey-io/valkey/pull/4679)).
For streams, [`XACKDEL`](https://valkey.io/commands/xackdel/) acknowledges and deletes messages in one call, and [`XDELEX`](https://valkey.io/commands/xdelex/) deletes them; in `ACKED` mode, both delete a message only once every consumer group has acknowledged it ([#4629](https://github.com/valkey-io/valkey/pull/4629)).

## Hot key detection

Server-side hot key detection is added with the new [`HOTKEYS GET`](https://valkey.io/commands/hotkeys-get/) and [`HOTKEYS RESET`](https://valkey.io/commands/hotkeys-reset/) commands, enabled by configuring the `hotkeys-top-k` setting ([#3708](https://github.com/valkey-io/valkey/pull/3708)).
It uses the Space-Saving algorithm to track the K hottest keys in a fixed-size summary, so there are no access-rate thresholds to tune.

## Upgrading to Valkey 9.2

Valkey 9.2 is a minor release with no breaking changes, so upgrading is generally safe.
A few changes can affect existing deployments, especially if you later need to downgrade.
As a general rule, don't enable new features until you're confident you won't need to downgrade; newer features may introduce data formats or behavior that older versions can't handle.

Before downgrading, switch `rdbcompression` to a legacy mode and run [`BGREWRITEAOF`](https://valkey.io/commands/bgrewriteaof/): AOF bases written with `lz4` or `zstd` **require** a Valkey version that supports streaming-compressed RDB files ([#4754](https://github.com/valkey-io/valkey/pull/4754)).

## Thank you to our contributors

More than one hundred contributors made Valkey 9.2 possible, through code, reviews, issue reports, and testing.
Thank you!
The full list of changes and contributors is in the [9.2 release notes](https://github.com/valkey-io/valkey/blob/9.2/00-RELEASENOTES).

## What's next

[Download Valkey 9.2](https://valkey.io/download/9.2/) and try the feature that matters most to you.
Then share your experience:

- Share which feature you're trying first, and what you found, in [GitHub Discussions](https://github.com/valkey-io/valkey/discussions) or the [Valkey community](https://valkey.io/community/).
- Feel free to write a blog post about it for valkey.io, the [CONTRIBUTING-BLOG-POST.md](https://github.com/valkey-io/valkey-io.github.io/blob/main/CONTRIBUTING-BLOG-POST.md) explains how you can do that.
- Bring 9.2 to another open source project, for example by adding `INCREX`, `DELEX`, conditional `EXEC`, or the `PH*` commands to a client library, or the new `HOTKEYS` command to a monitoring tool, and share your feedback and results with us!
