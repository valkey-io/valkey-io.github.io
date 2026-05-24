---
title: "HPEXPIRE"
description: "HPEXPIRE command reference documentation"
---

This command works exactly like [`HEXPIRE`](hexpire.md) but the time to live of the key is
specified in milliseconds instead of seconds.
Note, that providing a millisecond time of '0' will cause immediate expiration and reclamation of the field(s).

## Options

The `HPXPIRE` command supports a set of options that modify its behavior:

* NX — For each specified field, set expiration only when the field has no expiration.
* XX — For each specified field, set expiration only when the field has an existing expiration.
* GT — For each specified field, set expiration only when the new expiration is greater than current one.
* LT — For each specified field, set expiration only when the new expiration is less than current one.

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
