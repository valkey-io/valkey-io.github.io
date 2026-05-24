---
title: "COMMAND LIST"
description: "COMMAND LIST command reference documentation"
---

Return an array of the server's command names.

You can use the optional _FILTERBY_ modifier to apply one of the following filters:

 - **MODULE module-name**: get the commands that belong to the module specified by _module-name_.
 - **ACLCAT category**: get the commands in the [ACL category](../topics/acl.md#command-categories) specified by _category_.
 - **PATTERN pattern**: get the commands that match the given glob-like _pattern_.
