---
title: "LPUSHX"
description: "LPUSHX command reference documentation"
---

Inserts specified values at the head of the list stored at `key`, only if `key`
already exists and holds a list.
In contrary to [`LPUSH`](lpush.md), no operation will be performed when `key` does not yet
exist.

## Examples

```
127.0.0.1:6379> LPUSH mylist "World"
(integer) 1
127.0.0.1:6379> LPUSHX mylist "Hello"
(integer) 2
127.0.0.1:6379> LPUSHX myotherlist "Hello"
(integer) 0
127.0.0.1:6379> LRANGE mylist 0 -1
1) "Hello"
2) "World"
127.0.0.1:6379> LRANGE myotherlist 0 -1
(empty array)
```
