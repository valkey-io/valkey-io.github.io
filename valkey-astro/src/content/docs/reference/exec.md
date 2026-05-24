---
title: "EXEC"
description: "EXEC command reference documentation"
---

Executes all previously queued commands in a [transaction][tt] and restores the
connection state to normal.

[tt]: ../topics/transactions.md

When using `WATCH`, `EXEC` will execute commands only if the watched keys were
not modified, allowing for a [check-and-set mechanism][ttc].

[ttc]: ../topics/transactions.md#cas
