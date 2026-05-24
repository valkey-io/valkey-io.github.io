---
title: "ZLEXCOUNT"
description: "ZLEXCOUNT command reference documentation"
---

When all the elements in a sorted set are inserted with the same score, in order to force lexicographical ordering, this command returns the number of elements in the sorted set at `key` with a value between `min` and `max`.

The `min` and `max` arguments have the same meaning as described for
`ZRANGEBYLEX`.

Note: the command has a complexity of just O(log(N)) because it uses elements ranks (see `ZRANK`) to get an idea of the range. Because of this there is no need to do a work proportional to the size of the range.

## Examples

```
127.0.0.1:6379> ZADD myzset 0 a 0 b 0 c 0 d 0 e
(integer) 5
127.0.0.1:6379> ZADD myzset 0 f 0 g
(integer) 2
127.0.0.1:6379> ZLEXCOUNT myzset - +
(integer) 7
127.0.0.1:6379> ZLEXCOUNT myzset [b [f
(integer) 5
```
