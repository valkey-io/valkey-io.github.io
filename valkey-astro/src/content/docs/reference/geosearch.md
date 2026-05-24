---
title: "GEOSEARCH"
description: "GEOSEARCH command reference documentation"
---

Return the members of a sorted set populated with geospatial information using [`GEOADD`](geoadd.md), which are within the borders of the area specified by a given shape. This command extends the [`GEORADIUS`](georadius.md) command, so in addition to searching within circular areas, it supports searching within rectangular areas and polygon shaped areas.

This command should be used in place of the deprecated `GEORADIUS` and [`GEORADIUSBYMEMBER`](georadiusbymember.md) commands.

The query's shape is provided by one of these mandatory options:

* `BYRADIUS`: Similar to `GEORADIUS`, search inside circular area according to given `<radius>`.
* `BYBOX`: Search inside an axis-aligned rectangle, determined by `<height>` and `<width>`.
* `BYPOLYGON`: Search within an area enclosed by the polygon vertices, determined by `<num-vertices> <lon> <lat> [<lon> <lat>  ...]`.

For `BYBOX` and `BYRADIUS` based queries, the center point is provided by one of these mandatory options:

* `FROMMEMBER`: Use the position of the given existing `<member>` in the sorted set.
* `FROMLONLAT`: Use the given `<longitude>` and `<latitude>` position.

In case of `BYPOLYGON` based queries, the center point and the bounding box are computed based on the polygon vertices of the command.
With this option, providing `FROMMEMBER` or `FROMLONLAT` is invalid.

The command optionally returns additional information using the following options:

* `WITHDIST`: Also return the distance of the returned items from the specified center point. The distance is returned in the same unit as specified for the radius or height and width arguments.
* `WITHCOORD`: Also return the longitude and latitude of the matching items.
* `WITHHASH`: Also return the raw geohash-encoded sorted set score of the item, in the form of a 52 bit unsigned integer. This is only useful for low level hacks or debugging and is otherwise of little interest for the general user.

Matching items are returned unsorted by default. To sort them, use one of the following two options:

* `ASC`: Sort returned items from the nearest to the farthest, relative to the center point.
* `DESC`: Sort returned items from the farthest to the nearest, relative to the center point.

All matching items are returned by default. To limit the results to the first N matching items, use the **COUNT `<count>`** option.
When the `ANY` option is used, the command returns as soon as enough matches are found.  This means that the results returned may not be the ones closest to the specified point, but the effort invested by the server to generate them is significantly less.
When `ANY` is not provided, the command will perform an effort that is proportional to the number of items matching the specified area and sort them,
so to query very large areas with a very small `COUNT` option may be slow even if just a few results are returned.

## Examples

```
127.0.0.1:6379> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
127.0.0.1:6379> GEOADD Sicily 12.758489 38.788135 "edge1"   17.241510 38.788135 "edge2" 
(integer) 2
127.0.0.1:6379> GEOSEARCH Sicily FROMLONLAT 15 37 BYRADIUS 200 km ASC
1) "Catania"
2) "Palermo"
127.0.0.1:6379> GEOSEARCH Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC WITHCOORD WITHDIST
1) 1) "Catania"
   2) "56.4413"
   3) 1) "15.08726745843887329"
      2) "37.50266842333162032"
2) 1) "Palermo"
   2) "190.4424"
   3) 1) "13.36138933897018433"
      2) "38.11555639549629859"
3) 1) "edge2"
   2) "279.7403"
   3) 1) "17.24151045083999634"
      2) "38.78813451624225195"
4) 1) "edge1"
   2) "279.7405"
   3) 1) "12.7584877610206604"
      2) "38.78813451624225195"
127.0.0.1:6379> GEOSEARCH Sicily BYPOLYGON 5 12.41098696654226 38.05033923003755 15.107936245794182 38.00616649901906 18.148439288534455 38.63804787603499 17.80831874257693 39.50316813110968 12.458468633214036 38.57719533463012
1) "Palermo"
2) "edge2"
127.0.0.1:6379> GEOSEARCH Sicily BYPOLYGON 5 12.41098696654226 38.05033923003755 15.107936245794182 38.00616649901906 18.148439288534455 38.63804787603499 17.80831874257693 39.50316813110968 12.458468633214036 38.57719533463012 ASC WITHCOORD WITHDIST
1) 1) "Palermo"
   2) "166482.0159"
   3) 1) "13.36138933897018433"
      2) "38.11555639549629859"
2) 1) "edge2"
   2) "180861.7725"
   3) 1) "17.24151045083999634"
      2) "38.78813451624225195"
```
