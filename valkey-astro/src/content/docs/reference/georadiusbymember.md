---
title: "GEORADIUSBYMEMBER"
description: "GEORADIUSBYMEMBER command reference documentation"
---

This command is exactly like `GEORADIUS` with the sole difference that instead
of taking, as the center of the area to query, a longitude and latitude value, it takes the name of a member already existing inside the geospatial index represented by the sorted set.

The position of the specified member is used as the center of the query.

Please check the example below and the `GEORADIUS` documentation for more information about the command and its options.

Note that `GEORADIUSBYMEMBER_RO` was added to provide a read-only command that can be used in replicas. See the `GEORADIUS` page for more information.

## Alternative

`GEOSEARCH` and `GEOSEARCHSTORE` with the `BYRADIUS` and `FROMMEMBER` arguments.

## Examples

```
127.0.0.1:6379> GEOADD Sicily 13.583333 37.316667 "Agrigento"
(integer) 1
127.0.0.1:6379> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
127.0.0.1:6379> GEORADIUSBYMEMBER Sicily Agrigento 100 km
1) "Agrigento"
2) "Palermo"
```
