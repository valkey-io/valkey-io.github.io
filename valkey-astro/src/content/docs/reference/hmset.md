---
title: "HMSET"
description: "HMSET command reference documentation"
---

Sets the specified fields to their respective values in the hash stored at
`key`.
This command overwrites any specified fields already existing in the hash.
If `key` does not exist, a new key holding a hash is created.

## Alternative

`HSET` with multiple field-value pairs.

## Examples

```
127.0.0.1:6379> HMSET myhash field1 "Hello" field2 "World"
OK
127.0.0.1:6379> HGET myhash field1
"Hello"
127.0.0.1:6379> HGET myhash field2
"World"
```
