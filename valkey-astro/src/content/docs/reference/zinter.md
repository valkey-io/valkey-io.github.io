---
title: "ZINTER"
description: "ZINTER command reference documentation"
---

This command is similar to `ZINTERSTORE`, but instead of storing the resulting
sorted set, it is returned to the client.

For a description of the `WEIGHTS` and `AGGREGATE` options, see `ZUNIONSTORE`.

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
127.0.0.1:6379> ZINTER 2 zset1 zset2
1) "one"
2) "two"
127.0.0.1:6379> ZINTER 2 zset1 zset2 WITHSCORES
1) "one"
2) "2"
3) "two"
4) "4"
```
