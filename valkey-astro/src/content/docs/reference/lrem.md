---
title: "LREM"
description: "LREM command reference documentation"
---

Removes the first `count` occurrences of elements equal to `element` from the list
stored at `key`.
The `count` argument influences the operation in the following ways:

* `count > 0`: Remove elements equal to `element` moving from head to tail.
* `count < 0`: Remove elements equal to `element` moving from tail to head.
* `count = 0`: Remove all elements equal to `element`.

For example, `LREM list -2 "hello"` will remove the last two occurrences of
`"hello"` in the list stored at `list`.

Note that non-existing keys are treated like empty lists, so when `key` does not
exist, the command will always return `0`.

## Examples

```
127.0.0.1:6379> RPUSH mylist "hello"
(integer) 1
127.0.0.1:6379> RPUSH mylist "hello"
(integer) 2
127.0.0.1:6379> RPUSH mylist "foo"
(integer) 3
127.0.0.1:6379> RPUSH mylist "hello"
(integer) 4
127.0.0.1:6379> LREM mylist -2 "hello"
(integer) 2
127.0.0.1:6379> LRANGE mylist 0 -1
1) "hello"
2) "foo"
```
