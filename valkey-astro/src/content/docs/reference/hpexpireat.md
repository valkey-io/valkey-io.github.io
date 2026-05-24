---
title: "HPEXPIREAT"
description: "HPEXPIREAT command reference documentation"
---

`HEXPIREAT` has the same effect and semantic as [`HPEXPIRE`](hpexpire.md), but instead of
specifying the number of milliseconds representing the TTL (time to live), it takes
an absolute Unix timestamp (milliseconds since January 1, 1970). A
timestamp in the past will delete the key immediately.

For the specific semantics of the command refer to the documentation of
[`HPEXPIRE`](hpexpire.md).

## Options

The `HPEXPIREAT` command supports a set of options that modify its behavior:

* NX — For each specified field, set expiration only when the field has no expiration.
* XX — For each specified field, set expiration only when the field has an existing expiration.
* GT — For each specified field, set expiration only when the new expiration is greater than current one.
* LT — For each specified field, set expiration only when the new expiration is less than current one.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HPEXPIREAT myhash 1754847944000 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HPEXPIRETIME myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) 1754847944000
3) (integer) 1754847944000
```
