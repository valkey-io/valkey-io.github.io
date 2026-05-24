---
title: "BITPOS"
description: "BITPOS command reference documentation"
---

Return the position of the first bit set to 1 or 0 in a string.

The position is returned, thinking of the string as an array of bits from left to
right, where the first byte's most significant bit is at position 0, the second
byte's most significant bit is at position 8, and so forth.

The same bit position convention is followed by [`GETBIT`](getbit.md) and [`SETBIT`](setbit.md).

By default, all the bytes contained in the string are examined.
It is possible to look for bits only in a specified interval by passing the additional arguments `start` and `end`. You can also just pass `start`, the operation will assume that the end is the last byte of the string. However there are semantic differences as explained later.
By default, the range is interpreted as a range of bytes and not a range of bits, so `start=0` and `end=2` means to look at the first three bytes.

You can use the optional `BIT` modifier to specify that the range should be interpreted as a range of bits.
So `start=0` and `end=2` means to look at the first three bits.

Note that bit positions are returned always as absolute values starting from bit zero even when `start` and `end` are used to specify a range.

Similar to the [`GETRANGE`](getrange.md) command, `start` and `end` can contain negative values in
order to index bytes starting from the end of the string, where -1 is the last
byte, -2 is the penultimate, and so forth. When `BIT` is specified, -1 is the last
bit, -2 is the penultimate, and so forth.

Non-existent keys are treated as empty strings.

## Examples

```
127.0.0.1:6379> SET mykey "\xff\xf0\x00"
OK
127.0.0.1:6379> BITPOS mykey 0
(integer) 12
127.0.0.1:6379> SET mykey "\x00\xff\xf0"
OK
127.0.0.1:6379> BITPOS mykey 1 0
(integer) 8
127.0.0.1:6379> BITPOS mykey 1 2
(integer) 16
127.0.0.1:6379> BITPOS mykey 1 2 -1 BYTE
(integer) 16
127.0.0.1:6379> BITPOS mykey 1 7 15 BIT
(integer) 8
127.0.0.1:6379> set mykey "\x00\x00\x00"
OK
127.0.0.1:6379> BITPOS mykey 1
(integer) -1
127.0.0.1:6379> BITPOS mykey 1 7 -3 BIT
(integer) -1
```
