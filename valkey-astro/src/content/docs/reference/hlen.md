---
title: "HLEN"
description: "HLEN command reference documentation"
---

Returns the number of fields contained in the hash stored at `key`.

## Examples

```
127.0.0.1:6379> HSET myhash field1 "Hello"
(integer) 1
127.0.0.1:6379> HSET myhash field2 "World"
(integer) 1
127.0.0.1:6379> HLEN myhash
(integer) 2
```
