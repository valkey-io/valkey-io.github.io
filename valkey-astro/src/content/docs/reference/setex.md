---
title: "SETEX"
description: "SETEX command reference documentation"
---

Set `key` to hold the string `value` and set `key` to timeout after a given
number of seconds.
This command is equivalent to:

```
SET key value EX seconds
```

An error is returned when `seconds` is invalid.

## Alternative

`SET` with the `EX` argument.

## Examples

```
127.0.0.1:6379> SETEX mykey 10 "Hello"
OK
127.0.0.1:6379> TTL mykey
(integer) 10
127.0.0.1:6379> GET mykey
"Hello"
```
## See also

`TTL`