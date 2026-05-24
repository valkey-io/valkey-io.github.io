---
title: "SCRIPT LOAD"
description: "SCRIPT LOAD command reference documentation"
---

Load a script into the scripts cache, without executing it.
After the specified command is loaded into the script cache it will be callable
using [`EVALSHA`](evalsha.md) with the correct SHA1 digest of the script, exactly like after
the first successful invocation of [`EVAL`](eval.md).

The script is guaranteed to stay in the script cache forever (unless [`SCRIPT
FLUSH`](script-flush.md) is called).

The command works in the same way even if the script was already present in the
script cache.

For more information about `EVAL` scripts please refer to [Introduction to Eval Scripts](../topics/eval-intro.md).
