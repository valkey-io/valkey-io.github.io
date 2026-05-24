---
title: "PEXPIRETIME"
description: "PEXPIRETIME command reference documentation"
---

`PEXPIRETIME` has the same semantic as [`EXPIRETIME`](expiretime.md), but returns the absolute Unix expiration timestamp in milliseconds instead of seconds.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> PEXPIREAT mykey 33177117420000
(integer) 1
127.0.0.1:6379> PEXPIRETIME mykey
(integer) 33177117420000
```
