---
title: "BF.MEXISTS"
description: "BF.MEXISTS command reference documentation"
---

Determines if the provided item/s have been added to a bloom filter previously.

A Bloom filter has two possible responses when you check if an item exists:

* 0 - The item definitely does not exist since with bloom filters, false negatives are not possible.

* 1 - The item exists with a given false positive (`fp`) percentage. There is an `fp` rate % chance that the item does not exist. You can create bloom filters with a more strict false positive rate as needed.

## Examples

```
127.0.0.1:6379> BF.MADD key item1 item2
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> BF.MEXISTS key item1 item2 item3
1) (integer) 1
2) (integer) 1
3) (integer) 0
127.0.0.1:6379> BF.MEXISTS key item1
1) (integer) 1
```