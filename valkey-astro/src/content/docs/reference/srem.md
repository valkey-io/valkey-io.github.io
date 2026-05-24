---
title: "SREM"
description: "SREM command reference documentation"
---

Remove the specified members from the set stored at `key`.
Specified members that are not a member of this set are ignored.
If `key` does not exist, it is treated as an empty set and this command returns
`0`.

An error is returned when the value stored at `key` is not a set.

## Examples

```
127.0.0.1:6379> SADD myset "one"
(integer) 1
127.0.0.1:6379> SADD myset "two"
(integer) 1
127.0.0.1:6379> SADD myset "three"
(integer) 1
127.0.0.1:6379> SREM myset "one"
(integer) 1
127.0.0.1:6379> SREM myset "four"
(integer) 0
127.0.0.1:6379> SMEMBERS myset
1) "two"
2) "three"
```
