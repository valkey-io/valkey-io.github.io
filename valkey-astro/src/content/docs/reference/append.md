---
title: "APPEND"
description: "APPEND command reference documentation"
---

If `key` already exists and is a string, this command appends the `value` at the
end of the string.
If `key` does not exist it is created and set as an empty string, so `APPEND`
will be similar to `SET` in this special case.

## Examples

```
127.0.0.1:6379> EXISTS mykey
(integer) 0
127.0.0.1:6379> APPEND mykey "Hello"
(integer) 5
127.0.0.1:6379> APPEND mykey " World"
(integer) 11
127.0.0.1:6379> GET mykey
"Hello World"
```

## Pattern: Time series

The `APPEND` command can be used to create a very compact representation of a
list of fixed-size samples, usually referred as _time series_.
Every time a new sample arrives we can store it using the command

```
APPEND timeseries "fixed-size sample"
```

Accessing individual elements in the time series is not hard:

* `STRLEN` can be used in order to obtain the number of samples.
* `GETRANGE` allows for random access of elements.
  If our time series have associated time information we can easily implement
  a binary search to get range combining `GETRANGE` with the Lua scripting
  engine.
* `SETRANGE` can be used to overwrite an existing time series.

The limitation of this pattern is that we are forced into an append-only mode
of operation, there is no way to cut the time series to a given size easily
because Valkey currently lacks a command able to trim string objects.
However the space efficiency of time series stored in this way is remarkable.

Hint: it is possible to switch to a different key based on the current Unix
time, in this way it is possible to have just a relatively small amount of
samples per key, to avoid dealing with very big keys, and to make this pattern
more friendly to be distributed across many Valkey instances.

An example sampling the temperature of a sensor using fixed-size strings (using
a binary format is better in real implementations).

```
127.0.0.1:6379> APPEND ts "0043"
(integer) 4
127.0.0.1:6379> APPEND ts "0035"
(integer) 8
127.0.0.1:6379> GETRANGE ts 0 3
"0043"
127.0.0.1:6379> GETRANGE ts 4 7
"0035"
```
