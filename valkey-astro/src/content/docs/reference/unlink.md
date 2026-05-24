---
title: "UNLINK"
description: "UNLINK command reference documentation"
---

This command is very similar to [`DEL`](del.md): it removes the specified keys.
Just like `DEL` a key is ignored if it does not exist. However the command
performs the actual memory reclaiming in a different thread, so it is not
blocking, while `DEL` is. This is where the command name comes from: the
command just **unlinks** the keys from the keyspace. The actual removal
will happen later asynchronously.

## Examples

```
127.0.0.1:6379> SET key1 "Hello"
OK
127.0.0.1:6379> SET key2 "World"
OK
127.0.0.1:6379> UNLINK key1 key2 key3
(integer) 2
```
