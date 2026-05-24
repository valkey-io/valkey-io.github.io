---
title: "SDIFFSTORE"
description: "SDIFFSTORE command reference documentation"
---

This command is equal to `SDIFF`, but instead of returning the resulting set, it
is stored in `destination`.

If `destination` already exists, it is overwritten.

## Examples

```
127.0.0.1:6379> SADD key1 "a"
(integer) 1
127.0.0.1:6379> SADD key1 "b"
(integer) 1
127.0.0.1:6379> SADD key1 "c"
(integer) 1
127.0.0.1:6379> SADD key2 "c"
(integer) 1
127.0.0.1:6379> SADD key2 "d"
(integer) 1
127.0.0.1:6379> SADD key2 "e"
(integer) 1
127.0.0.1:6379> SDIFFSTORE key key1 key2
(integer) 2
127.0.0.1:6379> SMEMBERS key
1) "a"
2) "b"
```
