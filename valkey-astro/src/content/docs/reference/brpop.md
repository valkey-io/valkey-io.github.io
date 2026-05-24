---
title: "BRPOP"
description: "BRPOP command reference documentation"
---

`BRPOP` is a blocking list pop primitive.
It is the blocking version of [`RPOP`](rpop.md) because it blocks the connection when there
are no elements to pop from any of the given lists.
An element is popped from the tail of the first list that is non-empty, with the
given keys being checked in the order that they are given.

See the [BLPOP documentation][cb] for the exact semantics, since `BRPOP` is
identical to `BLPOP` with the only difference being that it pops elements from
the tail of a list instead of popping from the head.

[cb]: blpop.md

## Examples

```
127.0.0.1:6379> DEL list1 list2
(integer) 0
127.0.0.1:6379> RPUSH list1 a b c
(integer) 3
127.0.0.1:6379> BRPOP list1 list2 0
1) "list1"
2) "c"
```
