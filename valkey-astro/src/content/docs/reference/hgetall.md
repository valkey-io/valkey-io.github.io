---
title: "HGETALL"
description: "HGETALL command reference documentation"
---

Returns all fields and values of the hash stored at `key`.
In the returned value, every field name is followed by its value, so the length
of the reply is twice the size of the hash.

## Examples

```
127.0.0.1:6379> HSET myhash field1 "Hello"
(integer) 1
127.0.0.1:6379> HSET myhash field2 "World"
(integer) 1
127.0.0.1:6379> HGETALL myhash
1) "field1"
2) "Hello"
3) "field2"
4) "World"
```
