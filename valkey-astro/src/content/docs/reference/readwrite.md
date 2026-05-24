---
title: "READWRITE"
description: "READWRITE command reference documentation"
---

Disables read queries for a connection to a Valkey replica node.

Read queries against a Valkey Cluster replica node are disabled by default.

For standalone replica nodes, since Valkey 8.0, read queries are also disabled
for clients that have executed the [`CLIENT CAPA redirect`](client-capa.md) command.

But you can use the [`READONLY`](readonly.md) command to change this behavior on a per-
connection basis. The `READWRITE` command resets the readonly mode flag
of a connection back to readwrite.
