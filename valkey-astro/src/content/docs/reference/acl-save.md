---
title: "ACL SAVE"
description: "ACL SAVE command reference documentation"
---

When Valkey is configured to use an ACL file (with the `aclfile` configuration
option), this command will save the currently defined ACLs from the server memory to the ACL file.

## Examples

```
127.0.0.1:6379> ACL SAVE
OK
127.0.0.1:6379> ACL SAVE
(error) ERR There was an error trying to save the ACLs. Please check the server logs for more information
```
