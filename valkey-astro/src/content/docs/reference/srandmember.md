---
title: "SRANDMEMBER"
description: "SRANDMEMBER command reference documentation"
---

When called with just the `key` argument, return a random element from the set value stored at `key`.

If the provided `count` argument is positive, return an array of **distinct elements**.
The array's length is either `count` or the set's cardinality (`SCARD`), whichever is lower.

If called with a negative `count`, the behavior changes and the command is allowed to return the **same element multiple times**.
In this case, the number of returned elements is the absolute value of the specified `count`.

## Examples

```
127.0.0.1:6379> SADD myset one two three
(integer) 3
127.0.0.1:6379> SRANDMEMBER myset
"three"
127.0.0.1:6379> SRANDMEMBER myset 2
1) "one"
2) "three"
127.0.0.1:6379> SRANDMEMBER myset -5
1) "two"
2) "one"
3) "one"
4) "one"
5) "two"
```

## Specification of the behavior when count is passed

When the `count` argument is a positive value this command behaves as follows:

* No repeated elements are returned.
* If `count` is bigger than the set's cardinality, the command will only return the whole set without additional elements.
* The order of elements in the reply is not truly random, so it is up to the client to shuffle them if needed.

When the `count` is a negative value, the behavior changes as follows:

* Repeating elements are possible.
* Exactly `count` elements, or an empty array if the set is empty (non-existing key), are always returned.
* The order of elements in the reply is truly random.