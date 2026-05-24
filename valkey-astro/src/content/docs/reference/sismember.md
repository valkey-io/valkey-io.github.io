---
title: "SISMEMBER"
description: "SISMEMBER command reference documentation"
---

Returns if `member` is a member of the set stored at `key`.

## Examples

```
127.0.0.1:6379> SADD myset "one"
(integer) 1
127.0.0.1:6379> SISMEMBER myset "one"
(integer) 1
127.0.0.1:6379> SISMEMBER myset "two"
(integer) 0
```
