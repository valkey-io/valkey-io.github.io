---
title: "GEORADIUS"
description: "GEORADIUS command reference documentation"
---

Return the members of a sorted set populated with geospatial information using `GEOADD`, which are within the borders of the area specified with the center location and the maximum distance from the center (the radius).

This manual page also covers the `GEORADIUS_RO` and `GEORADIUSBYMEMBER_RO` variants (see the section below for more information).

The common use case for this command is to retrieve geospatial items near a specified point not farther than a given amount of meters (or other units). This allows, for example, to suggest mobile users of an application nearby places.

The radius is specified in one of the following units:

* **m** for meters.
* **km** for kilometers.
* **mi** for miles.
* **ft** for feet.

The command optionally returns additional information using the following options:

* `WITHDIST`: Also return the distance of the returned items from the specified center. The distance is returned in the same unit as the unit specified as the radius argument of the command.
* `WITHCOORD`: Also return the longitude,latitude coordinates of the matching items.
* `WITHHASH`: Also return the raw geohash-encoded sorted set score of the item, in the form of a 52 bit unsigned integer. This is only useful for low level hacks or debugging and is otherwise of little interest for the general user.

The command default is to return unsorted items. Two different sorting methods can be invoked using the following two options:

* `ASC`: Sort returned items from the nearest to the farthest, relative to the center.
* `DESC`: Sort returned items from the farthest to the nearest, relative to the center.

By default all the matching items are returned. It is possible to limit the results to the first N matching items by using the **COUNT `<count>`** option.
When `ANY` is provided the command will return as soon as enough matches are found,
so the results may not be the ones closest to the specified point, but on the other hand, the effort invested by the server is significantly lower.
When `ANY` is not provided, the command will perform an effort that is proportional to the number of items matching the specified area and sort them,
so to query very large areas with a very small `COUNT` option may be slow even if just a few results are returned.

By default the command returns the items to the client. It is possible to store the results with one of these options:

* `STORE`: Store the items in a sorted set populated with their geospatial information.
* `STOREDIST`: Store the items in a sorted set populated with their distance from the center as a floating point number, in the same unit specified in the radius.

## Read-only variants

Since `GEORADIUS` and `GEORADIUSBYMEMBER` have a `STORE` and `STOREDIST` option they are technically flagged as writing commands in the Valkey command table. For this reason read-only replicas will flag them, and Valkey Cluster replicas will redirect them to the primary instance even if the connection is in read-only mode (see the `READONLY` command of Valkey Cluster).

Two read-only variants of the commands were added. They are exactly like the original commands but refuse the `STORE` and `STOREDIST` options. The two variants are called `GEORADIUS_RO` and `GEORADIUSBYMEMBER_RO`, and can safely be used in replicas.

## Alternative

`GEOSEARCH` and `GEOSEARCHSTORE` with the `BYRADIUS` argument.

## Examples

```
127.0.0.1:6379> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
127.0.0.1:6379> GEORADIUS Sicily 15 37 200 km WITHDIST
1) 1) "Palermo"
   2) "190.4424"
2) 1) "Catania"
   2) "56.4413"
127.0.0.1:6379> GEORADIUS Sicily 15 37 200 km WITHCOORD
1) 1) "Palermo"
   2) 1) "13.36138933897018433"
      2) "38.11555639549629859"
2) 1) "Catania"
   2) 1) "15.08726745843887329"
      2) "37.50266842333162032"
127.0.0.1:6379> GEORADIUS Sicily 15 37 200 km WITHDIST WITHCOORD
1) 1) "Palermo"
   2) "190.4424"
   3) 1) "13.36138933897018433"
      2) "38.11555639549629859"
2) 1) "Catania"
   2) "56.4413"
   3) 1) "15.08726745843887329"
      2) "37.50266842333162032"
```
