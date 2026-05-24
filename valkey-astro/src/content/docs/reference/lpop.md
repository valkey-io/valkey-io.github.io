---
title: "LPOP"
description: "LPOP command reference documentation"
---

By default, the command pops a single element from the beginning of the list.
When provided with the optional `count` argument, the reply will consist of up
to `count` elements, depending on the list's length.
Deletes the list if the last element was popped.

## Examples

```
127.0.0.1:6379> RPUSH mylist "one" "two" "three" "four" "five"
(integer) 5
127.0.0.1:6379> LPOP mylist
"one"
127.0.0.1:6379> LPOP mylist 2
1) "two"
2) "three"
127.0.0.1:6379> LRANGE mylist 0 -1
1) "four"
2) "five"
```
