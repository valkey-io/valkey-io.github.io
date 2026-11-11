+++
title = "Valkey 9.2 offers forkless snapshots, compressed replication, ACL roles, and more"
description = "Valkey 9.2 can save snapshots without forking, compress replication traffic with LZ4 or Zstandard, and group ACL rules into reusable roles. It also adds Path Hash, a new data type for prefix lookups, and a set of conditional commands."
date = 2026-11-15
authors = ["kyledvs", "dragosandriciuc"]

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = true
featured_image = "/assets/media/featured/valkey-release-9-2.svg"
+++

Valkey 9.2 is now out!
This release gets more out of the hardware you already run.
Large sorted sets use 36% to 43% less memory overhead per member, replication traffic can be compressed, and background saves and full syncs can run without forking the server.
When load spikes, Valkey 9.2 keeps cluster heartbeats and replication moving, holds connections for administrators, and slows writes before a lagging replica needs a full resync.
It also adds roles to access control, Path Hash, a new data type, a set of conditional commands and more.

Let's take a look at the changes.

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

Valkey 9.2 adds a set of new and conditional commands:

- The [`EXEC`](https://valkey.io/commands/exec/) command now accepts `IFEQ`, `IFNE`, `NX`, and `XX` conditions, enabling optimistic locking for multi-key transactions without needing the [`WATCH`](https://valkey.io/commands/watch/) command ([#4019](https://github.com/valkey-io/valkey/pull/4019)).
- The new [`DELEX`](https://valkey.io/commands/delex/) command conditionally deletes a string key when its value matches (`IFEQ`) or differs from (`IFNE`) a given value ([#4607](https://github.com/valkey-io/valkey/pull/4607)), and [`SET`](https://valkey.io/commands/set/) now accepts `IFNE` ([#3105](https://github.com/valkey-io/valkey/pull/3105)).
- The new `INCREX` command atomically increments a key while setting its expiration, with bounded increments and conditional expiration control ([#3253](https://github.com/valkey-io/valkey/pull/3253) and [#4679](https://github.com/valkey-io/valkey/pull/4679)).
- The new [`XACKDEL`](https://valkey.io/commands/xackdel/) and [`XDELEX`](https://valkey.io/commands/xdelex/) stream commands acknowledge and delete messages once consumer groups no longer need them ([#4629](https://github.com/valkey-io/valkey/pull/4629)).

## Hot key detection

Server-side hot key detection is added with the new [`HOTKEYS GET`](https://valkey.io/commands/hotkeys-get/) and [`HOTKEYS RESET`](https://valkey.io/commands/hotkeys-reset/) commands, enabled by configuring the `hotkeys-top-k` setting ([#3708](https://github.com/valkey-io/valkey/pull/3708)).
It uses the Space-Saving algorithm to track the K hottest keys in a fixed-size summary, so there are no access-rate thresholds to tune.

## Also in this release

Valkey 9.2 also includes the following changes:

**Security:**

- [`ACL DIGEST`](https://valkey.io/commands/acl-digest/) returns a fingerprint of the ACL rules currently in effect, which you can use to verify what [`ACL LOAD`](https://valkey.io/commands/acl-load/) applied ([#4446](https://github.com/valkey-io/valkey/pull/4446)).
- Support for a secondary server certificate is added through `tls-alt-cert-file`, `tls-alt-key-file`, and `tls-alt-key-file-pass`, for example a post-quantum certificate alongside RSA ([#3717](https://github.com/valkey-io/valkey/pull/3717)).
- When you build Valkey with TLS, [`ACL GENPASS`](https://valkey.io/commands/acl-genpass/) and the hash function seed draw randomness from the configured OpenSSL 3 provider ([#4339](https://github.com/valkey-io/valkey/pull/4339)).
- [`CLUSTER MIGRATESLOTS`](https://valkey.io/commands/cluster-migrateslots/) accepts an optional per-target `AUTH username password`, with the credentials redacted from the slow log and [`MONITOR`](https://valkey.io/commands/monitor/) ([#3538](https://github.com/valkey-io/valkey/pull/3538)).

**Performance:**

- [`HMGET`](https://valkey.io/commands/hmget/), [`SMISMEMBER`](https://valkey.io/commands/smismember/), and [`ZMSCORE`](https://valkey.io/commands/zmscore/) on large hashtable-encoded keys use batched lookups that overlap memory accesses ([#4017](https://github.com/valkey-io/valkey/pull/4017)).
- Replicas can now parse multiple commands from the replication stream at once ([#3597](https://github.com/valkey-io/valkey/pull/3597)), and command propagation batches each command's RESP frame into a single replication buffer write ([#4044](https://github.com/valkey-io/valkey/pull/4044)).
- When `io-threads` are enabled, memory prefetching extends to hash, set, and sorted set member lookups ([#3940](https://github.com/valkey-io/valkey/pull/3940)), and cluster bus reads, writes, and inbound TLS accepts can run on the shared I/O thread pool ([#3438](https://github.com/valkey-io/valkey/pull/3438)).
- [`HGETALL`](https://valkey.io/commands/hgetall/), [`HKEYS`](https://valkey.io/commands/hkeys/), and [`HVALS`](https://valkey.io/commands/hvals/) are faster with exact-length reply headers, fused bulk replies, and entry prefetching ([#4417](https://github.com/valkey-io/valkey/pull/4417)).
- Exact [`XTRIM`](https://valkey.io/commands/xtrim/) `MAXLEN = 0` is about 2.5 times faster because it clears the whole stream in one step ([#4161](https://github.com/valkey-io/valkey/pull/4161)).

**Operations:**

- The `cluster-replica-priority` configuration lets operators rank which replicas are preferred during automatic cluster failover ([#2204](https://github.com/valkey-io/valkey/pull/2204)).
- With the new `if-empty` value of `cluster-replica-no-failover`, a replica that has never received data from its primary refuses automatic failover ([#4425](https://github.com/valkey-io/valkey/pull/4425)).
- A new `FAILOVER_AUTH_NACK` message speeds up recovery from split-vote elections ([#3833](https://github.com/valkey-io/valkey/pull/3833)).
- The new `maxmemory-scripts` configuration limits the memory used by cached [`EVAL`](https://valkey.io/commands/eval/) scripts, and [`SCRIPT LOAD`](https://valkey.io/commands/script-load/) now respects the global `maxmemory` limit ([#866](https://github.com/valkey-io/valkey/pull/866)).
- [`EXEC`](https://valkey.io/commands/exec/) transactions are now recorded in the slow log and command log when their total execution time crosses the threshold ([#4267](https://github.com/valkey-io/valkey/pull/4267)).
- Compressed full-sync RDB files can be reused directly as append-only file (AOF) bases ([#4754](https://github.com/valkey-io/valkey/pull/4754)).

**Commands:**

- [`MOVE`](https://valkey.io/commands/move/) now accepts an optional `REPLACE` argument to overwrite an existing key in the destination database ([#2993](https://github.com/valkey-io/valkey/pull/2993)).
- [`SISMEMBER`](https://valkey.io/commands/sismember/) now accepts an optional `XX` flag that returns `-1` when the key doesn't exist ([#2972](https://github.com/valkey-io/valkey/pull/2972)), and the [`ZRANGE`](https://valkey.io/commands/zrange/) family accepts `XX` to distinguish a non-existent key from an empty result ([#2978](https://github.com/valkey-io/valkey/pull/2978)).
- `CONFIG INFO` now returns configuration metadata such as type, flags, valid enum values, and numeric ranges ([#3050](https://github.com/valkey-io/valkey/pull/3050)).

**Tooling:**

- `valkey-benchmark` can now load CSV and TSV datasets ([#2823](https://github.com/valkey-io/valkey/pull/2823)), accepts keyspace sizes above `INT_MAX` ([#4252](https://github.com/valkey-io/valkey/pull/4252)), and scales further in multi-threaded mode ([#4332](https://github.com/valkey-io/valkey/pull/4332)).
- `valkey-cli` reads the `VALKEYCLI_HOST`, `VALKEYCLI_PORT`, and `VALKEYCLI_USER` environment variables ([#3402](https://github.com/valkey-io/valkey/pull/3402) and [#4126](https://github.com/valkey-io/valkey/pull/4126)).

## Before you upgrade

A few changes in Valkey 9.2 can affect existing deployments.
As a general rule, don't enable new features until you're confident you won't need to downgrade; newer features may introduce data formats or behavior that older versions can't handle.

Before you upgrade, check the following:

- Ensure you update the scripts or monitoring which check `OBJECT ENCODING` for `skiplist`: large sorted sets now report `btree` ([#4359](https://github.com/valkey-io/valkey/pull/4359)).
- Before downgrading, switch `rdbcompression` to a legacy mode and run [`BGREWRITEAOF`](https://valkey.io/commands/bgrewriteaof/): AOF bases written with `lz4` or `zstd` **require** a Valkey version that supports streaming-compressed RDB files ([#4754](https://github.com/valkey-io/valkey/pull/4754)).

## Thank you to our contributors

More than one hundred contributors made Valkey 9.2 possible, through code, reviews, issue reports, and testing.
Thank you!
The full list of changes and contributors is in the [9.2 release notes](https://github.com/valkey-io/valkey/blob/9.2/00-RELEASENOTES).

## What's next

[Download Valkey 9.2](https://valkey.io/download/9.2/) and try the feature that matters most to you.
Then tell us about it:

- Share which feature you're trying first, and what you found, in [GitHub Discussions](https://github.com/valkey-io/valkey/discussions) or the [Valkey community](https://valkey.io/community/).
- Feel free to write a blog post about it for valkey.io, the [CONTRIBUTING-BLOG-POST.md](https://github.com/valkey-io/valkey-io.github.io/blob/main/CONTRIBUTING-BLOG-POST.md) explains how you can do that.
- Bring 9.2 to another open source project, for example by adding `INCREX`, `DELEX`, conditional `EXEC`, or the `PH*` commands to a client library, or the new `HOTKEYS` command to a monitoring tool, and share your feedback and results with us!
