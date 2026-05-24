---
title: "FUNCTION FLUSH"
description: "FUNCTION FLUSH command reference documentation"
---

Deletes all the libraries.

Unless called with the optional mode argument, the `lazyfree-lazy-user-flush` configuration directive sets the effective behavior. Valid modes are:

* `ASYNC`: Asynchronously flush the libraries.
* `!SYNC`: Synchronously flush the libraries.

For more information please refer to [Introduction to Valkey Functions](../topics/functions-intro.md).
