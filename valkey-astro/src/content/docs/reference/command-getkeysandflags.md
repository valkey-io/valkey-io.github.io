---
title: "COMMAND GETKEYSANDFLAGS"
description: "COMMAND GETKEYSANDFLAGS command reference documentation"
---

Returns @array-reply of keys from a full Valkey command and their usage flags.

`COMMAND GETKEYSANDFLAGS` is a helper command to let you find the keys from a full Valkey command together with flags indicating what each key is used for.

[`COMMAND`](command.md) provides information on how to find the key names of each command (see `firstkey`, [key specifications](../topics/key-specs.md#logical-operation-flags), and `movablekeys`),
but in some cases it's not possible to find keys of certain commands and then the entire command must be parsed to discover some / all key names.
You can use [`COMMAND GETKEYS`](command-getkeys.md) or `COMMAND GETKEYSANDFLAGS` to discover key names directly from how Valkey parses the commands.

Refer to [key specifications](../topics/key-specs.md#logical-operation-flags) for information about the meaning of the key flags.

## Examples

```
127.0.0.1:6379> COMMAND GETKEYS MSET a b c d e f
1) "a"
2) "c"
3) "e"
127.0.0.1:6379> COMMAND GETKEYS EVAL "not consulted" 3 key1 key2 key3 arg1 arg2 arg3 argN
1) "key1"
2) "key2"
3) "key3"
127.0.0.1:6379> COMMAND GETKEYSANDFLAGS LMOVE mylist1 mylist2 left left
1) 1) "mylist1"
   2) 1) RW
      2) access
      3) delete
2) 1) "mylist2"
   2) 1) RW
      2) insert
```
