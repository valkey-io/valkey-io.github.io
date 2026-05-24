---
title: "DUMP"
description: "DUMP command reference documentation"
---

Serialize the value stored at key in a Valkey-specific format and return it to
the user.
The returned value can be synthesized back into a Valkey key using the [`RESTORE`](restore.md)
command.

The serialization format is opaque and non-standard, however it has a few
semantic characteristics:

* It contains a 64-bit checksum that is used to make sure errors will be
  detected.
  The `RESTORE` command makes sure to check the checksum before synthesizing a
  key using the serialized value.
* Values are encoded in the same format used by RDB.
* An RDB version is encoded inside the serialized value, so that different Valkey
  versions with incompatible RDB formats will refuse to process the serialized
  value.

The serialized value does NOT contain expire information.
In order to capture the time to live of the current value the [`PTTL`](pttl.md) command
should be used.

If `key` does not exist a nil bulk reply is returned.

## Examples

```
> SET mykey 10
OK
> DUMP mykey
"\x00\xc0\n\n\x00n\x9fWE\x0e\xaec\xbb"
```
