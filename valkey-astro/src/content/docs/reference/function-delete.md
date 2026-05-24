---
title: "FUNCTION DELETE"
description: "FUNCTION DELETE command reference documentation"
---

Delete a library and all its functions.

This command deletes the library called _library-name_ and all functions in it.
If the library doesn't exist, the server returns an error.

For more information please refer to [Introduction to Valkey Functions](../topics/functions-intro.md).

## Examples

```
127.0.0.1:6379> FUNCTION LOAD "#!lua name=mylib \n server.register_function('myfunc', function(keys, args) return 'hello' end)"
"mylib"
127.0.0.1:6379> FCALL myfunc 0
"hello"
127.0.0.1:6379> FUNCTION DELETE mylib
OK
127.0.0.1:6379> FCALL myfunc 0
(error) ERR Function not found
```
