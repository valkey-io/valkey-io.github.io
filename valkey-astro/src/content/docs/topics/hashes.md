---
title: "Hashes"
description: >
    Introduction to Hashes
---

Hashes are record types structured as collections of field-value pairs.
You can use hashes to represent basic objects and to store groupings of counters, among other things.

```
127.0.0.1:6379> HSET bike:1 model Deimos brand Ergonom type 'Enduro bikes' price 4972
(integer) 4
127.0.0.1:6379> HGET bike:1 model
"Deimos"
127.0.0.1:6379> HGET bike:1 price
"4972"
127.0.0.1:6379> HGETALL bike:1
1) "model"
2) "Deimos"
3) "brand"
4) "Ergonom"
5) "type"
6) "Enduro bikes"
7) "price"
8) "4972"
```

While hashes are handy to represent *objects*, actually the number of fields you can
put inside a hash has no practical limits (other than available memory), so you can use
hashes in many different ways inside your application.

The command `HSET` sets multiple fields of the hash, while `HGET` retrieves
a single field. `HMGET` is similar to `HGET` but returns an array of values:

```
127.0.0.1:6379> HMGET bike:1 model price no-such-field
1) "Deimos"
2) "4972"
3) (nil)
```

There are commands that are able to perform operations on individual fields
as well, like `HINCRBY`:

```
127.0.0.1:6379> HINCRBY bike:1 price 100
(integer) 5072
127.0.0.1:6379> HINCRBY bike:1 price -100
(integer) 4972
```

It is worth noting that small hashes (i.e., a few elements with small values) are
encoded in special way in memory that make them very memory efficient.

## Basic commands

* `HSET` sets the value of one or more fields on a hash.
* `HGET` returns the value at a given field.
* `HMGET` returns the values at one or more given fields.
* `HINCRBY` increments the value at a given field by the integer provided.

See the [complete list of hash commands](../commands/#hash).

## Examples

* Store counters for the number of times bike:1 has been ridden, has crashed, or has changed owners:
```
127.0.0.1:6379> HINCRBY bike:1:stats rides 1
(integer) 1
127.0.0.1:6379> HINCRBY bike:1:stats rides 1
(integer) 2
127.0.0.1:6379> HINCRBY bike:1:stats rides 1
(integer) 3
127.0.0.1:6379> HINCRBY bike:1:stats crashes 1
(integer) 1
127.0.0.1:6379> HINCRBY bike:1:stats owners 1
(integer) 1
127.0.0.1:6379> HGET bike:1:stats rides
"3"
127.0.0.1:6379> HMGET bike:1:stats owners crashes
1) "1"
2) "1"
```

## Field expiration 

In Valkey 9.0 we added the ability to associate an expiration time with a hash field. When set, the field and it's corresponding value are automatically deleted after the time has past. 
Once a hash field expiration time is past, it will no longer be available and all of the hash command APIs will treat this field as "nonexistent".
Note that expired hash fields are deleted via a periodic job.
For this reason it might take time between when fields logically expire and when hash fields are deleted.
During this time, logically expired fields still consume memory and some some hash commands (e.g. [`HLEN`](../commands/hlen.md)) might still take logically expired fields into account in hash object cardinality calculations.
Another side effect of using volatile fields (fields with time to live) in hash objects, is the ability to randomly choose from hash objects. When large hash objects have most of their volatile fields logically expired, some commands like [`HRANDFIELD`](../commands/hrandfield.md) might not be able to collect elements which are not logically expired and may return an empty reply.  

### Command API

[`HEXPIRE`](../commands/hexpire.md), [`HPEXPIRE`](../commands/hpexpire.md), [`HEXPIREAT`](../commands/hexpireat.md), [`HPEXPIREAT`](../commands/hpexpireat.md) and [`HPERSIST`](../commands/hpersist.md) commands are used in order to set or manipulate the expiration time of specific hash fields.

[`HEXPIRETIME`](../commands/hexpiretime.md), [`HEXPIRETIME`](../commands/hpexpiretime.md), [`HTTL`](../commands/httl.md) and [`HPTTL]`(../commands/hpttl.md) commands are used in order to query the expiration time of specific hash fields.

[`HSETEX`](../commands/hsetex.md) allows setting multiple hash fields and values while also associate an expiration time with each field.

[`HGETEX`](../commands/hgetex.md) allows fetching multiple hash fields values while also mutating their expiration time.

Note that some commands which override hash fields (e.g. `HSET` and `HMSET`) will remove an expiration time associated with a hash field.
The [`HSETEX`](../commands/hsetex.md) supports the `KEEPTTL` flag, which allows overriding hash fields without mutating their expiration time.

## Performance

Most Hash commands are O(1).

A few commands - such as `HKEYS`, `HVALS`, and `HGETALL` - are O(n), where _n_ is the number of field-value pairs.

## Limits

Every hash can store up to 4,294,967,295 (2^32 - 1) field-value pairs.
In practice, your hashes are limited only by the overall memory on the VMs hosting your Valkey deployment.
