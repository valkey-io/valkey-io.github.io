---
title: "LLEN"
description: "LLEN command reference documentation"
---

Returns the length of the list stored at `key`.
If `key` does not exist, it is interpreted as an empty list and `0` is returned.
An error is returned when the value stored at `key` is not a list.

## Examples

```
127.0.0.1:6379> LPUSH mylist "World"
(integer) 1
127.0.0.1:6379> LPUSH mylist "Hello"
(integer) 2
127.0.0.1:6379> LLEN mylist
(integer) 2
```
