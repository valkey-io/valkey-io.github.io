---
title: "HINCRBYFLOAT"
description: "HINCRBYFLOAT command reference documentation"
---

Increment the specified `field` of a hash stored at `key`, and representing a
floating point number, by the specified `increment`. If the increment value
is negative, the result is to have the hash field value **decremented** instead of incremented.
If the field does not exist, it is set to `0` before performing the operation.
An error is returned if one of the following conditions occur:

* The key contains a value of the wrong type (not a hash).
* The current field content or the specified increment are not parsable as a
  double precision floating point number.

The exact behavior of this command is identical to the one of the `INCRBYFLOAT`
command, please refer to the documentation of [`INCRBYFLOAT`](incrbyfloat.md) for further
information.

## Examples

```
127.0.0.1:6379> HSET mykey field 10.50
(integer) 1
127.0.0.1:6379> HINCRBYFLOAT mykey field 0.1
"10.6"
127.0.0.1:6379> HINCRBYFLOAT mykey field -5
"5.6"
127.0.0.1:6379> HSET mykey field 5.0e3
(integer) 0
127.0.0.1:6379> HINCRBYFLOAT mykey field 2.0e2
"5200"
```

## Implementation details

The command is always propagated in the replication link and the Append Only
File as a [`HSET`](hset.md) operation, so that differences in the underlying floating point
math implementation will not be sources of inconsistency.
