---
title: "HDEL"
description: "HDEL command reference documentation"
---

Removes the specified fields from the hash stored at `key`.
Specified fields that do not exist within this hash are ignored.
If `key` does not exist, it is treated as an empty hash and this command returns
`0`.

## Examples

```
127.0.0.1:6379> HSET myhash field1 "foo"
(integer) 1
127.0.0.1:6379> HDEL myhash field1
(integer) 1
127.0.0.1:6379> HDEL myhash field2
(integer) 0
```
