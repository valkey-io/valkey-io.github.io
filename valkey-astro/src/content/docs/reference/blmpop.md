---
title: "BLMPOP"
description: "BLMPOP command reference documentation"
---

`BLMPOP` is the blocking variant of [`LMPOP`](lmpop.md).

When any of the lists contains elements, this command behaves exactly like `LMPOP`.
When used inside a [`MULTI`](multi.md)/[`EXEC`](exec.md) block, this command behaves exactly like `LMPOP`.
When all lists are empty, Valkey will block the connection until another client pushes to it or until the `timeout` (a double value specifying the maximum number of seconds to block) elapses.
A `timeout` of zero can be used to block indefinitely.

See [`LMPOP`](lmpop.md) for more information.
