---
title: "ZREM"
description: "ZREM command reference documentation"
---

Removes the specified members from the sorted set stored at `key`.
Non existing members are ignored.

An error is returned when `key` exists and does not hold a sorted set.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZREM myzset "two"
(integer) 1
127.0.0.1:6379> ZRANGE myzset 0 -1 WITHSCORES
1) "one"
2) "1"
3) "three"
4) "3"
```
