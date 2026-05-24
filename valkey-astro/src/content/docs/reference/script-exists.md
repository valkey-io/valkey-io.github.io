---
title: "SCRIPT EXISTS"
description: "SCRIPT EXISTS command reference documentation"
---

Returns information about the existence of the scripts in the script cache.

This command accepts one or more SHA1 digests and returns a list of ones or
zeros to signal if the scripts are already defined or not inside the script
cache.
This can be useful before a pipelining operation to ensure that scripts are
loaded (and if not, to load them using [`SCRIPT LOAD`](script-load.md)) so that the pipelining
operation can be performed solely using [`EVALSHA`](evalsha.md) instead of [`EVAL`](eval.md) to save
bandwidth.

For more information about `EVAL` scripts please refer to [Introduction to Eval Scripts](../topics/eval-intro.md).
