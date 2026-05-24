---
title: "HPEXPIRETIME"
description: "HPEXPIRETIME command reference documentation"
---

The `HPEXPIRETIME` command returns the absolute Unix timestamp (since January 1, 1970) in milliseconds at which the given hash field(s) will expire.

See also the [`HEXPIRETIME`](hexpiretime.md) command which returns the same information with seconds resolution.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HPEXPIREAT myhash 1754847944000 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HPEXPIRETIME myhash FIELDS 4 f1 f2 f3 non-exist
1) (integer) -1
2) (integer) 1754847944000
3) (integer) 1754847944000
4) (integer) -2
```
