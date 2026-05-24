---
title: "RENAME"
description: "RENAME command reference documentation"
---

Renames `key` to `newkey`.
It returns an error when `key` does not exist.

If `newkey` already exists, it is overwritten. By default, Valkey uses implicit lazy freeing (similar to `UNLINK`), so large values are released asynchronously. If lazy freeing is disabled and synchronous deletion is configured, overwriting a key with a very large value may cause high latency.

In Cluster mode, both `key` and `newkey` must be in the same **hash slot**, meaning that in practice only keys that have the same hash tag can be reliably renamed in cluster.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> RENAME mykey myotherkey
OK
127.0.0.1:6379> GET myotherkey
"Hello"
```
