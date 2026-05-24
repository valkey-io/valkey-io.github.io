---
title: "Geospatial"
description: >
    Introduction to the Valkey Geospatial data type
---

Geospatial indexes let you store coordinates and search for them.
This data structure is useful for finding nearby points within a given radius, bounding box, or polygon shaped area.

## Basic commands

* `GEOADD` adds a location to a given geospatial index (note that longitude comes before latitude with this command).
* `GEOSEARCH` returns locations with a given radius, bounding box, or polygon shaped area.

See the [complete list of geospatial index commands](../commands/#geo).


## Examples

Suppose you're building a mobile app that lets you find all of the bike rental stations closest to your current location.

Add several locations to a geospatial index:
```
127.0.0.1:6379> GEOADD bikes:rentable -122.27652 37.805186 station:1
(integer) 1
127.0.0.1:6379> GEOADD bikes:rentable -122.2674626 37.8062344 station:2
(integer) 1
127.0.0.1:6379> GEOADD bikes:rentable -122.2469854 37.8104049 station:3
(integer) 1
```

Find all locations within a 5 kilometer radius of a given location, and return the distance to each location:
```
127.0.0.1:6379> GEOSEARCH bikes:rentable FROMLONLAT -122.2612767 37.7936847 BYRADIUS 5 km WITHDIST
1) 1) "station:1"
   2) "1.8523"
2) 1) "station:2"
   2) "1.4979"
3) 1) "station:3"
   2) "2.2441"
```

Searching for all stations in a custom defined area or an irregularly shaped area by using the `BYPOLYGON` search option.
In this example, we are searching within the Downtown Oakland area using polygon vertices that enclose this area.

```
127.0.0.1:6379> GEOSEARCH bikes:rentable BYPOLYGON  5 -122.27490648273738 37.80962123634505 -122.26098358494566 37.80439605986292 -122.26584066888834 37.79562786995921 -122.27929133687068 37.80124920239011 -122.2783398259964 37.80451967488848
1) "station:1"
2) "station:2"
```
