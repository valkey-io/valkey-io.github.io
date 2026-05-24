---
title: "GETBIT"
description: "GETBIT command reference documentation"
---

Returns the bit value at _offset_ in the string value stored at _key_.

When _offset_ is beyond the string length, the string is assumed to be a
contiguous space with 0 bits.
When _key_ does not exist it is assumed to be an empty string, so _offset_ is
always out of range and the value is also assumed to be a contiguous space with
0 bits.

## Examples

```
127.0.0.1:6379> SETBIT mykey 7 1
(integer) 0
127.0.0.1:6379> GETBIT mykey 0
(integer) 0
127.0.0.1:6379> GETBIT mykey 7
(integer) 1
127.0.0.1:6379> GETBIT mykey 100
(integer) 0
```
