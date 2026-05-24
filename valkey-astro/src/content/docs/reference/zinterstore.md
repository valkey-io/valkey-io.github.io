---
title: "ZINTERSTORE"
description: "ZINTERSTORE command reference documentation"
---

Computes the intersection of `numkeys` sorted sets given by the specified keys,
and stores the result in `destination`.
It is mandatory to provide the number of input keys (`numkeys`) before passing
the input keys and the other (optional) arguments.

By default, the resulting score of an element is the sum of its scores in the
sorted sets where it exists.
Because intersection requires an element to be a member of every given sorted
set, this results in the score of every element in the resulting sorted set to
be equal to the number of input sorted sets.

For a description of the `WEIGHTS` and `AGGREGATE` options, see `ZUNIONSTORE`.

If `destination` already exists, it is overwritten.

## Examples

```
127.0.0.1:6379> ZADD zset1 1 "one"
(integer) 1
127.0.0.1:6379> ZADD zset1 2 "two"
(integer) 1
127.0.0.1:6379> ZADD zset2 1 "one"
(integer) 1
127.0.0.1:6379> ZADD zset2 2 "two"
(integer) 1
127.0.0.1:6379> ZADD zset2 3 "three"
(integer) 1
127.0.0.1:6379> ZINTERSTORE out 2 zset1 zset2 WEIGHTS 2 3
(integer) 2
127.0.0.1:6379> ZRANGE out 0 -1 WITHSCORES
1) "one"
2) "5"
3) "two"
4) "10"
```
