---
title: "ZRANDMEMBER"
description: "ZRANDMEMBER command reference documentation"
---

When called with just the `key` argument, return a random element from the sorted set value stored at `key`.

If the provided `count` argument is positive, return an array of **distinct elements**.
The array's length is either `count` or the sorted set's cardinality (`ZCARD`), whichever is lower.

If called with a negative `count`, the behavior changes and the command is allowed to return the **same element multiple times**.
In this case, the number of returned elements is the absolute value of the specified `count`.

The optional `WITHSCORES` modifier changes the reply so it includes the respective scores of the randomly selected elements from the sorted set.

## Examples

```
127.0.0.1:6379> ZADD dadi 1 uno 2 due 3 tre 4 quattro 5 cinque 6 sei
(integer) 6
127.0.0.1:6379> ZRANDMEMBER dadi
"uno"
127.0.0.1:6379> ZRANDMEMBER dadi
"uno"
127.0.0.1:6379> ZRANDMEMBER dadi -5 WITHSCORES
 1) "cinque"
 2) "5"
 3) "sei"
 4) "6"
 5) "quattro"
 6) "4"
 7) "quattro"
 8) "4"
 9) "sei"
10) "6"
```

## Specification of the behavior when count is passed

When the `count` argument is a positive value this command behaves as follows:

* No repeated elements are returned.
* If `count` is bigger than the cardinality of the sorted set, the command will only return the whole sorted set without additional elements.
* The order of elements in the reply is not truly random, so it is up to the client to shuffle them if needed.

When the `count` is a negative value, the behavior changes as follows:

* Repeating elements are possible.
* Exactly `count` elements, or an empty array if the sorted set is empty (non-existing key), are always returned.
* The order of elements in the reply is truly random.
