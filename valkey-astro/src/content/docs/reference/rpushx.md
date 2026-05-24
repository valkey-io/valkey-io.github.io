---
title: "RPUSHX"
description: "RPUSHX command reference documentation"
---

Inserts specified values at the tail of the list stored at `key`, only if `key`
already exists and holds a list.
In contrary to [`RPUSH`](rpush.md), no operation will be performed when `key` does not yet
exist.

## Examples

```
127.0.0.1:6379> RPUSH mylist "Hello"
(integer) 1
127.0.0.1:6379> RPUSHX mylist "World"
(integer) 2
127.0.0.1:6379> RPUSHX myotherlist "World"
(integer) 0
127.0.0.1:6379> LRANGE mylist 0 -1
1) "Hello"
2) "World"
127.0.0.1:6379> LRANGE myotherlist 0 -1
(empty array)
```
