---
title: "CLIENT REPLY"
description: "CLIENT REPLY command reference documentation"
---

Sometimes it can be useful for clients to completely disable replies from the Valkey server. For example when the client sends fire and forget commands or performs a mass loading of data, or in caching contexts where new data is streamed constantly. In such contexts to use server time and bandwidth in order to send back replies to clients, which are going to be ignored, is considered wasteful.

The `CLIENT REPLY` command controls whether the server will reply the client's commands. The following modes are available:

* `ON`. This is the default mode in which the server returns a reply to every command.
* `OFF`. In this mode the server will not reply to client commands.
* `SKIP`. This mode skips the reply of command immediately after it.

**Note:**
Starting with Valkey 9.0, the `CLIENT REPLY` command is disallowed inside a transaction `(MULTI/EXEC)`. In earlier versions, using `CLIENT REPLY` within a transaction could corrupt the reply stream. Attempting to use it within a transaction now results in an error reply.