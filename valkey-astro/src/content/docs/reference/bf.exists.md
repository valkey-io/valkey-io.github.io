---
title: "BF.EXISTS"
description: "BF.EXISTS command reference documentation"
---

Determines if an item has been added to the bloom filter previously. 

A bloom filter has two possible responses when you check if an item exists:

* 0 - The item definitely does not exist since with bloom filters, false negatives are not possible.

* 1 - The item exists with a given false positive (`fp`) percentage. There is an `fp` rate % chance that the item does not exist. You can create bloom filters with a more strict false positive rate as needed.

## Examples

```
127.0.0.1:6379> BF.ADD key val
(integer) 1
127.0.0.1:6379> BF.EXISTS key val
(integer) 1
127.0.0.1:6379> BF.EXISTS key nonexistent
(integer) 0
```
