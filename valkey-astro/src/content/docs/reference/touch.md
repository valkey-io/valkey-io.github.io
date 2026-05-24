---
title: "TOUCH"
description: "TOUCH command reference documentation"
---

Alters the last access time of a key(s).
A key is ignored if it does not exist.

## Examples

```
127.0.0.1:6379> SET key1 "Hello"
OK
127.0.0.1:6379> SET key2 "World"
OK
127.0.0.1:6379> TOUCH key1 key2
(integer) 2
```
