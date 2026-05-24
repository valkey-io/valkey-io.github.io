---
title: "MSET"
description: "MSET command reference documentation"
---

Sets the given keys to their respective values.
`MSET` replaces existing values with new values, just as regular `SET`.
See `MSETNX` if you don't want to overwrite existing values.

`MSET` is atomic, so all given keys are set at once.
It is not possible for clients to see that some of the keys were updated while
others are unchanged.

## Examples

```
127.0.0.1:6379> MSET key1 "Hello" key2 "World"
OK
127.0.0.1:6379> GET key1
"Hello"
127.0.0.1:6379> GET key2
"World"
```
