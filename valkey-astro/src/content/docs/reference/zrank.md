---
title: "ZRANK"
description: "ZRANK command reference documentation"
---

Returns the rank of `member` in the sorted set stored at `key`, with the scores
ordered from low to high.
The rank (or index) is 0-based, which means that the member with the lowest
score has rank `0`.

The optional `WITHSCORE` argument supplements the command's reply with the score of the element returned.

Use `ZREVRANK` to get the rank of an element with the scores ordered from high
to low.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZRANK myzset "three"
(integer) 2
127.0.0.1:6379> ZRANK myzset "four"
(nil)
127.0.0.1:6379> ZRANK myzset "three" WITHSCORE
1) (integer) 2
2) "3"
127.0.0.1:6379> ZRANK myzset "four" WITHSCORE
(nil)
```
