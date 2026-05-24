---
title: "ZPOPMAX"
description: "ZPOPMAX command reference documentation"
---

Removes and returns up to `count` members with the highest scores in the sorted
set stored at `key`.

When left unspecified, the default value for `count` is 1. Specifying a `count`
value that is higher than the sorted set's cardinality will not produce an
error. When returning multiple elements, the one with the highest score will
be the first, followed by the elements with lower scores.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZADD myzset 2 "two"
(integer) 1
127.0.0.1:6379> ZADD myzset 3 "three"
(integer) 1
127.0.0.1:6379> ZPOPMAX myzset
1) "three"
2) "3"
```
