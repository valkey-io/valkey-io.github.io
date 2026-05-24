---
title: "BF.CARD"
description: "BF.CARD command reference documentation"
---

Returns the cardinality of a bloom filter which is the number of items that have been successfully added to it. 

## Examples

```
127.0.0.1:6379> BF.ADD key val
(integer) 1
127.0.0.1:6379> BF.CARD key
(integer) 1
127.0.0.1:6379> BF.CARD nonexistentkey
(integer) 0
```
