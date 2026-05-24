---
title: "HEXPIRE"
description: "HEXPIRE command reference documentation"
---

The `HEXPIRE` command allows manipulating the expiration time for existing hash fields.
When set, the expiration time of a hash field will determine when the field will be automatically deleted.
Note, that providing a millisecond time of '0' will cause immediate expiration and deletion of the field(s).

## Options

The `HEXPIRE` command supports a set of options that modify its behavior:

* NX — For each specified field, set expiration only when the field has no expiration.
* XX — For each specified field, set expiration only when the field has an existing expiration.
* GT — For each specified field, set expiration only when the new expiration is greater than current one.
* LT — For each specified field, set expiration only when the new expiration is less than current one.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HEXPIRE myhash 10 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) 8
3) (integer) 8
```
