---
title: "SADD"
description: "SADD command reference documentation"
---

Add the specified members to the set stored at `key`.
Specified members that are already a member of this set are ignored.
If `key` does not exist, a new set is created before adding the specified
members.

An error is returned when the value stored at `key` is not a set.

## Examples

```
127.0.0.1:6379> SADD myset "Hello"
(integer) 1
127.0.0.1:6379> SADD myset "World"
(integer) 1
127.0.0.1:6379> SADD myset "World"
(integer) 0
127.0.0.1:6379> SMEMBERS myset
1) "Hello"
2) "World"
```
