---
title: "GETSET"
description: "GETSET command reference documentation"
---

Atomically sets `key` to `value` and returns the old value stored at `key`.
Returns an error when `key` exists but does not hold a string value.  Any 
previous time to live associated with the key is discarded on successful 
`SET` operation.

## Design pattern

`GETSET` can be used together with `INCR` for counting with atomic reset.
For example: a process may call `INCR` against the key `mycounter` every time
some event occurs, but from time to time we need to get the value of the counter
and reset it to zero atomically.
This can be done using `GETSET mycounter "0"`:

```
127.0.0.1:6379> INCR mycounter
(integer) 1
127.0.0.1:6379> GETSET mycounter "0"
"1"
127.0.0.1:6379> GET mycounter
"0"
```

## Alternative

`SET` with the `GET` argument.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> GETSET mykey "World"
"Hello"
127.0.0.1:6379> GET mykey
"World"
```
