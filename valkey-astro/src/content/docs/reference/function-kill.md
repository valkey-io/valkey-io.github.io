---
title: "FUNCTION KILL"
description: "FUNCTION KILL command reference documentation"
---

Kill a function that is currently executing.


The `FUNCTION KILL` command can be used only on functions that did not modify the dataset during their execution (since stopping a read-only function does not violate the scripting engine's guaranteed atomicity).

For more information please refer to [Introduction to Valkey Functions](../topics/functions-intro.md).
