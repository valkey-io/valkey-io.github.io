---
title: "ZCOUNT"
description: "ZCOUNT command reference documentation"
---

Returns the number of elements in the sorted set at `key` with a score between
`min` and `max`.

The `min` and `max` arguments have the same semantic as described for
`ZRANGEBYSCORE`.

Note: the command has a complexity of just O(log(N)) because it uses elements ranks (see `ZRANK`) to get an idea of the range. Because of this there is no need to do a work proportional to the size of the range.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZCOUNT myzset -inf +inf
(integer) 3
127.0.0.1:6379> ZCOUNT myzset (1 3
(integer) 2
```
