---
title: "ZMSCORE"
description: "ZMSCORE command reference documentation"
---

Returns the scores associated with the specified `members` in the sorted set stored at `key`.

For every `member` that does not exist in the sorted set, a `nil` value is returned.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZMSCORE myzset "one" "two" "nofield"
1) "1"
2) "2"
3) (nil)
```
