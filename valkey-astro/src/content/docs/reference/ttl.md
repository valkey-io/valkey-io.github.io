---
title: "TTL"
description: "TTL command reference documentation"
---

Returns the remaining time to live of a key that has a timeout.
This introspection capability allows a Valkey client to check how many seconds a
given key will continue to be part of the dataset.

The command returns the following values in case of errors:

* The command returns `-2` if the key does not exist.
* The command returns `-1` if the key exists but has no associated expire.

See also the [`PTTL`](pttl.md) command that returns the same information with milliseconds resolution.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> EXPIRE mykey 10
(integer) 1
127.0.0.1:6379> TTL mykey
(integer) 10
```
