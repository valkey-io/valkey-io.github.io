---
title: "RPOP"
description: "RPOP command reference documentation"
---

By default, the command pops a single element from the end of the list.
When provided with the optional `count` argument, the reply will consist of up
to `count` elements, depending on the list's length.
Deletes the list if the last element was popped.

## Examples

```
127.0.0.1:6379> RPUSH mylist "one" "two" "three" "four" "five"
(integer) 5
127.0.0.1:6379> RPOP mylist
"five"
127.0.0.1:6379> RPOP mylist 2
1) "four"
2) "three"
127.0.0.1:6379> LRANGE mylist 0 -1
1) "one"
2) "two"
```
