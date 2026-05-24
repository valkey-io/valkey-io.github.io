---
title: "PTTL"
description: "PTTL command reference documentation"
---

Like [`TTL`](ttl.md) this command returns the remaining time to live of a key that has an
expire set, with the sole difference that `TTL` returns the amount of remaining
time in seconds while `PTTL` returns it in milliseconds.

The command returns the following values in case of errors:

* The command returns `-2` if the key does not exist.
* The command returns `-1` if the key exists but has no associated expire.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> EXPIRE mykey 1
(integer) 1
127.0.0.1:6379> PTTL mykey
(integer) 989
```
