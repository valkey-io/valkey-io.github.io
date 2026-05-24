---
title: "BF.RESERVE"
description: "BF.RESERVE command reference documentation"
---

Creates an empty bloom filter with the specified capacity and false positive rate. By default, a scaling filter is created with the default expansion rate.

To specify the scaling / non scaling nature of the bloom filter, use the options: `NONSCALING` or `SCALING <expansion rate>`. It is invalid to provide both options together.

## Reserve fields

* error_rate - The false positive rate of the bloom filter
* capacity -  The number of unique items that would need to be added before a scale out occurs or (non scaling) before it rejects addition of unique items. 
* EXPANSION expansion - This option will specify the bloom filter as scaling and controls the size of the sub filter that will be created upon scale out / expansion of the bloom filter.
* NONSCALING - This option will configure the bloom filter as non scaling; it cannot expand / scale beyond its specified capacity.

## Examples

```
127.0.0.1:6379> BF.RESERVE key 0.01 1000
OK
127.0.0.1:6379> BF.RESERVE key 0.1 1000000
(error) ERR item exists
```
```
127.0.0.1:6379> BF.RESERVE bf_expansion 0.0001 5000 EXPANSION 3
OK
```
```
127.0.0.1:6379> BF.RESERVE bf_nonscaling 0.0001 5000 NONSCALING
OK
```
