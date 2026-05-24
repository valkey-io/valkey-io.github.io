---
title: "DEL"
description: "DEL command reference documentation"
---

Removes the specified keys.
A key is ignored if it does not exist.

## Examples

```
127.0.0.1:6379> SET key1 "Hello"
OK
127.0.0.1:6379> SET key2 "World"
OK
127.0.0.1:6379> DEL key1 key2 key3
(integer) 2
```
