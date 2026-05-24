---
title: "BF.INFO"
description: "BF.INFO command reference documentation"
---

Returns usage information and properties of a specific bloom filter.

## Info Fields

* CAPACITY - The number of unique items that would need to be added before a scale out occurs or (non scaling) before it rejects addition of unique items. 
* SIZE - The number of bytes allocated by this bloom filter.
* FILTERS - Returns the number of sub filters contained within the bloom filter.
* ITEMS - The number of unique items that have been added to the bloom filter.
* ERROR - The false positive rate of the bloom filter.
* EXPANSION - The expansion rate of the bloom filter. Non scaling filters will have an expansion rate of nil.
* TIGHTENING - The tightening ratio of the bloom filter.
* MAXSCALEDCAPACITY - The [maximum capacity](../topics/bloomfilters.md) that a scalable bloom filter can be expand to and reach before a subsequent scale out will fail.

For non-scaling filters, the `TIGHTENING` and `MAXSCALEDCAPACITY` fields are not applicable and will not be returned.
When no optional fields are specified, all available fields for the given filter type are returned.

## Examples

```
127.0.0.1:6379> BF.ADD key val
(integer) 1
127.0.0.1:6379> BF.INFO key
 1) Capacity
 2) (integer) 100
 3) Size
 4) (integer) 384
 5) Number of filters
 6) (integer) 1
 7) Number of items inserted
 8) (integer) 2
 9) Error rate
10) "0.01"
11) Expansion rate
12) (integer) 2
13) Tightening ratio
14) "0.5"
15) Max scaled capacity
16) (integer) 26214300
127.0.0.1:6379> BF.INFO key CAPACITY
(integer) 100
```