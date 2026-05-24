---
title: "MGET"
description: "MGET command reference documentation"
---

Returns the values of all specified keys.
For every key that does not hold a string value or does not exist, the special
value `nil` is returned.
Because of this, the operation never fails.

## Examples

```
127.0.0.1:6379> SET key1 "Hello"
OK
127.0.0.1:6379> SET key2 "World"
OK
127.0.0.1:6379> MGET key1 key2 nonexisting
1) "Hello"
2) "World"
3) (nil)
```
