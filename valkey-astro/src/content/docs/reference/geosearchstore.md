---
title: "GEOSEARCHSTORE"
description: "GEOSEARCHSTORE command reference documentation"
---

This command is like [`GEOSEARCH`](geosearch.md), but stores the result in destination key.

This command replaces the now deprecated [`GEORADIUS`](georadius.md) and [`GEORADIUSBYMEMBER`](georadiusbymember.md).

By default, it stores the results in the `destination` sorted set with their geospatial information.

When using the `STOREDIST` option, the command stores the items in a sorted set populated with their distance from the center of the circle, box or polygon, as a floating-point number, in the same unit specified for that shape.

## Examples

```
127.0.0.1:6379> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
127.0.0.1:6379> GEOADD Sicily 12.758489 38.788135 "edge1"   17.241510 38.788135 "edge2" 
(integer) 2
127.0.0.1:6379> GEOSEARCHSTORE key1 Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC COUNT 3
(integer) 3
127.0.0.1:6379> GEOSEARCH key1 FROMLONLAT 15 37 BYBOX 400 400 km ASC WITHCOORD WITHDIST WITHHASH
1) 1) "Catania"
   2) "56.4413"
   3) (integer) 3479447370796909
   4) 1) "15.08726745843887329"
      2) "37.50266842333162032"
2) 1) "Palermo"
   2) "190.4424"
   3) (integer) 3479099956230698
   4) 1) "13.36138933897018433"
      2) "38.11555639549629859"
3) 1) "edge2"
   2) "279.7403"
   3) (integer) 3481342659049484
   4) 1) "17.24151045083999634"
      2) "38.78813451624225195"
127.0.0.1:6379> GEOSEARCHSTORE key2 Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC COUNT 3 STOREDIST
(integer) 3
127.0.0.1:6379> ZRANGE key2 0 -1 WITHSCORES
1) "Catania"
2) "56.4412578701582"
3) "Palermo"
4) "190.44242984775784"
5) "edge2"
6) "279.7403417843143"
```
