---
title: "LMPOP"
description: "LMPOP command reference documentation"
---

Pops one or more elements from the first non-empty list key from the list of provided key names.

`LMPOP` and [`BLMPOP`](blmpop.md) are similar to the following, more limited, commands:

- [`LPOP`](lpop.md) or [`RPOP`](rpop.md) which take only one key, and can return multiple elements.
- [`BLPOP`](blpop.md) or [`BRPOP`](brpop.md) which take multiple keys, but return only one element from just one key.

See [`BLMPOP`](blmpop.md) for the blocking variant of this command.

Elements are popped from either the left or right of the first non-empty list based on the passed argument.
The number of returned elements is limited to the lower between the non-empty list's length, and the count argument (which defaults to 1).

## Examples

```
127.0.0.1:6379> LMPOP 2 non1 non2 LEFT COUNT 10
(nil)
127.0.0.1:6379> LPUSH mylist "one" "two" "three" "four" "five"
(integer) 5
127.0.0.1:6379> LMPOP 1 mylist LEFT
1) "mylist"
2) 1) "five"
127.0.0.1:6379> LRANGE mylist 0 -1
1) "four"
2) "three"
3) "two"
4) "one"
127.0.0.1:6379> LMPOP 1 mylist RIGHT COUNT 10
1) "mylist"
2) 1) "one"
   2) "two"
   3) "three"
   4) "four"
127.0.0.1:6379> LPUSH mylist "one" "two" "three" "four" "five"
(integer) 5
127.0.0.1:6379> LPUSH mylist2 "a" "b" "c" "d" "e"
(integer) 5
127.0.0.1:6379> LMPOP 2 mylist mylist2 right count 3
1) "mylist"
2) 1) "one"
   2) "two"
   3) "three"
127.0.0.1:6379> LRANGE mylist 0 -1
1) "five"
2) "four"
127.0.0.1:6379> LMPOP 2 mylist mylist2 right count 5
1) "mylist"
2) 1) "four"
   2) "five"
127.0.0.1:6379> LMPOP 2 mylist mylist2 right count 10
1) "mylist2"
2) 1) "a"
   2) "b"
   3) "c"
   4) "d"
   5) "e"
127.0.0.1:6379> EXISTS mylist mylist2
(integer) 0
```
