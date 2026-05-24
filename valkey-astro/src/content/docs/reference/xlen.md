---
title: "XLEN"
description: "XLEN command reference documentation"
---

Returns the number of entries inside a stream. If the specified key does not
exist the command returns zero, as if the stream was empty.
However note that unlike other Valkey types, zero-length streams are
possible, so you should call `TYPE` or `EXISTS` in order to check if
a key exists or not.

Streams are not auto-deleted once they have no entries inside (for instance
after an `XDEL` call), because the stream may have consumer groups
associated with it.

## Examples

```
127.0.0.1:6379> XADD mystream * item 1
"1714701492011-0"
127.0.0.1:6379> XADD mystream * item 2
"1714701492021-0"
127.0.0.1:6379> XADD mystream * item 3
"1714701492031-0"
127.0.0.1:6379> XLEN mystream
(integer) 3
```
