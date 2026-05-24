---
title: "LSET"
description: "LSET command reference documentation"
---

Sets the list element at `index` to `element`.
For more information on the `index` argument, see [`LINDEX`](lindex.md).

An error is returned for out of range indexes.

## Examples

```
127.0.0.1:6379> RPUSH mylist "one"
(integer) 1
127.0.0.1:6379> RPUSH mylist "two"
(integer) 2
127.0.0.1:6379> RPUSH mylist "three"
(integer) 3
127.0.0.1:6379> LSET mylist 0 "four"
OK
127.0.0.1:6379> LSET mylist -2 "five"
OK
127.0.0.1:6379> LRANGE mylist 0 -1
1) "four"
2) "five"
3) "three"
```
