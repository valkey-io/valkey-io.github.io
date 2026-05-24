---
title: "ACL LIST"
description: "ACL LIST command reference documentation"
---

The command shows the currently active ACL rules in the Valkey server. Each
line in the returned array defines a different user, and the format is the
same used in the valkey.conf file or the external ACL file, so you can
cut and paste what is returned by the ACL LIST command directly inside a
configuration file if you wish (but make sure to check [`ACL SAVE`](acl-save.md)).

## Examples

```
127.0.0.1:6379> ACL LIST
1) "user antirez on #9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 ~objects:* &* +@all -@admin -@dangerous"
2) "user default on nopass ~* &* +@all"
```
