---
title: "HPTTL"
description: "HPTTL command reference documentation"
---

Like [`HTTL`](httl.md) this command returns the remaining time to live of hash field(s) that has an associated expiration time,
with the sole difference that `HTTL` returns the amount of remaining
time in seconds while `HPTTL` returns it in milliseconds.

See also the [`HTTL`](httl.md) command that returns the same information with seconds resolution.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HPEXPIRE myhash 10000 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HPTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) 9597
3) (integer) 9597
```
