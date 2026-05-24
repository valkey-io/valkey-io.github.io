---
title: "SETRANGE"
description: "SETRANGE command reference documentation"
---

Overwrites part of the string stored at _key_, starting at the specified offset,
for the entire length of _value_.
If the offset is larger than the current length of the string at _key_, the
string is padded with zero-bytes to make _offset_ fit.
Non-existing keys are considered as empty strings, so this command will make
sure it holds a string large enough to be able to set _value_ at _offset_.

Note that the maximum offset that you can set is 2^29 -1 (536870911), as Valkey
Strings are limited to 512 megabytes.
If you need to grow beyond this size, you can use multiple keys.

**Warning**: When setting the last possible byte and the string value stored at
_key_ does not yet hold a string value, or holds a small string value, Valkey
needs to allocate all intermediate memory which can block the server for some
time.
On a 2010 MacBook Pro, setting byte number 536870911 (512MB allocation) takes
~300ms, setting byte number 134217728 (128MB allocation) takes ~80ms, setting
bit number 33554432 (32MB allocation) takes ~30ms and setting bit number 8388608
(8MB allocation) takes ~8ms.
Note that once this first allocation is done, subsequent calls to `SETRANGE` for
the same _key_ will not have the allocation overhead.

## Patterns

Thanks to `SETRANGE` and the analogous `GETRANGE` commands, you can use Valkey
strings as a linear array with O(1) random access.
This is a very fast and efficient storage in many real world use cases.

## Examples

Basic usage:

```
127.0.0.1:6379> SET key1 "Hello World"
OK
127.0.0.1:6379> SETRANGE key1 6 "Valkey"
(integer) 12
127.0.0.1:6379> GET key1
"Hello Valkey"
```

Example of zero padding:

```
127.0.0.1:6379> SETRANGE key2 6 "Valkey"
(integer) 12
127.0.0.1:6379> GET key2
"\x00\x00\x00\x00\x00\x00Valkey"
```
