---
title: "RENAMENX"
description: "RENAMENX command reference documentation"
---

Renames `key` to `newkey` if `newkey` does not yet exist.
It returns an error when `key` does not exist.

In Cluster mode, both `key` and `newkey` must be in the same **hash slot**, meaning that in practice only keys that have the same hash tag can be reliably renamed in cluster.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> SET myotherkey "World"
OK
127.0.0.1:6379> RENAMENX mykey myotherkey
(integer) 0
127.0.0.1:6379> GET myotherkey
"World"
```
