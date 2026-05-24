---
title: "ZINCRBY"
description: "ZINCRBY command reference documentation"
---

Increments the score of `member` in the sorted set stored at `key` by
`increment`.
If `member` does not exist in the sorted set, it is added with `increment` as
its score (as if its previous score was `0.0`).
If `key` does not exist, a new sorted set with the specified `member` as its
sole member is created.

An error is returned when `key` exists but does not hold a sorted set.

The `score` value should be the string representation of a numeric value, and
accepts double precision floating point numbers.
It is possible to provide a negative value to decrement the score.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZINCRBY myzset 2 "one"
"3"
127.0.0.1:6379> ZRANGE myzset 0 -1 WITHSCORES
1) "two"
2) "2"
3) "one"
4) "3"
```
