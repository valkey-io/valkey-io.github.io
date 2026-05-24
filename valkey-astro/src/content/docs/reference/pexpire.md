---
title: "PEXPIRE"
description: "PEXPIRE command reference documentation"
---

This command works exactly like [`EXPIRE`](expire.md) but the time to live of the key is
specified in milliseconds instead of seconds.

## Options

The `PEXPIRE` command supports a set of options

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
127.0.0.1:6379> PEXPIRE mykey 1500
(integer) 1
127.0.0.1:6379> TTL mykey
(integer) 1
127.0.0.1:6379> PTTL mykey
(integer) 1480
127.0.0.1:6379> PEXPIRE mykey 1000 XX
(integer) 1
127.0.0.1:6379> TTL mykey
(integer) 1
127.0.0.1:6379> PEXPIRE mykey 1000 NX
(integer) 0
127.0.0.1:6379> TTL mykey
(integer) 1
```
