---
title: "HSETEX"
description: "HSETEX command reference documentation"
---

The `HSETEX` command allows setting the value of one or more fields of a given hash key, and optionally manipulating their expiration time.
The command will return 1 in case all provided fields have been set or 0 in case `FNX` or `FXX` were provided and none of the specified fields were set.
Without providing any optional flags, this command behaves exactly like a normal [`HSET`](hset.md) command.

## Options

The `HSETEX` command supports a set of options that modify its behavior:

* FNX — Only set the fields if none of them already exist.
* FXX — Only set the fields if all of them already exist.
* EX seconds — Set the specified expiration time in seconds.
* PX milliseconds — Set the specified expiration time in milliseconds.
* EXAT `unix-time-seconds` — Set the specified Unix time in seconds for when the fields will expire.
* PXAT `unix-time-milliseconds` — Set the specified Unix time in milliseconds at which the fields will expire.
* KEEPTTL — Retain the TTL associated with the fields.

Note for the following:

1. The EX, PX, EXAT, PXAT, and KEEPTTL options are mutually exclusive.
2. Setting a value on a volatile hash field (A field which has an assigned expiration time) will remove the expiration for that field.
3. Providing '0' expiration TTL via `EX` or `PX` optional arguments will result in the specified fields immediately expiring and being removed from the hash.
4. Providing past expiration time via `EXAT` or `PXAT` optional arguments will result in the specified fields immediately expiring and being removed from the hash.

## Examples

Add 3 new items without expiration time to a 'myhash'
```
127.0.0.1:6379> HSETEX myhash FIELDS 3 f1 v1 f2 v2 f3 v3
(integer) 1
```

Unsuccessful attempt setting expiration time on EXISTING fields
```
127.0.0.1:6379> HSETEX myhash FNX EX 10 FIELDS 2 f2 v2 f3 v3
(integer) 0
```

Successful attempt setting expiration time on EXISTING fields
```
127.0.0.1:6379> HSETEX myhash FXX EX 10 FIELDS 2 f2 v2 f3 v3
(integer) 1
```

Verify hash fields expiration time:
```
127.0.0.1:6379> HTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) 8
3) (integer) 8
```

Override all hash items will also persist the fields
```
127.0.0.1:6379> HSETEX myhash FIELDS 3 f1 v1 f2 v2 f3 v3
(integer) 1
127.0.0.1:6379> HTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) -1
3) (integer) -1
```

Setting expiration time in the past will remove all the elements in the hash:
```
127.0.0.1:6379> HSETEX EX 0 myhash FIELDS 3 f1 v1 f2 v2 f3 v3
(integer) 1
127.0.0.1:6379> HTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -2
2) (integer) -2
3) (integer) -2
127.0.0.1:6379> HLEN myhash
(integer) 0
127.0.0.1:6379> EXISTS myhash
(integer) 0
```
