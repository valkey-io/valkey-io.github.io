---
title: "CLIENT SETINFO"
description: "CLIENT SETINFO command reference documentation"
---

The `CLIENT SETINFO` command assigns various info attributes to the current connection which are displayed in the output of [`CLIENT LIST`](client-list.md) and [`CLIENT INFO`](client-info.md).

Client libraries are expected to pipeline this command after authentication on all connections
and ignore failures since they could be connected to an older version that doesn't support them.

Currently the supported attributes are:
* `lib-name` - meant to hold the name of the client library that's in use.
* `lib-ver` - meant to hold the client library's version.

There is no limit to the length of these attributes. However it is not possible to use spaces, newlines, or other non-printable characters that would violate the format of the `CLIENT LIST` reply.

Note that these attributes are **not** cleared by the [`RESET`](reset.md) command.
