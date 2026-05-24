---
title: "ZCARD"
description: "ZCARD command reference documentation"
---

Returns the sorted set cardinality (number of elements) of the sorted set stored
at `key`.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZCARD myzset
(integer) 2
```
