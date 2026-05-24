---
title: "EVALSHA"
description: "EVALSHA command reference documentation"
---

Evaluate a script from the server's cache by its SHA1 digest.

The server caches scripts by using the [`SCRIPT LOAD`](script-load.md) command.
The command is otherwise identical to [`EVAL`](eval.md).

Please refer to the [Valkey Programmability](../topics/programmability.md) and [Introduction to Eval Scripts](../topics/eval-intro.md) for more information about Lua scripts.
