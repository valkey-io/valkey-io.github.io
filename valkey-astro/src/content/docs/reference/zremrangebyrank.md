---
title: "ZREMRANGEBYRANK"
description: "ZREMRANGEBYRANK command reference documentation"
---

Removes all elements in the sorted set stored at `key` with rank between `start`
and `stop`.
Both `start` and `stop` are `0` -based indexes with `0` being the element with
the lowest score.
These indexes can be negative numbers, where they indicate offsets starting at
the element with the highest score.
For example: `-1` is the element with the highest score, `-2` the element with
the second highest score and so forth.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZREMRANGEBYRANK myzset 0 1
(integer) 2
127.0.0.1:6379> ZRANGE myzset 0 -1 WITHSCORES
1) "three"
2) "3"
```
