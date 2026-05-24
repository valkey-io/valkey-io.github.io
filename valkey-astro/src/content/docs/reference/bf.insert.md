---
title: "BF.INSERT"
description: "BF.INSERT command reference documentation"
---

If the bloom filter does not exist under the specified name, a bloom filter is created with the specified parameters. Default properties will be used if the options below are not specified.

When the `ITEMS` option is provided, all items provided will be attempted to be added.

## Insert Fields

* CAPACITY *capacity* -  The number of unique items that would need to be added before a scale out occurs or (non scaling) before it rejects addition of unique items. 
* ERROR *fp_error* - The false positive rate of the bloom filter.
* EXPANSION *expansion* - This option will specify the bloom filter as scaling and controls the size of the sub filter that will be created upon scale out / expansion of the bloom filter.
* NOCREATE  - Will not create the bloom filter and add items if the filter does not exist already.
* TIGHTENING *tightening_ratio* - The tightening ratio for the bloom filter.
* SEED *seed* - The 32 byte seed the bloom filter's hash functions will use.
* NONSCALING - This option will configure the bloom filter as non scaling; it cannot expand / scale beyond its specified capacity.
* VALIDATESCALETO *validatescaleto* - Validates if the filter can scale out and reach to this capacity based on limits and if not, return an error without creating the bloom filter.
* ITEMS *item* - One or more items to be added to the bloom filter.

Due to the nature of `NONSCALING` and `VALIDATESCALETO` arguments, specifying `NONSCALING` and `VALIDATESCALETO` together is not allowed.

## Examples

```
127.0.0.1:6379> BF.INSERT key ITEMS item1 item2
1) (integer) 1
2) (integer) 1
# This does not update the capacity since the filter already exists. It only adds the provided items.
127.0.0.1:6379> BF.INSERT key CAPACITY 1000 ITEMS item2 item3
1) (integer) 0
2) (integer) 1
127.0.0.1:6379> BF.INSERT key_new CAPACITY 1000
[]
```

```
127.0.0.1:6379> BF.INSERT key NONSCALING VALIDATESCALETO 100
(error) ERR cannot use NONSCALING and VALIDATESCALETO options together
127.0.0.1:6379> BF.INSERT key CAPACITY 1000  VALIDATESCALETO 999999999999999999 ITEMS item2 item3
(error) ERR provided VALIDATESCALETO causes bloom object to exceed memory limit
127.0.0.1:6379> BF.INSERT key VALIDATESCALETO 999999999999999999 EXPANSION 1 ITEMS item2 item3
(error) ERR provided VALIDATESCALETO causes false positive to degrade to 0
```
```
127.0.0.1:6379> BF.INSERT key NOCREATE ITEMS item1 item2
(error) ERR not found
```