---
title: "ZDIFF"
description: "ZDIFF command reference documentation"
---

This command is similar to `ZDIFFSTORE`, but instead of storing the resulting
sorted set, it is returned to the client.

## Examples

```
127.0.0.1:6379> ZADD zset1 1 "one"
(integer) 1
127.0.0.1:6379> ZADD zset1 2 "two"
(integer) 1
127.0.0.1:6379> ZADD zset1 3 "three"
(integer) 1
127.0.0.1:6379> ZADD zset2 1 "one"
(integer) 1
127.0.0.1:6379> ZADD zset2 2 "two"
(integer) 1
127.0.0.1:6379> ZDIFF 2 zset1 zset2
1) "three"
127.0.0.1:6379> ZDIFF 2 zset1 zset2 WITHSCORES
1) "three"
2) "3"
```
