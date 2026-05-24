---
title: "SMISMEMBER"
description: "SMISMEMBER command reference documentation"
---

Returns whether each `member` is a member of the set stored at `key`.

For every `member`, `1` is returned if the value is a member of the set, or `0` if the element is not a member of the set or if `key` does not exist.

## Examples

```
127.0.0.1:6379> SADD myset "one"
(integer) 1
127.0.0.1:6379> SADD myset "one"
(integer) 0
127.0.0.1:6379> SMISMEMBER myset "one" "notamember"
1) (integer) 1
2) (integer) 0
```
