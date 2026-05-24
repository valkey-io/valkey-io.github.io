---
title: "HPERSIST"
description: "HPERSIST command reference documentation"
---

The `HPERSIST` remove the existing expiration on a hash key's field(s), turning the field(s) from volatile (a field with expiration set) 
to persistent (a field that will never expire as no TTL (time to live) is associated).

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HEXPIRE myhash 1000 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) 998
3) (integer) 998
127.0.0.1:6379> HPERSIST myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) 1
3) (integer) 1
127.0.0.1:6379> HTTL myhash FIELDS 3 f1 f2 f3
1) (integer) -1
2) (integer) -1
3) (integer) -1
```
