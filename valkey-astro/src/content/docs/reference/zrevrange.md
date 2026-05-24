---
title: "ZREVRANGE"
description: "ZREVRANGE command reference documentation"
---

Returns the specified range of elements in the sorted set stored at `key`.
The elements are considered to be ordered from the highest to the lowest score.
Descending lexicographical order is used for elements with equal score.

Apart from the reversed ordering, `ZREVRANGE` is similar to `ZRANGE`.

## Alternative

`ZRANGE` with the `REV` argument.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZREVRANGE myzset 0 -1
1) "three"
2) "two"
3) "one"
127.0.0.1:6379> ZREVRANGE myzset 2 3
1) "one"
127.0.0.1:6379> ZREVRANGE myzset -2 -1
1) "two"
2) "one"
```
