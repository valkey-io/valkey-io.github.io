---
title: "SPOP"
description: "SPOP command reference documentation"
---

Removes and returns one or more random members from the set value store at `key`.

This operation is similar to `SRANDMEMBER`, that returns one or more random elements from a set but does not remove it.

By default, the command pops a single member from the set. When provided with
the optional `count` argument, the reply will consist of up to `count` members,
depending on the set's cardinality.

## Examples

```
127.0.0.1:6379> SADD myset "one"
(integer) 1
127.0.0.1:6379> SADD myset "two"
(integer) 1
127.0.0.1:6379> SADD myset "three"
(integer) 1
127.0.0.1:6379> SPOP myset
"three"
127.0.0.1:6379> SMEMBERS myset
1) "one"
2) "two"
127.0.0.1:6379> SADD myset "four"
(integer) 1
127.0.0.1:6379> SADD myset "five"
(integer) 1
127.0.0.1:6379> SPOP myset 3
1) "one"
2) "four"
3) "five"
127.0.0.1:6379> SMEMBERS myset
1) "two"
```
## Distribution of returned elements

Note that this command is not suitable when you need a guaranteed uniform distribution of the returned elements. For more information about the algorithms used for `SPOP`, look up both the Knuth sampling and Floyd sampling algorithms.
