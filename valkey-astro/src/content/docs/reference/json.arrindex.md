---
title: "JSON.ARRINDEX"
description: "JSON.ARRINDEX command reference documentation"
---

Search for the first occurrence of a scalar JSON value in the arrays at the path.


* Out of range errors are treated by rounding the index to the array's start and end.
* If start > end, return -1 (not found).

## Examples

Enhanced path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '[[], ["a"], ["a", "b"], ["a", "b", "c"]]'
OK
127.0.0.1:6379> JSON.ARRINDEX k1 $[*] '"b"'
1) (integer) -1
2) (integer) -1
3) (integer) 1
4) (integer) 1
```

Restricted path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"children": ["John", "Jack", "Tom", "Bob", "Mike"]}'
OK
127.0.0.1:6379> JSON.ARRINDEX k1 .children '"Tom"'
(integer) 2
```
