---
title: "CLUSTERSCAN"
description: "CLUSTERSCAN command reference documentation"
---

`CLUSTERSCAN` iterates over keys across a Valkey Cluster.
It walks through every hash slot in the cluster, one slot at a time.

Similar to `SCAN`, it is cursor-based. You start by passing `0` as the cursor and keep calling until the returned cursor is `0` again.
The cursor format is `fingerprint-{hashtag}-localcursor`.
The fingerprint is an opaque string that identifies how the node will return cursor, which currently includes information about the engine version and the `hash-seed` config value.
Mismatches in the fingerprint will result in the cursor restarting the current slot.
The [hash tag](../topics/cluster-spec.md#hash-tags) represents the current slot (e.g., `{06S}`), so cluster-aware clients will route each call to the right node automatically.
The local cursor helps resume the scan from where it left off.

```
127.0.0.1:6379> CLUSTERSCAN 0
1) "0-{06S}-0"
2) (empty list or set)
127.0.0.1:6379> CLUSTERSCAN 0-{06S}-0
1) "0B3a21-{06S}-96"
2) 1) "key:1"
   2) "key:2"
   3) "key:3"
127.0.0.1:6379> CLUSTERSCAN 0B3a21-{06S}-96
1) "0-{Qi}-0"
2) 1) "key:4"
```

In this example, the first call returns an initial cursor for slot 0 with no keys.
The next call scans through slot 0 and returns keys.
Once slot 0 is done, the cursor moves on to slot 1 (you can see the hash tag change from `{06S}` to `{Qi}`).
Since the cursor carries the hash tag, the client naturally routes the next call to whichever node owns slot 1.
This continues until all slots have been visited and the cursor comes back as `0`.

## The SLOT option

By default `CLUSTERSCAN` goes through all slots from 0 to 16383.
If you only care about keys in a particular slot, pass the `SLOT` option:

```
127.0.0.1:6379> CLUSTERSCAN 0 SLOT 0
1) "0-{06S}-0"
2) (empty list or set)
127.0.0.1:6379> CLUSTERSCAN 0-{06S}-0 SLOT 0
1) "0B3a21-{06S}-64"
2) 1) "key_in_slot0:1"
```

With `SLOT`, the scan stays within that slot and returns `0` when it's done rather than advancing to the next one.
This also makes it possible to run scans in parallel by issuing concurrent `CLUSTERSCAN` calls for different slots.
If the cursor already points to a different slot than the `SLOT` argument, you'll get an error.
You can only specify `SLOT` once per call.

## MATCH, COUNT and TYPE options

These work the same way as in [`SCAN`](scan.md).
`MATCH` filters by a glob-style pattern, `COUNT` hints how many keys to return per call (default 10), and `TYPE` filters by data type.

## Handling topology changes

`CLUSTERSCAN` is designed to keep working when the cluster topology changes mid-scan:

* **Slot migration**: If a slot moves to another node while you're scanning it, the old node sends back a `-MOVED` redirect.
  Just follow the redirect and continue with the same cursor on the new owner.
* **Failover and node restart**: If the node's memory layout has changed since the cursor was issued, the scan restarts from the beginning of that slot instead of returning an error.
  To avoid this, set [`hash-seed`](scan.md) to the same value on all nodes.
* **Unassigned slots**: If the cursor points to a slot that no node is serving, you'll get a `-CLUSTERDOWN` error.

When all nodes share the same [`hash-seed`](scan.md), the fingerprint stays consistent across failovers and resharding, so cursors remain valid without restarting.

## Guarantees

`CLUSTERSCAN` gives the same guarantees as [`SCAN`](scan.md):

* Every key that exists throughout the entire iteration of a slot will be returned at least once.
* Duplicates are possible, especially around topology changes, so your application should be prepared to handle them.

## Return value

An array with two elements: the cursor to pass in the next call, and an array of key names.
