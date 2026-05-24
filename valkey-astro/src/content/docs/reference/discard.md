---
title: "DISCARD"
description: "DISCARD command reference documentation"
---

Flushes all previously queued commands in a [transaction][tt] and restores the
connection state to normal.

[tt]: ../topics/transactions.md

If `WATCH` was used, `DISCARD` unwatches all keys watched by the connection.
