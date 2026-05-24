---
title: "SCRIPT SHOW"
description: "SCRIPT SHOW command reference documentation"
---

Returns the original source code of a script in the script cache.

This command accepts a SHA1 digest and returns the original script's source code if the script is present in the script cache.
It is intended primary for debugging, allowing users to introspect the contents of a script when they do not have direct access to it.
For example, an admin may only have access to a script's SHA1 from the monitor or slowlog and needs to determine the script's contents for debugging.

For more information about `EVAL` scripts please refer to [Introduction to Eval Scripts](../topics/eval-intro.md).
