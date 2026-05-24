---
title: "Data types"
description: Overview of data types supported by Valkey
---

Valkey is a data structure server.
At its core, Valkey provides a collection of native data types that help you solve a wide variety of problems, from [caching](client-side-caching.md) to [queuing](lists.md) to [event processing](streams-intro.md).
Below is a short description of each data type, with links to broader overviews and command references.

If you'd like to try a comprehensive tutorial for each data structure, see their overview pages below.

## Strings

[Strings](strings.md) are the most basic Valkey data type, representing a sequence of bytes.
For more information, see:

* [Overview of Strings](strings.md)
* [String command reference](../commands/#string)

## Lists

[Lists](lists.md) are lists of strings sorted by insertion order.
For more information, see:

* [Overview of Lists](lists.md)
* [List command reference](../commands/#list)

## Sets

[Sets](sets.md) are unordered collections of unique strings that act like the sets from your favorite programming language (for example, [Java HashSets](https://docs.oracle.com/javase/7/docs/api/java/util/HashSet.html), [Python sets](https://docs.python.org/3.10/library/stdtypes.html#set-types-set-frozenset), and so on).
With a Set, you can add, remove, and test for existence in O(1) time (in other words, regardless of the number of set elements).
For more information, see:

* [Overview of Sets](sets.md)
* [Set command reference](../commands/#set)

## Hashes

[Hashes](hashes.md) are record types modeled as collections of field-value pairs.
As such, Hashes resemble [Python dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries), [Java HashMaps](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html), and [Ruby hashes](https://ruby-doc.org/core-3.1.2/Hash.html).
For more information, see:

* [Overview of Hashes](hashes.md)
* [Hashes command reference](../commands/#hash)

## Sorted sets

[Sorted Sets](sorted-sets.md) are collections of unique strings that maintain order by each string's associated score.
For more information, see:

* [Overview of Sorted Sets](sorted-sets.md)
* [Sorted Set command reference](../commands/#sorted-set)

## Streams

A [Stream](streams-intro.md) is a data structure that acts like an append-only log.
Streams help record events in the order they occur and then syndicate them for processing.
For more information, see:

* [Overview of Streams](streams-intro.md)
* [Streams command reference](../commands/#stream)

## Geospatial indexes

[Geospatial indexes](geospatial.md) are useful for finding locations within a given geographic radius or bounding box.
For more information, see:

* [Overview of Geospatial indexes](geospatial.md)
* [Geospatial indexes command reference](../commands/#geo)

## Bitmaps

[Bitmaps](bitmaps.md) let you perform bitwise operations on strings. 
For more information, see:

* [Overview of Bitmaps](bitmaps.md)
* [Bitmap command reference](../commands/#bitmap)

## Bitfields

[Bitfields](bitfields.md) efficiently encode multiple counters in a string value.
Bitfields provide atomic get, set, and increment operations and support different overflow policies.
For more information, see:

* [Overview of Bitfields](bitfields.md)
* The `BITFIELD` command.

## HyperLogLog

The [HyperLogLog](hyperloglogs.md) data structures provide probabilistic estimates of the cardinality (i.e., number of elements) of large sets. For more information, see:

* [Overview of HyperLogLog](hyperloglogs.md)
* [HyperLogLog command reference](../commands/#hyperloglog)

## Bloom Filter

[Bloom filters](bloomfilters.md) are a space efficient probabilistic data structure that allows adding elements and checking if item/s are definitely not present, or if there is a possibility they exist (with the configured false positive rate).

The Bloom filter data type / command support is provided by the `valkey-bloom` module.
For more information, see:

* [Overview of Bloom Filters](bloomfilters.md)
* [Bloom filter command reference](../commands/#bloom)
* [Valkey-bloom module on GitHub](https://github.com/valkey-io/valkey-bloom/)

## Extensions

To extend the features provided by the included data types, use one of these options:

1. Write your own custom [server-side functions in Lua](programmability.md).
2. Write your own Valkey module using [Modules Introduction](modules-intro.md) and [Modules API](modules-api-ref.md).
