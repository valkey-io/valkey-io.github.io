---
title: "SCARD"
description: "SCARD command reference documentation"
---

Returns the set cardinality (number of elements) of the set stored at `key`.

## Examples

```
127.0.0.1:6379> SADD myset "Hello"
(integer) 1
127.0.0.1:6379> SADD myset "World"
(integer) 1
127.0.0.1:6379> SCARD myset
(integer) 2
```
