---
title: "PSETEX"
description: "PSETEX command reference documentation"
---

`PSETEX` works exactly like `SETEX` with the sole difference that the expire
time is specified in milliseconds instead of seconds.

## Alternative

`SET` with the `PX` argument.

## Examples

```
127.0.0.1:6379> PSETEX mykey 1000 "Hello"
OK
127.0.0.1:6379> PTTL mykey
(integer) 990
127.0.0.1:6379> GET mykey
"Hello"
```
