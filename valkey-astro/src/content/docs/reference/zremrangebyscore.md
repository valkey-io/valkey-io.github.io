---
title: "ZREMRANGEBYSCORE"
description: "ZREMRANGEBYSCORE command reference documentation"
---

Removes all elements in the sorted set stored at `key` with a score between
`min` and `max` (inclusive).

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZREMRANGEBYSCORE myzset -inf (2
(integer) 1
127.0.0.1:6379> ZRANGE myzset 0 -1 WITHSCORES
1) "two"
2) "2"
3) "three"
4) "3"
```
