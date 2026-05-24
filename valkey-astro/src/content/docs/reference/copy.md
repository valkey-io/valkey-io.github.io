---
title: "COPY"
description: "COPY command reference documentation"
---

This command copies the value stored at the `source` key to the `destination`
key.

By default, the `destination` key is created in the logical database used by the
connection. The `DB` option allows specifying an alternative logical database
index for the destination key. The `REPLACE` option removes the `destination`
key before copying the value to it.

The command returns zero when the `source` key does not exist or when the
`destination` key already exists and the `REPLACE` option is not specified.

When the `DB` option is used, the caller must have ACL permission to access
the specified destination database. See
[database permissions](../topics/acl.md#database-permissions).

## Examples

```
SET dolly "sheep"
COPY dolly clone
GET clone
```
