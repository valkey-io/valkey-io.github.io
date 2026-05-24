---
title: "FCALL"
description: "FCALL command reference documentation"
---

Invoke a function.

Functions are loaded to the server with the [`FUNCTION LOAD`](function-load.md) command.
The first argument is the name of a loaded function.

The second argument is the number of input key name arguments, followed by all the keys accessed by the function.
In Lua, these names of input keys are available to the function as a table that is the callback's first argument.

**Important:**
To ensure the correct execution of functions, both in standalone and clustered deployments, all names of keys that a function accesses must be explicitly provided as input key arguments.
The function **should only** access keys whose names are given as input arguments.
Functions **should never** access keys with programmatically-generated names or based on the contents of data structures stored in the database.

Any additional input argument **should not** represent names of keys.
These are regular arguments and are passed in a Lua table as the callback's second argument.

For more information please refer to the [Valkey Programmability](../topics/programmability.md) and [Introduction to Valkey Functions](../topics/functions-intro.md) pages.

## Examples

The following example will create a library named `mylib` with a single function, `myfunc`, that returns the first argument it gets.

```
127.0.0.1:6379> FUNCTION LOAD "#!lua name=mylib \n server.register_function('myfunc', function(keys, args) return args[1] end)"
"mylib"
127.0.0.1:6379> FCALL myfunc 0 hello
"hello"
```
