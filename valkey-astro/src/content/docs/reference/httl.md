---
title: "HTTL"
description: "HTTL command reference documentation"
---

The `HTTL` command returns the remaining time to live of hash field(s) with associated expiration time(s).
This introspection capability allows a Valkey client to check how many seconds a
given hash field will continue to be part of the hash object.

See also the [`HPTTL`](hpttl.md) command that returns the same information with milliseconds resolution.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HEXPIRE myhash 10 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HTTL myhash FIELDS 4 f1 f2 f3 non-exist
1) (integer) -1
2) (integer) 8
3) (integer) 8
4) (integer) -2
```
