---
title: "SINTER"
description: "SINTER command reference documentation"
---

Returns the members of the set resulting from the intersection of all the given
sets.

For example:

```
key1 = {a,b,c,d}
key2 = {c}
key3 = {a,c,e}
SINTER key1 key2 key3 = {c}
```

Keys that do not exist are considered to be empty sets.
With one of the keys being an empty set, the resulting set is also empty (since
set intersection with an empty set always results in an empty set).

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
127.0.0.1:6379> SINTER key1 key2
1) "c"
```
