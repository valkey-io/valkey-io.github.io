---
title: "HGETDEL"
description: "HGETDEL command reference documentation"
---

The `HGETDEL` command returns the values associated with the specified `fields` in the hash stored at `key` and deletes those fields from the hash.

For every `field` that does not exist in the hash, a `nil` value is returned.
Because non-existing keys are treated as empty hashes, running `HGETDEL` against a non-existing `key` will return a list of `nil` values.

When the last field is deleted, the key is also deleted.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
127.0.0.1:6379> HGETDEL myhash FIELDS 1 f2
1) "v2"
127.0.0.1:6379> HGETDEL myhash FIELDS 1 f2
1) (nil)
127.0.0.1:6379> HGETALL myhash
1) "f1"
2) "v1"
3) "f3"
4) "v3"
127.0.0.1:6379>  HGETDEL myhash FIELDS 2 f2 f3
1) (nil)
2) "v3"
127.0.0.1:6379> HGETALL myhash
1) "f1"
2) "v1"
127.0.0.1:6379> HGETDEL myhash FIELDS 3 f1 non-exist
(error) ERR syntax error
127.0.0.1:6379> HGETDEL myhash FIELDS 2 f1 non-exist
1) "v1"
2) (nil)
127.0.0.1:6379> HGETALL myhash
(empty array)
```
