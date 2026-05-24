---
title: "COMMAND DOCS"
description: "COMMAND DOCS command reference documentation"
---

Return documentary information about commands.

By default, the reply includes all of the server's commands.
You can use the optional _command-name_ argument to specify the names of one or more commands.

The reply includes a map for each returned command.
The following keys may be included in the mapped reply:

* **summary:** short command description.
* **since:** the Valkey version that added the command (or for module commands, the module version).
* **group:** the functional group to which the command belongs.
  Possible values are:
  - _bitmap_
  - _cluster_
  - _connection_
  - _generic_
  - _geo_
  - _hash_
  - _hyperloglog_
  - _list_
  - _module_
  - _pubsub_
  - _scripting_
  - _sentinel_
  - _server_
  - _set_
  - _sorted-set_
  - _stream_
  - _string_
  - _transactions_
* **complexity:** a short explanation about the command's time complexity.
* **doc_flags:** an array of documentation flags.
  Possible values are:
  - _deprecated:_ the command is deprecated.
  - _syscmd:_ a system command that isn't meant to be called by users.
* **deprecated_since:** the Valkey version that deprecated the command (or for module commands, the module version)..
* **replaced_by:** the alternative for a deprecated command.
* **history:** an array of historical notes describing changes to the command's output or arguments. It should not contain information about behavioral changes.
  Each entry is an array itself, made up of two elements:
  1. The Valkey version that the entry applies to.
  2. The description of the change.
* **arguments:** an array of maps that describe the command's arguments.
  Please refer to the [Valkey command arguments][td] page for more information.

[td]: ../topics/command-arguments.md

## Examples

```
127.0.0.1:6379> COMMAND DOCS SET
1) "set"
2)  1) "summary"
    2) "Sets the string value of a key, ignoring its type. The key is created if it doesn't exist."
    3) "since"
    4) "1.0.0"
    5) "group"
    6) "string"
    7) "complexity"
    8) "O(1)"
    9) "history"
   10) 1) 1) "2.6.12"
          2) "Added the `EX`, `PX`, `NX` and `XX` options."
       2) 1) "6.0.0"
          2) "Added the `KEEPTTL` option."
       3) 1) "6.2.0"
          2) "Added the `GET`, `EXAT` and `PXAT` option."
       4) 1) "7.0.0"
          2) "Allowed the `NX` and `GET` options to be used together."
   11) "arguments"
   12) 1) 1) "name"
          2) "key"
          3) "type"
          4) "key"
          5) "display_text"
          6) "key"
          7) "key_spec_index"
          8) (integer) 0
       2) 1) "name"
          2) "value"
          3) "type"
          4) "string"
          5) "display_text"
          6) "value"
       3)  1) "name"
           2) "condition"
           3) "type"
           4) "oneof"
           5) "since"
           6) "2.6.12"
           7) "flags"
           8) 1) optional
           9) "arguments"
          10) 1) 1) "name"
                 2) "nx"
                 3) "type"
                 4) "pure-token"
                 5) "display_text"
                 6) "nx"
                 7) "token"
                 8) "NX"
              2) 1) "name"
                 2) "xx"
                 3) "type"
                 4) "pure-token"
                 5) "display_text"
                 6) "xx"
                 7) "token"
                 8) "XX"
       4)  1) "name"
           2) "get"
           3) "type"
           4) "pure-token"
           5) "display_text"
           6) "get"
           7) "token"
           8) "GET"
           9) "since"
          10) "6.2.0"
          11) "flags"
          12) 1) optional
       5) 1) "name"
          2) "expiration"
          3) "type"
          4) "oneof"
          5) "flags"
          6) 1) optional
          7) "arguments"
          8) 1)  1) "name"
                 2) "seconds"
                 3) "type"
                 4) "integer"
                 5) "display_text"
                 6) "seconds"
                 7) "token"
                 8) "EX"
                 9) "since"
                10) "2.6.12"
             2)  1) "name"
                 2) "milliseconds"
                 3) "type"
                 4) "integer"
                 5) "display_text"
                 6) "milliseconds"
                 7) "token"
                 8) "PX"
                 9) "since"
                10) "2.6.12"
             3)  1) "name"
                 2) "unix-time-seconds"
                 3) "type"
                 4) "unix-time"
                 5) "display_text"
                 6) "unix-time-seconds"
                 7) "token"
                 8) "EXAT"
                 9) "since"
                10) "6.2.0"
             4)  1) "name"
                 2) "unix-time-milliseconds"
                 3) "type"
                 4) "unix-time"
                 5) "display_text"
                 6) "unix-time-milliseconds"
                 7) "token"
                 8) "PXAT"
                 9) "since"
                10) "6.2.0"
             5)  1) "name"
                 2) "keepttl"
                 3) "type"
                 4) "pure-token"
                 5) "display_text"
                 6) "keepttl"
                 7) "token"
                 8) "KEEPTTL"
                 9) "since"
                10) "6.0.0"
```
