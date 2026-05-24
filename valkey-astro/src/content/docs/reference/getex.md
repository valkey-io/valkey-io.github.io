---
title: "GETEX"
description: "GETEX command reference documentation"
---

Get the value of `key` and optionally set its expiration.
`GETEX` is similar to `GET`, but is a write command with additional options.

## Options

The `GETEX` command supports a set of options that modify its behavior:

* `EX` *seconds* -- Set the specified expire time, in seconds.
* `PX` *milliseconds* -- Set the specified expire time, in milliseconds.
* `EXAT` *timestamp-seconds* -- Set the specified Unix time at which the key will expire, in seconds.
* `PXAT` *timestamp-milliseconds* -- Set the specified Unix time at which the key will expire, in milliseconds.
* `PERSIST` -- Remove the time to live associated with the key.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> GETEX mykey
"Hello"
127.0.0.1:6379> TTL mykey
(integer) -1
127.0.0.1:6379> GETEX mykey EX 60
"Hello"
127.0.0.1:6379> TTL mykey
(integer) 60
```
