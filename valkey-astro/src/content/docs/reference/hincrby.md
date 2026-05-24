---
title: "HINCRBY"
description: "HINCRBY command reference documentation"
---

Increments the number stored at `field` in the hash stored at `key` by
`increment`.
If `key` does not exist, a new key holding a hash is created.
If `field` does not exist the value is set to `0` before the operation is
performed.

The range of values supported by `HINCRBY` is limited to 64 bit signed integers.

## Examples

Since the `increment` argument is signed, both increment and decrement
operations can be performed:

```
127.0.0.1:6379> HSET myhash field 5
(integer) 1
127.0.0.1:6379> HINCRBY myhash field 1
(integer) 6
127.0.0.1:6379> HINCRBY myhash field -1
(integer) 5
127.0.0.1:6379> HINCRBY myhash field -10
(integer) -5
```
