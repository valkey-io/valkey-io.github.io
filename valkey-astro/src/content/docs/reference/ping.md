---
title: "PING"
description: "PING command reference documentation"
---

Returns `PONG` if no argument is provided, otherwise return a copy of the
argument as a bulk.
This command is useful for:
1. Testing whether a connection is still alive.
1. Verifying the server's ability to serve data - an error is returned when this isn't the case (e.g., during load from persistence or accessing a stale replica).
1. Measuring latency.

If the client is in RESP2 and is subscribed to a channel or a pattern, it will instead return a
multi-bulk with a "pong" in the first position and an empty bulk in the second
position, unless an argument is provided in which case it returns a copy
of the argument.

## Examples

```
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> 
127.0.0.1:6379> PING "hello world"
"hello world"
```
