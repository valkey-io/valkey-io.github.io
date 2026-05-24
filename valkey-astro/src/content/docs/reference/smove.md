---
title: "SMOVE"
description: "SMOVE command reference documentation"
---

Move `member` from the set at `source` to the set at `destination`.
This operation is atomic.
In every given moment the element will appear to be a member of `source` **or**
`destination` for other clients.

If the source set does not exist or does not contain the specified element, no
operation is performed and `0` is returned.
Otherwise, the element is removed from the source set and added to the
destination set.
When the specified element already exists in the destination set, it is only
removed from the source set.

An error is returned if `source` or `destination` does not hold a set value.

## Examples

```
127.0.0.1:6379> SADD myset "one"
(integer) 1
127.0.0.1:6379> SADD myset "two"
(integer) 1
127.0.0.1:6379> SADD myotherset "three"
(integer) 1
127.0.0.1:6379> SMOVE myset myotherset "two"
(integer) 1
127.0.0.1:6379> SMEMBERS myset
1) "one"
127.0.0.1:6379> SMEMBERS myotherset
1) "three"
2) "two"
```
