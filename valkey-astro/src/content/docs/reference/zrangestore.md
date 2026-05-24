---
title: "ZRANGESTORE"
description: "ZRANGESTORE command reference documentation"
---

This command is like `ZRANGE`, but stores the result in the `<dst>` destination key.

## Examples

```
127.0.0.1:6379> ZADD srczset 1 "one" 2 "two" 3 "three" 4 "four"
(integer) 4
127.0.0.1:6379> ZRANGESTORE dstzset srczset 2 -1
(integer) 2
127.0.0.1:6379> ZRANGE dstzset 0 -1
1) "three"
2) "four"
```
