---
title: "JSON.ARRTRIM"
description: "JSON.ARRTRIM command reference documentation"
---

Trim arrays at the path so that it becomes subarray [start, end], both inclusive.


* If the array is empty, do nothing, return 0.
* If start < 0, treat it as 0.
* If end >= size (size of the array), treat it as size-1.
* If start >= size or start > end, empty the array and return 0.

## Examples

Enhanced path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '[[], ["a"], ["a", "b"], ["a", "b", "c"]]'
OK
127.0.0.1:6379> JSON.ARRTRIM k1 $[*] 0 1
1) (integer) 0
2) (integer) 1
3) (integer) 2
4) (integer) 2
   127.0.0.1:6379> JSON.GET k1
   "[[],[\"a\"],[\"a\",\"b\"],[\"a\",\"b\"]]"
```

Restricted path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"children": ["John", "Jack", "Tom", "Bob", "Mike"]}'
OK
127.0.0.1:6379> JSON.ARRTRIM k1 .children 0 1
(integer) 2
127.0.0.1:6379> JSON.GET k1 .children
"[\"John\",\"Jack\"]"
```
