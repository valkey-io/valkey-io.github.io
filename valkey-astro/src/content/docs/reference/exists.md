---
title: "EXISTS"
description: "EXISTS command reference documentation"
---

Returns if `key` exists.

The user should be aware that if the same existing key is mentioned in the arguments multiple times, it will be counted multiple times. So if `somekey` exists, `EXISTS somekey somekey` will return 2.

## Examples

```
127.0.0.1:6379> SET key1 "Hello"
OK
127.0.0.1:6379> EXISTS key1
(integer) 1
127.0.0.1:6379> EXISTS nosuchkey
(integer) 0
127.0.0.1:6379> SET key2 "World"
OK
127.0.0.1:6379> EXISTS key1 key2 nosuchkey
(integer) 2
```
