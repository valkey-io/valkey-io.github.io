---
title: "ZREVRANGEBYSCORE"
description: "ZREVRANGEBYSCORE command reference documentation"
---

Returns all the elements in the sorted set at `key` with a score between `max`
and `min` (including elements with score equal to `max` or `min`).
In contrary to the default ordering of sorted sets, for this command the
elements are considered to be ordered from high to low scores.

The elements having the same score are returned in reverse lexicographical
order.

Apart from the reversed ordering, `ZREVRANGEBYSCORE` is similar to
`ZRANGEBYSCORE`.

## Alternative

`ZRANGE` with the `REV` and `BYSCORE` arguments.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZREVRANGEBYSCORE myzset +inf -inf
1) "three"
2) "two"
3) "one"
127.0.0.1:6379> ZREVRANGEBYSCORE myzset 2 1
1) "two"
2) "one"
127.0.0.1:6379> ZREVRANGEBYSCORE myzset 2 (1
1) "two"
127.0.0.1:6379> ZREVRANGEBYSCORE myzset (2 (1
(empty array)
```
