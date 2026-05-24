---
title: "RPUSH"
description: "RPUSH command reference documentation"
---

Insert all the specified values at the tail of the list stored at `key`.
If `key` does not exist, it is created as empty list before performing the push
operation.
When `key` holds a value that is not a list, an error is returned.

It is possible to push multiple elements using a single command call just
specifying multiple arguments at the end of the command.
Elements are inserted one after the other to the tail of the list, from the
leftmost element to the rightmost element.
So for instance the command `RPUSH mylist a b c` will result into a list
containing `a` as first element, `b` as second element and `c` as third element.

## Examples

```
127.0.0.1:6379> RPUSH mylist "hello"
(integer) 1
127.0.0.1:6379> RPUSH mylist "world"
(integer) 2
127.0.0.1:6379> LRANGE mylist 0 -1
1) "hello"
2) "world"
```
