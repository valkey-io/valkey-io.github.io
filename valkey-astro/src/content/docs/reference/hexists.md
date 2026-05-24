---
title: "HEXISTS"
description: "HEXISTS command reference documentation"
---

Returns if `field` is an existing field in the hash stored at `key`.

## Examples

```
127.0.0.1:6379> HSET myhash field1 "foo"
(integer) 1
127.0.0.1:6379> HEXISTS myhash field1
(integer) 1
127.0.0.1:6379> HEXISTS myhash field2
(integer) 0
```
