---
title: "GEODIST"
description: "GEODIST command reference documentation"
---

Return the distance between two members in the geospatial index represented by the sorted set.

Given a sorted set representing a geospatial index, populated using the [`GEOADD`](geoadd.md) command, the command returns the distance between the two specified members in the specified unit.

If one or both the members are missing, the command returns NULL.

The unit must be one of the following, and defaults to meters:

* **m** for meters.
* **km** for kilometers.
* **mi** for miles.
* **ft** for feet.

The distance is computed assuming that the Earth is a perfect sphere, so errors up to 0.5% are possible in edge cases.

## Examples

```
127.0.0.1:6379> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
127.0.0.1:6379> GEODIST Sicily Palermo Catania
"166274.1516"
127.0.0.1:6379> GEODIST Sicily Palermo Catania km
"166.2742"
127.0.0.1:6379> GEODIST Sicily Palermo Catania mi
"103.3182"
127.0.0.1:6379> GEODIST Sicily Foo Bar
(nil)
```
