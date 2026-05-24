---
title: "ZREVRANGEBYLEX"
description: "ZREVRANGEBYLEX command reference documentation"
---

When all the elements in a sorted set are inserted with the same score, in order to force lexicographical ordering, this command returns all the elements in the sorted set at `key` with a value between `max` and `min`.

Apart from the reversed ordering, `ZREVRANGEBYLEX` is similar to `ZRANGEBYLEX`.

## Alternative

`ZRANGE` with the `REV` and `BYLEX` arguments.

## Examples

```
127.0.0.1:6379> ZADD myzset 0 a 0 b 0 c 0 d 0 e 0 f 0 g
(integer) 7
127.0.0.1:6379> ZREVRANGEBYLEX myzset [c -
1) "c"
2) "b"
3) "a"
127.0.0.1:6379> ZREVRANGEBYLEX myzset (c -
1) "b"
2) "a"
127.0.0.1:6379> ZREVRANGEBYLEX myzset (g [aaa
1) "f"
2) "e"
3) "d"
4) "c"
5) "b"
```
