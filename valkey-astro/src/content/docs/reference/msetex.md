---
title: "MSETEX"
description: "MSETEX command reference documentation"
---

`MSETEX` is a combination of `MSET` and `EXPIRE`.
It allows setting multiple key-value pairs while also assigning a shared expiration time to all the keys atomically.

This command is designed to improve efficiency by avoiding multiple network round-trips that would be required when using separate `MSET` and `EXPIRE` commands.

`MSETEX` is atomic, so all given keys are set at once with the specified expiration.
It is not possible for clients to see that some of the keys were updated while others are unchanged.

## Options

The `MSETEX` command supports a set of options similar to the `SET` command:

* `EX` *seconds* -- Set the specified expire time, in seconds (a positive integer).
* `PX` *milliseconds* -- Set the specified expire time, in milliseconds (a positive integer).
* `EXAT` *timestamp-seconds* -- Set the specified Unix time at which the keys will expire, in seconds (a positive integer).
* `PXAT` *timestamp-milliseconds* -- Set the specified Unix time at which the keys will expire, in milliseconds (a positive integer).
* `NX` -- Only set the keys if **all** of them do not already exist.
* `XX` -- Only set the keys if **all** of them already exist.
* `KEEPTTL` -- Retain the time to live associated with the keys.

Note: The `EX`, `PX`, `EXAT`, `PXAT`, `KEEPTTL` options are mutually exclusive.
The `NX` and `XX` options are also mutually exclusive.

## Examples

```
127.0.0.1:6379> MSETEX 2 key1 "Hello" key2 "World" EX 10
(integer) 1
127.0.0.1:6379> GET key1
"Hello"
127.0.0.1:6379> TTL key1
(integer) 10
127.0.0.1:6379> GET key2
"World"
127.0.0.1:6379> TTL key2
(integer) 10
```

Using the `NX` option (only set if all keys don't exist):

```
127.0.0.1:6379> MSETEX 2 key1 "Hello" key2 "World" NX EX 10
(integer) 1
127.0.0.1:6379> MSETEX 2 key1 "New" key3 "Value" NX EX 10
(integer) 0
127.0.0.1:6379> GET key1
"Hello"
127.0.0.1:6379> GET key3
(nil)
```

Using the `XX` option (only set if all keys exist):

```
127.0.0.1:6379> SET existing "value"
OK
127.0.0.1:6379> MSETEX 2 existing "updated" newkey "value" XX EX 10
(integer) 0
127.0.0.1:6379> MSETEX 1 existing "updated" XX EX 10
(integer) 1
127.0.0.1:6379> GET existing
"updated"
```
