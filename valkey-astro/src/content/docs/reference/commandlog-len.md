---
title: "COMMANDLOG LEN"
description: "COMMANDLOG LEN command reference documentation"
---

The `COMMANDLOG LEN` command returns the current number of entries in the specified type of command log.

A new entry is added to the specified command log whenever a command exceeds the corresponding threshold. There are currently three different types of command log, each with an independent threshold, including `commandlog-execution-slower-than`, `commandlog-request-larger-than`, and `commandlog-reply-larger-than`.

The maximum number of entries in the different command log is governed by the `commandlog-slow-execution-max-len`, `commandlog-large-request-max-len` and `commandlog-large-reply-max-len` configurations.

Once the command log reaches its maximal size, the oldest entry is removed whenever a new entry is created.

The command log can be cleared with the [`COMMANDLOG RESET`](commandlog-reset.md) command.
