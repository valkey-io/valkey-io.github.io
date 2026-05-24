---
title: "SET"
description: "SET command reference documentation"
---

Set `key` to hold the string `value`.
If `key` already holds a value, it is overwritten, regardless of its type.
Any previous time to live associated with the key is discarded on successful `SET` operation.

## Options

The `SET` command supports a set of options that modify its behavior:

* `EX` *seconds* -- Set the specified expire time, in seconds (a positive integer).
* `PX` *milliseconds* -- Set the specified expire time, in milliseconds (a positive integer).
* `EXAT` *timestamp-seconds* -- Set the specified Unix time at which the key will expire, in seconds (a positive integer).
* `PXAT` *timestamp-milliseconds* -- Set the specified Unix time at which the key will expire, in milliseconds (a positive integer).
* `NX` -- Only set the key if it does not already exist.
* `XX` -- Only set the key if it already exists.
* `IFEQ` *comparison-value* -- Set the key if the comparison value matches the existing value. An error is returned and `SET` aborted if the value stored at key is not a string.
* `KEEPTTL` -- Retain the time to live associated with the key.
* `GET` -- Return the old string stored at key, or nil if key did not exist. An error is returned and `SET` aborted if the value stored at key is not a string.

Note: Since the `SET` command options can replace `SETNX`, `SETEX`, `PSETEX`, `GETSET`, it is possible that in future versions of Valkey these commands will be deprecated and finally removed.

## Examples

Basic usage
```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> GET mykey
"Hello"
```

Set a value and an expiry time.
```
127.0.0.1:6379> SET anotherkey "will expire in a minute" EX 60
OK
```

Conditionally set a value.
```
127.0.0.1:6379> SET foo "Initial Value"
OK
127.0.0.1:6379> GET foo
"Initial Value"
127.0.0.1:6379> SET foo "New Value" IFEQ "Initial Value"
OK
127.0.0.1:6379> GET foo
"New Value"
```

## Patterns

**Note:** The following pattern is discouraged in favor of [the Redlock algorithm](../topics/distlock.md) which is only a bit more complex to implement, but offers better guarantees and is fault tolerant.

The command `SET resource-name anystring NX EX max-lock-time` is a simple way to implement a locking system with Valkey.

A client can acquire the lock if the above command returns `OK` (or retry after some time if the command returns Nil), and remove the lock just using `DEL`.

The lock will be auto-released after the expire time is reached.

It is possible to make this system more robust modifying the unlock schema as follows:

* Instead of setting a fixed string, set a non-guessable large random string, called token.
* Instead of releasing the lock with `DEL`, send a script that only removes the key if the value matches.

This avoids that a client will try to release the lock after the expire time deleting the key created by another client that acquired the lock later.

An example of unlock script would be similar to the following:

    if server.call("get",KEYS[1]) == ARGV[1]
    then
        return server.call("del",KEYS[1])
    else
        return 0
    end

The script should be called with `EVAL ...script... 1 resource-name token-value`

## See also

* [`DELIFEQ`](delifeq.md) - Deletes the key if its value matches the given string.
