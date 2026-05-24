---
title: "DELIFEQ"
description: "DELIFEQ command reference documentation"
---

Deletes the key if its value matches the given string.

This command is typically used to safely release locks in distributed systems, ensuring that only the owner of the lock (as identified by the value) can delete it.

If the key exists and the stored value is a string that exactly matches the provided value, the key is removed and `1` is returned. Otherwise, the key is left unchanged and `0` is returned.

## Examples

Basic usage:

```
127.0.0.1:6379> SET mykey abc123
OK
127.0.0.1:6379> DELIFEQ mykey abc123
(integer) 1
127.0.0.1:6379> DELIFEQ mykey abc123
(integer) 0
```

Wrong value:

```
127.0.0.1:6379> SET mykey xyz789
OK
127.0.0.1:6379> DELIFEQ mykey abc123
(integer) 0
```

Wrong type:

```
127.0.0.1:6379> SADD mykey somevalue
(integer) 1
127.0.0.1:6379> DELIFEQ mykey somevalue
(error) WRONGTYPE Operation against a key holding the wrong kind of value
```

## Use case: Safe lock release

`DELIFEQ` enables an atomic check-and-delete operation to safely release a lock only if the process still holds it. This avoids race conditions where a lock might expire and be claimed by another process before the original owner tries to delete it.

This pattern is commonly used as part of distributed locking systems like [Redlock](../topics/distlock.md), which previously relied on Lua scripting to implement this logic. With `DELIFEQ`, such a use case becomes more robust and idiomatic.

Instead of:

```
EVAL "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 mykey abc123
```

You can now use:

```
DELIFEQ mykey abc123
```

## See also

* [`SET IFEQ`](set.md) - Sets the key only if it matches the given value.
