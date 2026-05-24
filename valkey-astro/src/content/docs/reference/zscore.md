---
title: "ZSCORE"
description: "ZSCORE command reference documentation"
---

Returns the score of `member` in the sorted set at `key`.

If `member` does not exist in the sorted set, or `key` does not exist, `nil` is
returned.

## Examples

```
127.0.0.1:6379> ZADD myzset 1 "one"
(integer) 1
127.0.0.1:6379> ZSCORE myzset "one"
"1"
```
