---
title: "PEXPIREAT"
description: "PEXPIREAT command reference documentation"
---

`PEXPIREAT` has the same effect and semantic as [`EXPIREAT`](expireat.md), but the Unix time at
which the key will expire is specified in milliseconds instead of seconds.

## Options

The `PEXPIREAT` command supports a set of options since Redis OSS 7.0:

* `NX` -- Set expiry only when the key has no expiry
* `XX` -- Set expiry only when the key has an existing expiry
* `GT` -- Set expiry only when the new expiry is greater than current one
* `LT` -- Set expiry only when the new expiry is less than current one

A non-volatile key is treated as an infinite TTL for the purpose of `GT` and `LT`.
The `GT`, `LT` and `NX` options are mutually exclusive.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> PEXPIREAT mykey 1555555555005
(integer) 1
127.0.0.1:6379> TTL mykey
(integer) -2
127.0.0.1:6379> PTTL mykey
(integer) -2
```
