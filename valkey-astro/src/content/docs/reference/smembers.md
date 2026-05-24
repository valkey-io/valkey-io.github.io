---
title: "SMEMBERS"
description: "SMEMBERS command reference documentation"
---

Returns all the members of the set value stored at `key`.

This has the same effect as running `SINTER` with one argument `key`.

## Examples

```
127.0.0.1:6379> SADD myset "Hello"
(integer) 1
127.0.0.1:6379> SADD myset "World"
(integer) 1
127.0.0.1:6379> SMEMBERS myset
1) "Hello"
2) "World"
```
