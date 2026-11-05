+++
title = "Valkey 9.2 offers forkless snapshots, compressed replication, ACL roles, and more"
description = "Valkey 9.2 can save snapshots without forking, compress replication traffic with LZ4 or Zstandard, and group ACL rules into reusable roles. It also adds Path Hash, a new data type for prefix lookups, and a set of conditional commands."
date = 2026-11-15
authors = ["kyledvs", "dragosandriciuc"]

[taxonomies]
blog_type = ["Announcements"]

[extra]
featured = true
featured_image = "/assets/media/featured/Valkey-Release.svg"
+++

Valkey 9.2.0 is now out!
This release changes how Valkey writes snapshots and replicates data, adds roles to access control, and introduces a new data type.
This post walks through the changes with the most impact, grouped by area, and ends with the behavior changes to check before you upgrade.

## Persistence and replication

The way snapshots are written and how data moves between a primary and its replicas is changing with Valkey 9.2.

**Forkless snapshots and full syncs:** Valkey 9.2 adds forkless RDB snapshots, opt-in through the `forkless-infrastructure-enabled` and `forkless-policy` configs ([#4460](https://github.com/valkey-io/valkey/pull/4460) and [#5261](https://github.com/valkey-io/valkey/pull/5261)).
`forkless-policy` takes the values `require-fork` and `prefer-forkless`, and new [`INFO persistence`](https://valkey.io/commands/info/) fields report the save method and progress.
Full synchronization to replicas can also run forkless, serving disk-based and diskless full syncs from a background-thread snapshot ([#4797](https://github.com/valkey-io/valkey/pull/4797)).

**Streaming compression:** `rdbcompression` now accepts `lz4` and `zstd` for whole-stream compression of RDB files, and the default per-string LZF behavior is unchanged ([#3531](https://github.com/valkey-io/valkey/pull/3531) and [#3798](https://github.com/valkey-io/valkey/pull/3798)).
Zstandard offers better compression ratios than LZ4 and is enabled at build time with `BUILD_ZSTD=yes` ([#3798](https://github.com/valkey-io/valkey/pull/3798)).
The PR points to cross-region replication as the main use for Zstandard, where network costs are high compared to compute.

The new `repl-compression` configuration adds streaming compression for steady-state replication, negotiated per replica so older or opted-out replicas keep receiving plaintext ([#3853](https://github.com/valkey-io/valkey/pull/3853)).
In the PR's benchmark of 3 million keys of about 315 bytes each, LZ4 cut replication bandwidth by 52% with less than 1% throughput overhead.

The append-only file (AOF) bases support streaming-compressed RDB, so compressed full-sync RDB files can be reused directly as AOF bases ([#4754](https://github.com/valkey-io/valkey/pull/4754)).

**Replication throttling:** The optional `repl-throttling-enabled` configuration slows client writes when a replica falls behind, avoiding disconnects and full syncs ([#4356](https://github.com/valkey-io/valkey/pull/4356)).
It is built on a new token-bucket client throttling mechanism.

## Security

Valkey 9.2 now has ACL roles and digests, a secondary TLS certificate, and randomness from the configured OpenSSL provider.

**ACL roles:** Roles are named, reusable sets of access control list (ACL) selectors ([#3967](https://github.com/valkey-io/valkey/pull/3967)).
They let you define a permission policy once and apply it to many users, instead of repeating the same rules for each user.
Changes to a role are visible immediately to every user that holds it, and a user can add permissions on top of a role but not restrict it.
You can manage them using [`ACL SETROLE`](https://valkey.io/commands/acl-setrole/), [`ACL DELROLE`](https://valkey.io/commands/acl-delrole/), [`ACL GETROLE`](https://valkey.io/commands/acl-getrole/), and [`ACL ROLES`](https://valkey.io/commands/acl-roles/) commands, and assign them to users with the `role=` rule.
The roles work in commands, in the ACL file, and in `valkey.conf`.

For example, create a role that can only read keys under `app:` and assign it to a user:

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

**ACL DIGEST:** The [`ACL DIGEST`](https://valkey.io/commands/acl-digest/) command returns a fingerprint of the ACL rules currently in effect, which you can use to verify what [`ACL LOAD`](https://valkey.io/commands/acl-load/) applied ([#4446](https://github.com/valkey-io/valkey/pull/4446)).

**Secondary TLS certificate:** Support for a secondary server certificate is added through `tls-alt-cert-file`, `tls-alt-key-file`, and `tls-alt-key-file-pass`, for example a post-quantum certificate alongside RSA, with matching `INFO` TLS fields ([#3717](https://github.com/valkey-io/valkey/pull/3717)).

**Randomness from OpenSSL:** When you build Valkey with TLS, [`ACL GENPASS`](https://valkey.io/commands/acl-genpass/) and the hash function seed draw randomness from the configured OpenSSL 3 provider, which supports deployments that require a validated cryptographic module ([#4339](https://github.com/valkey-io/valkey/pull/4339)).

**Credentials and fixes:** [`CLUSTER MIGRATESLOTS`](https://valkey.io/commands/cluster-migrateslots/) accepts an optional per-target `AUTH username password`, with the credentials redacted from the slow log and [`MONITOR`](https://valkey.io/commands/monitor/) ([#3538](https://github.com/valkey-io/valkey/pull/3538)).
A [`SORT`](https://valkey.io/commands/sort/) `STORE` destination named like an option can no longer bypass ACL checks and write to an unauthorized key ([#4665](https://github.com/valkey-io/valkey/pull/4665)).

## Availability under load

Valkey 9.2 prioritizes system-critical events, reserves connection slots for administrative clients, and adds cluster failover controls.

**Priority for system-critical events:** Cluster heartbeats, replication, and slot migration are now prioritized over heavy client traffic, tunable through the new `priority-preemptive-poll-interval-us` configuration ([#4076](https://github.com/valkey-io/valkey/pull/4076)).
It works as an anti-starvation mechanism in the event loop that gives cluster bus connections priority.

**Reserved connections for administrators:** Connections from the CIDR ranges listed in the new `priority-subnets` configuration are tagged as prioritized ([#4005](https://github.com/valkey-io/valkey/pull/4005)).
`maxclients-reserved` caps normal clients at `maxclients` minus that many connection slots, and `INFO clients` reports `connected_priority_clients`.

**Cluster failover:** The `cluster-replica-priority` configuration lets operators rank which replicas are preferred during automatic cluster failover ([#2204](https://github.com/valkey-io/valkey/pull/2204)).
With the new `if-empty` value of `cluster-replica-no-failover`, a replica that has never received data from its primary refuses automatic failover, preventing silent data loss ([#4425](https://github.com/valkey-io/valkey/pull/4425)).
And a new `FAILOVER_AUTH_NACK` message speeds up recovery from split-vote elections by letting a replica detect an unwinnable election and immediately retry with a higher epoch ([#3833](https://github.com/valkey-io/valkey/pull/3833)).

## Performance

Sorted sets, multi-key lookups, replication, the cluster bus, and several hash and stream commands are sped up in Valkey 9.2.

**B+ tree sorted sets:** Large sorted sets are now backed by a B+ tree instead of a skiplist, and [`OBJECT ENCODING`](https://valkey.io/commands/object-encoding/) reports `btree` instead of `skiplist` ([#4359](https://github.com/valkey-io/valkey/pull/4359)).
The PR reports per-member memory overhead dropping from 50.3 bytes to between 28.5 and 32.0 bytes, 36% to 43% less, for 5 million members with 20-byte elements.
Expect delete-heavy workloads to land worse than that, as the B+ tree has no compaction yet.

**Batched lookups and prefetching:** [`HMGET`](https://valkey.io/commands/hmget/), [`SMISMEMBER`](https://valkey.io/commands/smismember/), and [`ZMSCORE`](https://valkey.io/commands/zmscore/) on large hashtable-encoded keys use batched lookups that overlap memory accesses ([#4017](https://github.com/valkey-io/valkey/pull/4017)).
In Valkey 9.2, when `io-threads` are enabled, memory prefetching extends to hash, set, and sorted set member lookups, which improves performance for 30 commands ([#3940](https://github.com/valkey-io/valkey/pull/3940)).

**Faster replication:** Replicas can now parse multiple commands from the replication stream at once ([#3597](https://github.com/valkey-io/valkey/pull/3597)).
And command propagation to replicas batches each command's RESP frame into a single replication buffer write ([#4044](https://github.com/valkey-io/valkey/pull/4044)).

**Cluster bus:** The cluster bus reads, writes, and inbound TLS accepts can now run on the shared I/O thread pool, with new [`CLUSTER INFO`](https://valkey.io/commands/cluster-info/) offload statistics ([#3438](https://github.com/valkey-io/valkey/pull/3438)).
Furthermore, when `cluster-config-save-behavior` is best-effort, the cluster configuration file is saved from a background thread, avoiding main-thread latency spikes from slow disk I/O ([#2555](https://github.com/valkey-io/valkey/pull/2555)).

**Hash and stream commands:** [`HGETALL`](https://valkey.io/commands/hgetall/), [`HKEYS`](https://valkey.io/commands/hkeys/), and [`HVALS`](https://valkey.io/commands/hvals/) are faster with exact-length reply headers, fused bulk replies, and entry prefetching ([#4417](https://github.com/valkey-io/valkey/pull/4417)).
Optimizations to exact [`XTRIM`](https://valkey.io/commands/xtrim/) `MAXLEN = 0` make it about 2.5 times faster because it clears the whole stream in one step instead of removing entries individually ([#4161](https://github.com/valkey-io/valkey/pull/4161)).

## Efficiency

Valkey 9.2 also reduces memory usage for small hashes with field expiration and for shared client objects, adding memory controls for scripts and libc.

**Listpack for hashes with field expiration:** Small hashes with field expiration now use the listpack encoding instead of always converting to a hashtable ([#3212](https://github.com/valkey-io/valkey/pull/3212)).

**Shared client objects:** The Pub/Sub pattern and `WATCH` key objects are shared across clients subscribing to or watching the same name ([#4072](https://github.com/valkey-io/valkey/pull/4072)).

**Script cache limit:** The new `maxmemory-scripts` configuration limits the memory used by cached [`EVAL`](https://valkey.io/commands/eval/) scripts, and [`SCRIPT LOAD`](https://valkey.io/commands/script-load/) is marked `DENYOOM` so it now respects the global `maxmemory` limit ([#866](https://github.com/valkey-io/valkey/pull/866)).

**Memory purge on glibc:** [`MEMORY PURGE`](https://valkey.io/commands/memory-purge/) now also releases free pages from the glibc main arena back to the operating system ([#3640](https://github.com/valkey-io/valkey/pull/3640)).

## Observability

Valkey 9.2 adds server-side hot key detection and new metrics for transactions, replication, cluster links, and client memory.

**Hot key detection:** Server-side hot key detection is added with the new [`HOTKEYS GET`](https://valkey.io/commands/hotkeys-get/) and [`HOTKEYS RESET`](https://valkey.io/commands/hotkeys-reset/) commands, enabled by configuring the `hotkeys-top-k` setting ([#3708](https://github.com/valkey-io/valkey/pull/3708)).
It uses the Space-Saving algorithm to track the K hottest keys in a fixed-size summary, so there are no access-rate thresholds to tune.
`HOTKEYS GET` reports the last completed detection window, and detection is disabled by default.

**Transactions in the slow log:** [`EXEC`](https://valkey.io/commands/exec/) transactions are now recorded in the slow log and command log when their total execution time crosses the threshold ([#4267](https://github.com/valkey-io/valkey/pull/4267)).

**Replication and cluster metrics:** `INFO replication` reports `last_successful_sync_duration_ms`, telling you how long the replica's last full sync took ([#4197](https://github.com/valkey-io/valkey/pull/4197)).
`CLUSTER INFO` has the `total_cluster_links_established_inbound` and `total_cluster_links_established_outbound` counters, which help detect frequent reconnections between nodes ([#4169](https://github.com/valkey-io/valkey/pull/4169)).

**Client memory accounting:** Client memory usage now includes watched key, Pub/Sub channel and pattern names, so it shows in `CLIENT INFO` `tot-mem` and counts toward `maxmemory-clients` ([#3362](https://github.com/valkey-io/valkey/pull/3362)).

## New data type and commands

Valkey 9.2 adds the Path Hash data type, the `INCREX`, `DELEX`, `XACKDEL`, and `XDELEX` commands, conditions on `EXEC`, and new options on existing commands.

### Path Hash

Path Hash is a new radix-tree-backed data type with `PH*` commands for exact lookup, longest-prefix matching, and prefix traversal over binary-safe paths ([#4506](https://github.com/valkey-io/valkey/pull/4506)).
Use cases include hierarchical routing, longest-prefix matching, and autocomplete indexes.
`PHPREFIXES` returns matching prefixes longest-first, with paging and an `EXCLUDESELF` option ([#5070](https://github.com/valkey-io/valkey/pull/5070)).
`PHPATHSCAN` iterates paths in order, `PHPATHDEL` deletes an exact path or its whole subtree, and `PHPATHCOUNT` can count only the paths under a given prefix ([#5066](https://github.com/valkey-io/valkey/pull/5066), [#5067](https://github.com/valkey-io/valkey/pull/5067) and [#5071](https://github.com/valkey-io/valkey/pull/5071)).

For example, with two routes stored, `PHPREFIXES` with `COUNT 1` returns the most specific route for a request path:

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

### INCREX

The new `INCREX` command atomically increments a key by an integer or a float while setting its expiration, with `NX` and `XX` conditions ([#3253](https://github.com/valkey-io/valkey/pull/3253)).
The `LBOUND`, `UBOUND`, `SATURATE`, `ENX`, and `PERSIST` options add bounded increments and conditional expiration control ([#4679](https://github.com/valkey-io/valkey/pull/4679)).

### DELEX

The new [`DELEX`](https://valkey.io/commands/delex/) command conditionally deletes a string key when its value matches (`IFEQ`) or differs from (`IFNE`) a given value ([#4607](https://github.com/valkey-io/valkey/pull/4607)).

### Conditional transactions

[`EXEC`](https://valkey.io/commands/exec/) now accepts `IFEQ`, `IFNE`, `NX`, and `XX` conditions, enabling optimistic locking for multi-key transactions without needing the [`WATCH`](https://valkey.io/commands/watch/) command ([#4019](https://github.com/valkey-io/valkey/pull/4019)).

### XACKDEL and XDELEX

The new [`XACKDEL`](https://valkey.io/commands/xackdel/) and [`XDELEX`](https://valkey.io/commands/xdelex/) stream commands, with `KEEPREF`, `DELREF`, and `ACKED` modes, acknowledge and delete messages once consumer groups no longer need them ([#4629](https://github.com/valkey-io/valkey/pull/4629)).

### Other command updates

Several existing commands gain options in Valkey 9.2:

- [`SET`](https://valkey.io/commands/set/) now accepts `IFNE` to set a key only when its current value differs from the given comparison value ([#3105](https://github.com/valkey-io/valkey/pull/3105)).
- [`MOVE`](https://valkey.io/commands/move/) now accepts an optional `REPLACE` argument to overwrite an existing key in the destination database ([#2993](https://github.com/valkey-io/valkey/pull/2993)).
- [`SISMEMBER`](https://valkey.io/commands/sismember/) now accepts an optional `XX` flag that returns `-1` when the key doesn't exist, distinguishing a missing key from a missing member ([#2972](https://github.com/valkey-io/valkey/pull/2972)).
- The [`ZRANGE`](https://valkey.io/commands/zrange/) family now accepts `XX` to distinguish a non-existent key (nil) from an empty result ([#2978](https://github.com/valkey-io/valkey/pull/2978)).
- `CONFIG INFO` now returns config metadata such as type, flags, valid enum values, and numeric ranges ([#3050](https://github.com/valkey-io/valkey/pull/3050)).

## Tooling

Besides the above changes, Valkey 9.2 extends `valkey-benchmark` and `valkey-cli` as well.

**valkey-benchmark:** `valkey-benchmark` can now load CSV and TSV datasets and inject their fields into commands through `__field:name__` placeholders ([#2823](https://github.com/valkey-io/valkey/pull/2823)).
`-r` now accepts keyspace sizes above `INT_MAX`, up to 999,999,999,999 ([#4252](https://github.com/valkey-io/valkey/pull/4252)), and multi-threaded mode scales further by removing cross-thread contention in key generation, latency recording, and counters ([#4332](https://github.com/valkey-io/valkey/pull/4332)).

**valkey-cli:** `valkey-cli` reads the `VALKEYCLI_HOST`, `VALKEYCLI_PORT`, and `VALKEYCLI_USER` environment variables ([#3402](https://github.com/valkey-io/valkey/pull/3402) and [#4126](https://github.com/valkey-io/valkey/pull/4126)).

## Before you upgrade

A few changes in Valkey 9.2 can affect existing deployments; be careful of the following:

- Active expiration of keys and hash fields now increments the dirty counter, so save points, and therefore `BGSAVE`, may trigger more often ([#3118](https://github.com/valkey-io/valkey/pull/3118)).
- `OBJECT ENCODING` reports `btree` instead of `skiplist` for large sorted sets ([#4359](https://github.com/valkey-io/valkey/pull/4359)).
- AOF bases written with `rdbcompression lz4` or `zstd` **require** a version of Valkey that supports streaming-compressed RDB files.
  Before downgrading, switch to a legacy compression mode and run [`BGREWRITEAOF`](https://valkey.io/commands/bgrewriteaof/) ([#4754](https://github.com/valkey-io/valkey/pull/4754)).
- [`ZRANGEBYSCORE`](https://valkey.io/commands/zrangebyscore/), `ZREVRANGEBYSCORE`, `ZCOUNT`, and `ZRANGESTORE` reject a bare `(` or an empty string as a score bound instead of treating it as `0` ([#4054](https://github.com/valkey-io/valkey/pull/4054)).
- `cluster-announce-ip` must be a valid IP address or hostname, rejecting values like `ip:port` ([#4055](https://github.com/valkey-io/valkey/pull/4055)).
- The minimum required CMake version is now **3.24** ([#4232](https://github.com/valkey-io/valkey/pull/4232)).

## Thank you to our contributors

More than one hundred contributors made Valkey 9.2.0 possible, through code, reviews, issue reports, and testing.
Thank you!
The full list of changes and contributors is in the [9.2.0 release notes](https://github.com/valkey-io/valkey/blob/9.2/00-RELEASENOTES).

[Download Valkey 9.2.0](https://valkey.io/download/), and share your feedback on [GitHub](https://github.com/valkey-io/valkey) and in the [Valkey community](https://valkey.io/community/).
