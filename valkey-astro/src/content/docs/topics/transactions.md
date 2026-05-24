---
title: Transactions
description: How transactions work in Valkey
---

Valkey Transactions allow the execution of a group of commands
in a single step, they are centered around the commands 
`MULTI`, `EXEC`, `DISCARD` and `WATCH`.
Valkey Transactions make two important guarantees:

* All the commands in a transaction are serialized and executed
sequentially. A request sent by another client will never be
served **in the middle** of the execution of a Valkey Transaction.
This guarantees that the commands are executed as a single
isolated operation.

* The `EXEC` command
triggers the execution of all the commands in the transaction, so
if a client loses the connection to the server in the context of a
transaction before calling the `EXEC` command none of the operations
are performed, instead if the `EXEC` command is called, all the
operations are performed. When using the
[append-only file](persistence.md#append-only-file) Valkey makes sure
to use a single write(2) syscall to write the transaction on disk.
However if the Valkey server crashes or is killed by the system administrator
in some hard way it is possible that only a partial number of operations
are registered. Valkey will detect this condition at restart, and will exit with an error.
Using the `valkey-check-aof` tool it is possible to fix the
append only file that will remove the partial transaction so that the
server can start again.

Valkey allows for an extra guarantee to the
above two, in the form of optimistic locking in a way very similar to a
check-and-set (CAS) operation.
This is documented [later](#cas) on this page.

## Usage

A Valkey Transaction is entered using the `MULTI` command. The command
always replies with `OK`. At this point the user can issue multiple
commands. Instead of executing these commands, Valkey will queue
them. All the commands are executed once `EXEC` is called.

Calling `DISCARD` instead will flush the transaction queue and will exit
the transaction.

The following example increments keys `foo` and `bar` atomically.

```
> MULTI
OK
> INCR foo
QUEUED
> INCR bar
QUEUED
> EXEC
1) (integer) 1
2) (integer) 1
```

As is clear from the session above, `EXEC` returns an
array of replies, where every element is the reply of a single command
in the transaction, in the same order the commands were issued.

When a Valkey connection is in the context of a `MULTI` request,
all commands will reply with the string `QUEUED` (sent as a Status Reply
from the point of view of the Valkey protocol). A queued command is
simply scheduled for execution when `EXEC` is called.

## Errors inside a transaction

During a transaction it is possible to encounter two kinds of command errors:

* A command may fail to be queued, so there may be an error before `EXEC` is called.
For instance the command may be syntactically wrong (wrong number of arguments,
wrong command name, ...), or there may be some critical condition like an out of
memory condition (if the server is configured to have a memory limit using the `maxmemory` directive).
* A command may fail *after* `EXEC` is called, for instance since we performed
an operation against a key with the wrong value (like calling a list operation against a string value).

The server will detect an error during the accumulation of commands.
It will then refuse to execute the transaction returning an error during `EXEC`, discarding the transaction.

Errors happening *after* `EXEC` instead are not handled in a special way:
all the other commands will be executed even if some command fails during the transaction.

This is more clear on the protocol level. In the following example one
command will fail when executed even if the syntax is right:

```
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
MULTI
+OK
SET a abc
+QUEUED
LPOP a
+QUEUED
EXEC
*2
+OK
-WRONGTYPE Operation against a key holding the wrong kind of value
```

`EXEC` returned two-element [bulk string reply](protocol.md#bulk-strings) where one is an `OK` code and
the other an error reply. It's up to the client library to find a
sensible way to provide the error to the user.

It's important to note that
**even when a command fails, all the other commands in the queue are processed** – Valkey will _not_ stop the
processing of commands.

Another example, again using the wire protocol with `telnet`, shows how
syntax errors are reported ASAP instead:

```
MULTI
+OK
INCR a b c
-ERR wrong number of arguments for 'incr' command
EXEC
-EXECABORT Transaction discarded because of previous errors.
```

This time due to the syntax error the bad `INCR` command is not queued
at all. And the `EXEC` command will receive an `EXECABORT` error.

When the `EXEC` command is processed, the server will check if a failover or slot migration has occurred since queuing the commands.
If either event has occurred, a `-MOVED` or `-REDIRECT` error will be returned if needed without processing the transaction.

For cluster mode:

```
MULTI    ==>  +OK
SET x y  ==>  +QUEUED
slot {x} is migrated to other node
EXEC     ==>  -MOVED
```

For standalone mode:

```
MULTI    ==>  +OK
SET x y  ==>  +QUEUED
failover
EXEC     ==>  -REDIRECT
```

Before the `EXEC` command is processed, if a command accesses data that does not belong to the current node,
a `-MOVED` or `-REDIRECT` error will be returned immediately, and the `EXEC` command will receive an `EXECABORT` error.

For cluster mode:

```
MULTI    ==>  +OK
SET x y  ==>  -MOVED
EXEC     ==>  -EXECABORT
```

For standalone mode:

```
MULTI    ==>  +OK
SET x y  ==>  -REDIRECT
EXEC     ==>  -EXECABORT
```

## What about rollbacks?

Valkey does not support rollbacks of transactions since supporting rollbacks
would have a significant impact on the simplicity and performance of Valkey.

## Discarding the command queue

`DISCARD` can be used in order to abort a transaction. In this case, no
commands are executed and the state of the connection is restored to
normal.

```
> SET foo 1
OK
> MULTI
OK
> INCR foo
QUEUED
> DISCARD
OK
> GET foo
"1"
```
<a name="cas"></a>

## Optimistic locking using check-and-set

`WATCH` is used to provide a check-and-set (CAS) behavior to Valkey
transactions.

`WATCH`ed keys are monitored in order to detect changes against them. If
at least one watched key is modified before the `EXEC` command, the
whole transaction aborts, and `EXEC` returns a [Null reply](protocol.md#nil-reply) to notify that
the transaction failed.

For example, imagine we have the need to atomically increment the value
of a key by 1 (let's suppose Valkey doesn't have `INCR`).

The first try may be the following:

```
val = GET mykey
val = val + 1
SET mykey $val
```

This will work reliably only if we have a single client performing the
operation in a given time. If multiple clients try to increment the key
at about the same time there will be a race condition. For instance,
client A and B will read the old value, for instance, 10. The value will
be incremented to 11 by both the clients, and finally `SET` as the value
of the key. So the final value will be 11 instead of 12.

Thanks to `WATCH` we are able to model the problem very well:

```
WATCH mykey
val = GET mykey
val = val + 1
MULTI
SET mykey $val
EXEC
```

Using the above code, if there are race conditions and another client
modifies the result of `val` in the time between our call to `WATCH` and
our call to `EXEC`, the transaction will fail.

We just have to repeat the operation hoping this time we'll not get a
new race. This form of locking is called _optimistic locking_.
In many use cases, multiple clients will be accessing different keys,
so collisions are unlikely – usually there's no need to repeat the operation.

## WATCH explained

So what is `WATCH` really about? It is a command that will
make the `EXEC` conditional: we are asking Valkey to perform
the transaction only if none of the `WATCH`ed keys were modified. This includes
modifications made by the client, like write commands, and by Valkey itself,
like expiration or eviction. If keys were modified between when they were
`WATCH`ed and when the `EXEC` was received, the entire transaction will be aborted
instead.

**NOTE:**
Commands within a transaction won't trigger the `WATCH` condition since they
are only queued until the `EXEC` is sent.

`WATCH` can be called multiple times. Simply all the `WATCH` calls will
have the effects to watch for changes starting from the call, up to
the moment `EXEC` is called. You can also send any number of keys to a
single `WATCH` call.

When `EXEC` is called, all keys are `UNWATCH`ed, regardless of whether
the transaction was aborted or not.  Also when a client connection is
closed, everything gets `UNWATCH`ed.

It is also possible to use the `UNWATCH` command (without arguments)
in order to flush all the watched keys. Sometimes this is useful as we
optimistically lock a few keys, since possibly we need to perform a
transaction to alter those keys, but after reading the current content
of the keys we don't want to proceed.  When this happens we just call
`UNWATCH` so that the connection can already be used freely for new
transactions.

### Using WATCH to implement ZPOPMIN

An example to illustrate how `WATCH` can be used to create
atomic operations is to implement `ZPOPMIN`,
that is a command that pops the element with the lower
score from a sorted set in an atomic way. This is a possible implementation:

```
WATCH zset
element = ZRANGE zset 0 0
MULTI
ZREM zset element
EXEC
```

If `EXEC` fails (i.e. returns a [Null reply](protocol.md#nil-reply)) we just repeat the operation.

## Valkey scripting and transactions

Something else to consider for transaction-like operations are
[scripts](../commands/eval.md) which are transactional. Everything
you can do with a Valkey Transaction, you can also do with a script.
