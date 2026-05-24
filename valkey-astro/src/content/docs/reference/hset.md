---
title: "HSET"
description: "HSET command reference documentation"
---

Sets the specified fields to their respective values in the hash stored at `key`.

This command overwrites the values of specified fields that exist in the hash.
If `key` doesn't exist, a new key holding a hash is created.

## Examples

```
127.0.0.1:6379> HSET myhash field1 "Hello"
(integer) 1
127.0.0.1:6379> HGET myhash field1
"Hello"
127.0.0.1:6379> HSET myhash field2 "Hi" field3 "World"
(integer) 2
127.0.0.1:6379> HGET myhash field2
"Hi"
127.0.0.1:6379> HGET myhash field3
"World"
127.0.0.1:6379> HGETALL myhash
1) "field1"
2) "Hello"
3) "field2"
4) "Hi"
5) "field3"
6) "World"
```
