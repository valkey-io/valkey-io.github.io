---
title: "FUNCTION DUMP"
description: "FUNCTION DUMP command reference documentation"
---

Return the serialized payload of loaded libraries.
You can restore the serialized payload later with the [`FUNCTION RESTORE`](function-restore.md) command.

For more information please refer to [Introduction to Valkey Functions](../topics/functions-intro.md).

## Examples

The following example shows how to dump loaded libraries using `FUNCTION DUMP` and then it calls [`FUNCTION FLUSH`](function-flush.md) deletes all the libraries.
Then, it restores the original libraries from the serialized payload with `FUNCTION RESTORE`.

```
127.0.0.1:6379> FUNCTION LOAD "#!lua name=mylib \n server.register_function('myfunc', function(keys, args) return args[1] end)"
"mylib"
127.0.0.1:6379> FUNCTION DUMP
"\xf5\xc3@X@]\x1f#!lua name=mylib \n server.registe\rr_function('my@\x0b\x02', @\x06`\x12\nkeys, args) 6\x03turn`\x0c\a[1] end)\x0c\x00\xba\x98\xc2\xa2\x13\x0e$\a"
127.0.0.1:6379> FUNCTION FLUSH
OK
127.0.0.1:6379> FUNCTION RESTORE "\xf5\xc3@X@]\x1f#!lua name=mylib \n server.registe\rr_function('my@\x0b\x02', @\x06`\x12\nkeys, args) 6\x03turn`\x0c\a[1] end)\x0c\x00\xba\x98\xc2\xa2\x13\x0e$\a"
OK
127.0.0.1:6379> FUNCTION LIST
1) 1) "library_name"
   2) "mylib"
   3) "engine"
   4) "LUA"
   5) "functions"
   6) 1) 1) "name"
         2) "myfunc"
         3) "description"
         4) (nil)
         5) "flags"
         6) (empty array)
```
