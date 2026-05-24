---
title: "COMMANDLOG GET"
description: "COMMANDLOG GET command reference documentation"
---

The `COMMANDLOG GET` command returns entries from the command log of specified type in chronological order.

The Command Log system is used to record commands that consume significant resources during server operation, including CPU, memory, and network bandwidth.
These commands and the data they access may lead to abnormal instance operations, the command log can help users quickly and intuitively locate issues.

Currently, three types of command logs are supported:

* SLOW: Logs commands that exceed a specified execution time. This excludes time spent on I/O operations like client communication and focuses solely on the command's processing time, where the main thread is blocked.

* LARGE-REQUEST: Logs commands with requests exceeding a defined size. This helps identify potentially problematic commands that send excessive data to the server.

* LARGE-REPLY: Logs commands that generate replies exceeding a defined size. This helps identify commands that return unusually large amounts of data, which may impact network performance or client processing.

Each log type has two key parameters:
1. A threshold value that determines when a command is logged. This threshold is specific to the type of log (e.g., execution time, request size, or reply size). A negative value disables logging. A value of 0 logs all commands.
2. A maximum length that specifies the number of entries to retain in the log. Increasing the length allows more entries to be stored but consumes additional memory. To clear all entries for a specific log type and reclaim memory, use the [`COMMANDLOG RESET`](commandlog-reset.md) subcommand followed by the log type.

See the details of configurations in valkey.conf.

Each entry from the specific type of command log is comprised of the following six values:

1. A unique progressive identifier for every entry.
2. The unix timestamp at which the logged command was processed.
3. Each type of command log has its own meaning, currently there are three types:
    * time in microseconds for type of slow
    * size in bytes for type of large-request
    * size in bytes for type of large-reply
4. The array composing the arguments of the command.
5. Client peer information (e.g. Client IP address and port for TCP connected clients or unix path for unix sockets).
6. Client name if set via the [`CLIENT SETNAME`](client-setname.md) command.

The entry's unique ID can be used in order to avoid processing command log entries multiple times (for instance you may have a script sending you an email alert for every new command log entry).
The ID is never reset in the course of the Valkey server execution, even after [`COMMANDLOG RESET`](commandlog-reset.md) was executed. In order to reset the ID a server restart is needed.
