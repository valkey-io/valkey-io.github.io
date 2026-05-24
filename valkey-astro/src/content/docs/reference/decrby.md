---
title: "DECRBY"
description: "DECRBY command reference documentation"
---

Decrements the number stored at `key` by `decrement`.
If the key does not exist, it is set to `0` before performing the operation.
An error is returned if the key contains a value of the wrong type or contains a
string that can not be represented as integer.
This operation is limited to 64 bit signed integers.

See `INCR` for extra information on increment/decrement operations.

## Examples

```
127.0.0.1:6379> SET mykey "10"
OK
127.0.0.1:6379> DECRBY mykey 3
(integer) 7
```
