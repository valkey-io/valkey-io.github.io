---
title: "MODULE UNLOAD"
description: "MODULE UNLOAD command reference documentation"
---

Unloads a module.

This command unloads the module specified by `name`. Note that the module's name
is reported by the [`MODULE LIST`](module-list.md) command, and may differ from the dynamic
library's filename.

Known limitations:

*   Modules that register custom data types can not be unloaded.
