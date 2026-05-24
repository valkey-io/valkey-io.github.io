---
title: "SUNION"
description: "SUNION command reference documentation"
---

Returns the members of the set resulting from the union of all the given sets.

For example:

```
key1 = {a,b,c,d}
key2 = {c}
key3 = {a,c,e}
SUNION key1 key2 key3 = {a,b,c,d,e}
```

Keys that do not exist are considered to be empty sets.

## Examples

```
127.0.0.1:6379> SADD key1 "a"
(integer) 1
127.0.0.1:6379> SADD key1 "b"
(integer) 1
127.0.0.1:6379> SADD key1 "c"
(integer) 1
127.0.0.1:6379> SADD key2 "c"
(integer) 1
127.0.0.1:6379> SADD key2 "d"
(integer) 1
127.0.0.1:6379> SADD key2 "e"
(integer) 1
127.0.0.1:6379> SUNION key1 key2
1) "a"
2) "b"
3) "c"
4) "d"
5) "e"
```
