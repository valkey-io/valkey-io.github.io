---
title: "LINDEX"
description: "LINDEX command reference documentation"
---

Returns the element at index `index` in the list stored at `key`.
The index is zero-based, so `0` means the first element, `1` the second element
and so on.
Negative indices can be used to designate elements starting at the tail of the
list.
Here, `-1` means the last element, `-2` means the penultimate and so forth.

When the value at `key` is not a list, an error is returned.

## Examples

```
127.0.0.1:6379> LPUSH mylist "World"
(integer) 1
127.0.0.1:6379> LPUSH mylist "Hello"
(integer) 2
127.0.0.1:6379> LINDEX mylist 0
"Hello"
127.0.0.1:6379> LINDEX mylist -1
"World"
127.0.0.1:6379> LINDEX mylist 3
(nil)
```
