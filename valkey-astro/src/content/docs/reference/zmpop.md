---
title: "ZMPOP"
description: "ZMPOP command reference documentation"
---

Pops one or more elements, that are member-score pairs, from the first non-empty sorted set in the provided list of key names.

`ZMPOP` and `BZMPOP` are similar to the following, more limited, commands:

- `ZPOPMIN` or `ZPOPMAX` which take only one key, and can return multiple elements.
- `BZPOPMIN` or `BZPOPMAX` which take multiple keys, but return only one element from just one key.

See `BZMPOP` for the blocking variant of this command.

When the `MIN` modifier is used, the elements popped are those with the lowest scores from the first non-empty sorted set. The `MAX` modifier causes elements with the highest scores to be popped.
The optional `COUNT` can be used to specify the number of elements to pop, and is set to 1 by default.

The number of popped elements is the minimum from the sorted set's cardinality and `COUNT`'s value.

## Examples

```
127.0.0.1:6379> ZMPOP 1 notsuchkey MIN
(nil)
127.0.0.1:6379> ZADD myzset 1 "one" 2 "two" 3 "three"
(integer) 3
127.0.0.1:6379> ZMPOP 1 myzset MIN
1) "myzset"
2) 1) 1) "one"
      2) "1"
127.0.0.1:6379> ZRANGE myzset 0 -1 WITHSCORES
1) "two"
2) "2"
3) "three"
4) "3"
127.0.0.1:6379> ZMPOP 1 myzset MAX COUNT 10
1) "myzset"
2) 1) 1) "three"
      2) "3"
   2) 1) "two"
      2) "2"
127.0.0.1:6379> ZADD myzset2 4 "four" 5 "five" 6 "six"
(integer) 3
127.0.0.1:6379> ZMPOP 2 myzset myzset2 MIN COUNT 10
1) "myzset2"
2) 1) 1) "four"
      2) "4"
   2) 1) "five"
      2) "5"
   3) 1) "six"
      2) "6"
127.0.0.1:6379> ZRANGE myzset 0 -1 WITHSCORES
(empty array)
127.0.0.1:6379> ZMPOP 2 myzset myzset2 MAX COUNT 10
(nil)
127.0.0.1:6379> ZRANGE myzset2 0 -1 WITHSCORES
(empty array)
127.0.0.1:6379> EXISTS myzset myzset2
(integer) 0
```
