---
title: "MSETNX"
description: "MSETNX command reference documentation"
---

Sets the given keys to their respective values.
`MSETNX` will not perform any operation at all even if just a single key already
exists.

Because of this semantic `MSETNX` can be used in order to set different keys
representing different fields of a unique logic object in a way that ensures
that either all the fields or none at all are set.

`MSETNX` is atomic, so all given keys are set at once.
It is not possible for clients to see that some of the keys were updated while
others are unchanged.

## Examples

```
127.0.0.1:6379> MSETNX key1 "Hello" key2 "there"
(integer) 1
127.0.0.1:6379> MSETNX key2 "new" key3 "world"
(integer) 0
127.0.0.1:6379> MGET key1 key2 key3
1) "Hello"
2) "there"
3) (nil)
```
