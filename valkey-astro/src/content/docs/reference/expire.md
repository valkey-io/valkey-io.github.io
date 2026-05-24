---
title: "EXPIRE"
description: "EXPIRE command reference documentation"
---

Set a timeout on `key`.
After the timeout has expired, the key will automatically be deleted.
A key with an associated timeout is often said to be _volatile_ in Valkey
terminology.

The timeout will only be cleared by commands that delete or overwrite the
contents of the key, including [`DEL`](del.md), [`SET`](set.md), [`GETSET`](getset.md) and all the `*STORE`
commands.
This means that all the operations that conceptually _alter_ the value stored at
the key without replacing it with a new one will leave the timeout untouched.
For instance, incrementing the value of a key with [`INCR`](incr.md), pushing a new value
into a list with [`LPUSH`](lpush.md), or altering the field value of a hash with [`HSET`](hset.md) are
all operations that will leave the timeout untouched.

The timeout can also be cleared, turning the key back into a persistent key,
using the [`PERSIST`](persist.md) command.

If a key is renamed with [`RENAME`](rename.md), the associated time to live is transferred to
the new key name.

If a key is overwritten by `RENAME`, like in the case of an existing key `Key_A`
that is overwritten by a call like `RENAME Key_B Key_A`, it does not matter if
the original `Key_A` had a timeout associated or not, the new key `Key_A` will
inherit all the characteristics of `Key_B`.

Note that calling `EXPIRE`/[`PEXPIRE`](pexpire.md) with a non-positive timeout or
[`EXPIREAT`](expireat.md)/[`PEXPIREAT`](pexpireat.md) with a time in the past will result in the key being
[deleted][del] rather than expired (accordingly, the emitted [key event][ntf]
will be `del`, not `expired`).

[del]: del.md
[ntf]: ../topics/notifications.md

## Options

The `EXPIRE` command supports a set of options:

* `NX` -- Set expiry only when the key has no expiry
* `XX` -- Set expiry only when the key has an existing expiry
* `GT` -- Set expiry only when the new expiry is greater than current one
* `LT` -- Set expiry only when the new expiry is less than current one

A non-volatile key is treated as an infinite TTL for the purpose of `GT` and `LT`.
The `GT`, `LT` and `NX` options are mutually exclusive.

## Refreshing expires

It is possible to call `EXPIRE` using as argument a key that already has an
existing expire set.
In this case the time to live of a key is _updated_ to the new value.
There are many useful applications for this, an example is documented in the
_Navigation session_ pattern section below.

`EXPIRE` would return 0 and not alter the timeout for a key with a timeout set.

## Examples

```
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> EXPIRE mykey 10
(integer) 1
127.0.0.1:6379> TTL mykey
(integer) 10
127.0.0.1:6379> SET mykey "Hello World"
OK
127.0.0.1:6379> TTL mykey
(integer) -1
127.0.0.1:6379> EXPIRE mykey 10 XX
(integer) 0
127.0.0.1:6379> TTL mykey
(integer) -1
127.0.0.1:6379> EXPIRE mykey 10 NX
(integer) 1
127.0.0.1:6379> TTL mykey
(integer) 10
```

## Pattern: Navigation session

Imagine you have a web service and you are interested in the latest N pages
_recently_ visited by your users, such that each adjacent page view was not
performed more than 60 seconds after the previous.
Conceptually you may consider this set of page views as a _Navigation session_
of your user, that may contain interesting information about what kind of
products he or she is looking for currently, so that you can recommend related
products.

You can easily model this pattern in Valkey using the following strategy: every
time the user does a page view you call the following commands:

```
MULTI
RPUSH pagewviews.user:<userid> http://.....
EXPIRE pagewviews.user:<userid> 60
EXEC
```

If the user will be idle more than 60 seconds, the key will be deleted and only
subsequent page views that have less than 60 seconds of difference will be
recorded.

This pattern is easily modified to use counters using `INCR` instead of lists
using [`RPUSH`](rpush.md).

# Appendix: Valkey expires

## Keys with an expire

Normally Valkey keys are created without an associated time to live.
The key will simply live forever, unless it is removed by the user in an
explicit way, for instance using the `DEL` command.

The `EXPIRE` family of commands is able to associate an expire to a given key,
at the cost of some additional memory used by the key.
When a key has an expire set, Valkey will make sure to remove the key when the
specified amount of time elapsed.

The key time to live can be updated or entirely removed using the `EXPIRE` and
[`PERSIST`](persist.md) command (or other strictly related commands).

## Expire accuracy

The expire error is from 0 to 1 milliseconds.

## Expires and persistence

Keys expiring information is stored in milliseconds.
This means that the time is flowing even when the Valkey instance is not active.

For expires to work well, the computer time must be taken stable.
If you move an RDB file from two computers with a big desync in their clocks,
funny things may happen (like all the keys loaded to be expired at loading
time).

Even running instances will always check the computer clock, so for instance if
you set a key with a time to live of 1000 seconds, and then set your computer
time 2000 seconds in the future, the key will be expired immediately, instead of
lasting for 1000 seconds.

## How Valkey reclaims expired keys

Valkey reclaims expired keys in two ways: on access and in the background in what is called the "active expire key" cycles. On access expiration is when a client tries to access a key with the expiration time which is found to be timed out. Such a key is deleted on this access attempt.

Relying solely on the on access expiration only is not enough because there are expired keys that may never be accessed again. To address this, Valkey uses the background expiration algorithm known as the "active expire key" effort. This  algorithm is adaptive: it tries to use less CPU if there are few expired keys to reclaim. Otherwise, it gets more aggressive trying to free more memory by reclaiming more keys in shorter runs but using more CPU. 

This is how it works:

Valkey slowly scans the keyspace to identify and reclaim expired keys. This "slow cycle" is the main way to collect expired keys and operates with the server's hertz frequency (usually 10 hertz). During the slow cycle, Valkey tolerates having not more than 10% of the expired keys in the memory and tries to use a maximum of 25% CPU power. These default values are adjusted if the user changes the active expire key effort configuration. 

If the number of expired keys remains high after the slow cycle, the active expire key effort transitions into the "fast cycle", trying to do less work but more often. The fast cycle runs no longer than 1000 microseconds and repeats at the same interval. During the fast cycle, the check of every database is interrupted once the number of already expired keys in the database is estimated to be lower than 10%. This is done to avoid doing too much work to gain too little memory. 

You can modify the active expire key effort with the `active-expire-effort` parameter in the configuration file up to the maximum value of `10`. The default `active-expire-effort` value is `1`, and it is described by the following base values:

* `ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP` has a base value of 20. The number of keys for each DB loop.
* `ACTIVE_EXPIRE_CYCLE_FAST_DURATION` has a base value of 1000. The maximum duration of the fast cycle in microseconds.
* `ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC` has a base value of 25. The maximum % of CPU to use during the slow cycle.
* `ACTIVE_EXPIRE_CYCLE_ACCEPTABLE_STALE` has a base value of 10. The maximum % of expired keys to tolerate in memory.

Changing the `active-expire-effort` value results in a lower percentage of expired keys tolerated in memory. However, it will lead to longer cycles and increased CPU usage, which may introduce latency.

To calculate the new values, use the following formulas:

* `ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP + (ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP / 4 * (effort - 1))`
* `ACTIVE_EXPIRE_CYCLE_FAST_DURATION + (ACTIVE_EXPIRE_CYCLE_FAST_DURATION / 4 * (effort - 1))`
* `ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC + (2 * (effort - 1))`
* `ACTIVE_EXPIRE_CYCLE_ACCEPTABLE_STALE - (effort - 1)`

where `ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP`, `ACTIVE_EXPIRE_CYCLE_FAST_DURATION`, `ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC`, and `ACTIVE_EXPIRE_CYCLE_ACCEPTABLE_STALE` are the base values, and `effort` is the specified `active-expire-effort`.


## How expires are handled in the replication link and AOF file

In order to obtain a correct behavior without sacrificing consistency, when a
key expires, a `DEL` operation is synthesized in both the AOF file and gains all
the attached replicas nodes.
This way the expiration process is centralized in the primary instance, and there
is no chance of consistency errors.

However while the replicas connected to a primary will not expire keys
independently (but will wait for the `DEL` coming from the primary), they'll
still take the full state of the expires existing in the dataset, so when a
replica is elected to primary it will be able to expire the keys independently,
fully acting as a primary.
