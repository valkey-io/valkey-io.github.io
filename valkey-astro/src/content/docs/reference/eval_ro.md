---
title: "EVAL_RO"
description: "EVAL_RO command reference documentation"
---

This is a read-only variant of the [`EVAL`](eval.md) command that cannot execute commands that modify data.

For more information about when to use this command vs `EVAL`, please refer to [Read-only scripts](../topics/programmability.md#read-only-scripts).

For more information about `EVAL` scripts please refer to [Introduction to Eval Scripts](../topics/eval-intro.md).

## Examples

```
> SET mykey "Hello"
OK

> EVAL_RO "return server.call('GET', KEYS[1])" 1 mykey
"Hello"

> EVAL_RO "return server.call('DEL', KEYS[1])" 1 mykey
(error) ERR Error running script (call to b0d697da25b13e49157b2c214a4033546aba2104): @user_script:1: @user_script: 1: Write commands are not allowed from read-only scripts.
```
