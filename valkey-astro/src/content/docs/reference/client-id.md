---
title: "CLIENT ID"
description: "CLIENT ID command reference documentation"
---

The command just returns the ID of the current connection. Every connection
ID has certain guarantees:

1. It is never repeated, so if `CLIENT ID` returns the same number, the caller can be sure that the underlying client did not disconnect and reconnect the connection, but it is still the same connection.
2. The ID is monotonically incremental. If the ID of a connection is greater than the ID of another connection, it is guaranteed that the second connection was established with the server at a later time.

This command is especially useful together with [`CLIENT UNBLOCK`](client-unblock.md).
Check the `CLIENT UNBLOCK` command page for a pattern involving the two commands.

## Examples

```
127.0.0.1:6379> CLIENT ID
(integer) 2873
```
