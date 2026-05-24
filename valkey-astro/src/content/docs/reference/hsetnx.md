---
title: "HSETNX"
description: "HSETNX command reference documentation"
---

Sets `field` in the hash stored at `key` to `value`, only if `field` does not
yet exist.
If `key` does not exist, a new key holding a hash is created.
If `field` already exists, this operation has no effect.

## Examples

```
127.0.0.1:6379> HSETNX myhash field "Hello"
(integer) 1
127.0.0.1:6379> HSETNX myhash field "World"
(integer) 0
127.0.0.1:6379> HGET myhash field
"Hello"
```
