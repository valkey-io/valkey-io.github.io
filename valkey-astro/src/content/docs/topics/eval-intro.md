---
title: "Scripting with Lua"
description: >
   Executing Lua in Valkey
---

Valkey lets users upload and execute Lua scripts on the server.
Scripts can employ programmatic control structures and use most of the [commands](../commands/) while executing to access the database.
Because scripts execute in the server, reading and writing data from scripts is very efficient.

Valkey guarantees the script's atomic execution.
While executing the script, all server activities are blocked during its entire runtime.
These semantics mean that all of the script's effects either have yet to happen or had already happened.

Scripting offers several properties that can be valuable in many cases.
These include:

* Providing locality by executing logic where data lives. Data locality reduces overall latency and saves networking resources.
* Blocking semantics that ensure the script's atomic execution.
* Enabling the composition of simple capabilities that are either missing from Valkey or are too niche to be a part of it.

Lua lets you run part of your application logic inside Valkey.
Such scripts can perform conditional updates across multiple keys, possibly combining several different data types atomically.

Scripts are executed in Valkey by an embedded execution engine.
Presently, Valkey supports a single scripting engine, the [Lua 5.1](https://www.lua.org/) interpreter.
Please refer to the [Valkey Lua API Reference](lua-api.md) page for complete documentation.

Although the server executes them, Eval scripts are regarded as a part of the client-side application, which is why they're not named, versioned, or persisted.
So all scripts may need to be reloaded by the application at any time if missing (after a server restart, fail-over to a replica, etc.).
As of version 7.0, [Valkey Functions](functions-intro.md) offer an alternative approach to programmability which allow the server itself to be extended with additional programmed logic.

## Getting started

We'll start scripting with Valkey by using the `EVAL` command.

Here's our first example:

```
> EVAL "return 'Hello, scripting!'" 0
"Hello, scripting!"
```

In this example, `EVAL` takes two arguments.
The first argument is a string that consists of the script's Lua source code.
The script doesn't need to include any definitions of Lua function.
It is just a Lua program that will run in the Valkey engine's context.

The second argument is the number of arguments that follow the script's body, starting from the third argument, representing Valkey key names.
In this example, we used the value _0_ because we didn't provide the script with any arguments, whether the names of keys or not.

## Script parameterization

It is possible, although highly ill-advised, to have the application dynamically generate script source code per its needs.
For example, the application could send these two entirely different, but at the same time perfectly identical scripts:

```
127.0.0.1:6379> EVAL "return 'Hello'" 0
"Hello"
127.0.0.1:6379> EVAL "return 'Scripting!'" 0
"Scripting!"
```

Although this mode of operation isn't blocked by Valkey, it is an anti-pattern due to script cache considerations (more on the topic below).
Instead of having your application generate subtle variations of the same scripts, you can parametrize them and pass any arguments needed for to execute them.

The following example demonstrates how to achieve the same effects as above, but via parameterization:

```
127.0.0.1:6379> EVAL "return ARGV[1]" 0 Hello
"Hello"
127.0.0.1:6379> EVAL "return ARGV[1]" 0 Parameterization!
"Parameterization!"
```

At this point, it is essential to understand the distinction Valkey makes between input arguments that are names of keys and those that aren't.

While key names in Valkey are just strings, unlike any other string values, these represent keys in the database.
The name of a key is a fundamental concept in Valkey and is the basis for operating the Valkey Cluster.

**Important:**
to ensure the correct execution of scripts, both in standalone and clustered deployments, all names of keys that a script accesses must be explicitly provided as input key arguments.
The script **should only** access keys whose names are given as input arguments.
Scripts **should never** access keys with programmatically-generated names or based on the contents of data structures stored in the database.

Any input to the function that isn't the name of a key is a regular input argument.

In the example above, both _Hello_ and _Parameterization!_ regular input arguments for the script.
Because the script doesn't touch any keys, we use the numerical argument _0_ to specify there are no key name arguments.
The execution context makes arguments available to the script through [_KEYS_](lua-api.md#the-keys-global-variable) and [_ARGV_](lua-api.md#the-argv-global-variable) global runtime variables.
The _KEYS_ table is pre-populated with all key name arguments provided to the script before its execution, whereas the _ARGV_ table serves a similar purpose but for regular arguments.

The following attempts to demonstrate the distribution of input arguments between the scripts _KEYS_ and _ARGV_ runtime global variables:

```
127.0.0.1:6379> EVAL "return { KEYS[1], KEYS[2], ARGV[1], ARGV[2], ARGV[3] }" 2 key1 key2 arg1 arg2 arg3
1) "key1"
2) "key2"
3) "arg1"
4) "arg2"
5) "arg3"
```

**Note:**
as can been seen above, Lua's table arrays are returned as [RESP2 array replies](protocol.md#arrays), so it is likely that your client's library will convert it to the native array data type in your programming language.
Please refer to the rules that govern [data type conversion](lua-api.md#data-type-conversion) for more pertinent information.

## Interacting with Valkey from a script

It is possible to call Valkey commands from a Lua script either via [`server.call()`](lua-api.md#server.call) or [`server.pcall()`](lua-api.md#server.pcall).

The two are nearly identical.
Both execute a Valkey command along with its provided arguments, if these represent a well-formed command.
However, the difference between the two functions lies in the manner in which runtime errors (such as syntax errors, for example) are handled.
Errors raised from calling `server.call()` function are returned directly to the client that had executed it.
Conversely, errors encountered when calling the `server.pcall()` function are returned to the script's execution context instead for possible handling.

For example, consider the following:

```
> EVAL "return server.call('SET', KEYS[1], ARGV[1])" 1 foo bar
OK
```

The above script accepts one key name and one value as its input arguments.
When executed, the script calls the `SET` command to set the input key, _foo_, with the string value "bar".

## Script cache

Until this point, we've used the `EVAL` command to run our script.

Whenever we call `EVAL`, we also include the script's source code with the request.
Repeatedly calling `EVAL` to execute the same set of parameterized scripts, wastes both network bandwidth and also has some overheads in Valkey.
Naturally, saving on network and compute resources is key, so, instead, Valkey provides a caching mechanism for scripts.

Every script you execute with `EVAL` is stored in a dedicated cache that the server keeps.
The cache's contents are organized by the scripts' SHA1 digest sums, so the SHA1 digest sum of a script uniquely identifies it in the cache.
You can verify this behavior by running `EVAL` and calling `INFO` afterward.
You'll notice that the _used_memory_scripts_eval_ and _number_of_cached_scripts_ metrics grow with every new script that's executed.

As mentioned above, dynamically-generated scripts are an anti-pattern.
Generating scripts during the application's runtime may, and probably will, exhaust the host's memory resources for caching them.
Instead, scripts should be as generic as possible and provide customized execution via their arguments.

A script is loaded to the server's cache by calling the `SCRIPT LOAD` command and providing its source code.
The server doesn't execute the script, but instead just compiles and loads it to the server's cache.
Once loaded, you can execute the cached script with the SHA1 digest returned from the server.

Here's an example of loading and then executing a cached script:

```
127.0.0.1:6379> SCRIPT LOAD "return 'Immabe a cached script'"
"c664a3bf70bd1d45c4284ffebb65a6f2299bfc9f"
127.0.0.1:6379> EVALSHA c664a3bf70bd1d45c4284ffebb65a6f2299bfc9f 0
"Immabe a cached script"
```

### Cache volatility

The Valkey script cache is **always volatile**.
It isn't considered as a part of the database and is **not persisted**.
The cache may be cleared when the server restarts, during fail-over when a replica assumes the primary role, or explicitly by `SCRIPT FLUSH`.
That means that cached scripts are ephemeral, and the cache's contents can be lost at any time.

Applications that use scripts should always call `EVALSHA` to execute them.
The server returns an error if the script's SHA1 digest is not in the cache.
For example:

```
127.0.0.1:6379> EVALSHA ffffffffffffffffffffffffffffffffffffffff 0
(error) NOSCRIPT No matching script
```

In this case, the application should first load it with `SCRIPT LOAD` and then call `EVALSHA` once more to run the cached script by its SHA1 sum.
Most of [Valkey' clients](../clients/) already provide utility APIs for doing that automatically.
Please consult your client's documentation regarding the specific details.

### `EVALSHA` in the context of pipelining

Special care should be given executing `EVALSHA` in the context of a [pipelined request](pipelining.md).
The commands in a pipelined request run in the order they are sent, but other clients' commands may be interleaved for execution between these.
Because of that, the `NOSCRIPT` error can return from a pipelined request but can't be handled.

Therefore, a client library's implementation should revert to using plain `EVAL` of parameterized in the context of a pipeline.

### Script cache semantics

During normal operation, an application's scripts are meant to stay indefinitely in the cache (that is, until the server is restarted or the cache being flushed).
The underlying reasoning is that the script cache contents of a well-written application are unlikely to grow continuously.
Even large applications that use hundreds of cached scripts shouldn't be an issue in terms of cache memory usage.

The only way to flush the script cache is by explicitly calling the `SCRIPT FLUSH` command.
Running the command will _completely flush_ the scripts cache, removing all the scripts executed so far.
Typically, this is only needed when the instance is going to be instantiated for another customer or application in a cloud environment.

Also, as already mentioned, restarting a Valkey instance flushes the non-persistent script cache.
However, from the point of view of the Valkey client, there are only two ways to make sure that a Valkey instance was not restarted between two different commands:

* The connection we have with the server is persistent and was never closed so far.
* The client explicitly checks the `run_id` field in the `INFO` command to ensure the server was not restarted and is still the same process.

Practically speaking, it is much simpler for the client to assume that in the context of a given connection, cached scripts are guaranteed to be there unless the administrator explicitly invoked the `SCRIPT FLUSH` command.
The fact that the user can count on Valkey to retain cached scripts is semantically helpful in the context of pipelining.

## The `SCRIPT` command

The Valkey `SCRIPT` provides several ways for controlling the scripting subsystem.
These are:

* `SCRIPT FLUSH`: this command is the only way to force Valkey to flush the scripts cache.
  It is most useful in environments where the same Valkey instance is reassigned to different uses.
  It is also helpful for testing client libraries' implementations of the scripting feature.

* `SCRIPT EXISTS`: given one or more SHA1 digests as arguments, this command returns an array of _1_'s and _0_'s.
  _1_ means the specific SHA1 is recognized as a script already present in the scripting cache. _0_'s meaning is that a script with this SHA1 wasn't loaded before (or at least never since the latest call to `SCRIPT FLUSH`).

* `SCRIPT LOAD script`: this command registers the specified script in the Valkey script cache.
  It is a useful command in all the contexts where we want to ensure that `EVALSHA` doesn't not fail (for instance, in a pipeline or when called from a [`MULTI`/`EXEC` transaction](transactions.md)), without the need to execute the script.

* `SCRIPT SHOW`: this command shows the original source code for a script that is stored in the script cache.
  It is useful to help users easily obtain scripts using signature.

* `SCRIPT KILL`: this command is the only way to interrupt a long-running script (a.k.a slow script), short of shutting down the server.
  A script is deemed as slow once its execution's duration exceeds the configured [maximum execution time](programmability.md#maximum-execution-time) threshold.
  The `SCRIPT KILL` command can be used only with scripts that did not modify the dataset during their execution (since stopping a read-only script does not violate the scripting engine's guaranteed atomicity).

* `SCRIPT DEBUG`: controls use of the built-in [Valkey Lua scripts debugger](ldb.md).

## Script replication

In a primary-replica setup (see [replication](replication.md)), write commands performed by a script on the primary are also sent to replicas to maintain consistency.
When the script execution finishes, the sequence of commands that the script generated are wrapped into a [`MULTI`/`EXEC` transaction](transactions.md) and are sent to the replicas and written to the AOF file, if an AOF file is used. (See [Persistence](persistence.md).)
This is called *effects replication*.

In the past, it was also possible to use *verbatim replication* which means that a script was replicated as a whole, but this was removed in 7.0.

The [`server.replicate_commands()`](lua-api.md#server.replicate_commands) function is deprecated and has no effect, but it exists to avoid breaking existing scripts.

## Debugging Eval scripts

Valkey has a built-in Lua debugger.
The Valkey Lua debugger is a remote debugger consisting of a server, which is Valkey itself, and a client, which is by default [`valkey-cli`](cli.md).

The Lua debugger is described in the [Lua scripts debugging](ldb.md) section of the Valkey documentation.

## Execution under low memory conditions

When memory usage in Valkey exceeds the `maxmemory` limit, the first write command encountered in the script that uses additional memory will cause the script to abort (unless [`server.pcall`](lua-api.md#server.pcall) was used).

However, an exception to the above is when the script's first write command does not use additional memory, as is the case with  (for example, `DEL` and `LREM`).
In this case, Valkey will allow all commands in the script to run to ensure atomicity.
If subsequent writes in the script consume additional memory, Valkey' memory usage can exceed the threshold set by the `maxmemory` configuration directive.

Another scenario in which a script can cause memory usage to cross the `maxmemory` threshold is when the execution begins when Valkey is slightly below `maxmemory`, so the script's first write command is allowed.
As the script executes, subsequent write commands consume more memory leading to the server using more RAM than the configured `maxmemory` directive.

In those scenarios, you should consider setting the `maxmemory-policy` configuration directive to any values other than `noeviction`.
In addition, Lua scripts should be as fast as possible so that eviction can kick in between executions.

Note that you can change this behaviour by using [flags](#eval-flags)

## Eval flags

Normally, when you run an Eval script, the server does not know how it accesses the database.
By default, Valkey assumes that all scripts read and write data.
However, starting with Redis OSS 7.0, there's a way to declare flags when creating a script in order to tell Valkey how it should behave.

The way to do that is by using a Shebang statement on the first line of the script like so:

```
#!lua flags=no-writes,allow-stale
local x = server.call('get','x')
return x
```

Note that as soon as Valkey sees the `#!` comment, it'll treat the script as if it declares flags, even if no flags are defined,
it still has a different set of defaults compared to a script without a `#!` line.

Another difference is that scripts without `#!` can run commands that access keys belonging to different cluster hash slots, but ones with `#!` inherit the default flags, so they cannot.

Please refer to [Script flags](lua-api.md#script_flags) to learn about the various scripts and the defaults.
