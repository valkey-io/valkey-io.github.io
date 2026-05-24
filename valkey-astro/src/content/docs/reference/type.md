---
title: "TYPE"
description: "TYPE command reference documentation"
---

Returns the string representation of the type of the value stored at `key`.
The different types that can be returned are: `string`, `list`, `set`, `zset`,
`hash` and `stream`.

## Examples

```
127.0.0.1:6379> SET key1 "value"
OK
127.0.0.1:6379> LPUSH key2 "value"
(integer) 1
127.0.0.1:6379> SADD key3 "value"
(integer) 1
127.0.0.1:6379> TYPE key1
string
127.0.0.1:6379> TYPE key2
list
127.0.0.1:6379> TYPE key3
set
```
