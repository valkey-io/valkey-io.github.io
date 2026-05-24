---
title: "COMMAND INFO"
description: "COMMAND INFO command reference documentation"
---

Returns @array-reply of details about multiple Valkey commands.

Same result format as [`COMMAND`](command.md) except you can specify which commands
get returned.

If you request details about non-existing commands, their return
position will be nil.

## Examples

```
127.0.0.1:6379> COMMAND INFO get set eval
1)  1) "get"
    2) (integer) 2
    3) 1) readonly
       2) fast
    4) (integer) 1
    5) (integer) 1
    6) (integer) 1
    7) 1) @read
       2) @string
       3) @fast
    8) (empty array)
    9) 1) 1) "flags"
          2) 1) RO
             2) access
          3) "begin_search"
          4) 1) "type"
             2) "index"
             3) "spec"
             4) 1) "index"
                2) (integer) 1
          5) "find_keys"
          6) 1) "type"
             2) "range"
             3) "spec"
             4) 1) "lastkey"
                2) (integer) 0
                3) "keystep"
                4) (integer) 1
                5) "limit"
                6) (integer) 0
   10) (empty array)
2)  1) "set"
    2) (integer) -3
    3) 1) write
       2) denyoom
    4) (integer) 1
    5) (integer) 1
    6) (integer) 1
    7) 1) @write
       2) @string
       3) @slow
    8) (empty array)
    9) 1) 1) "notes"
          2) "RW and ACCESS due to the optional `GET` argument"
          3) "flags"
          4) 1) RW
             2) access
             3) update
             4) variable_flags
          5) "begin_search"
          6) 1) "type"
             2) "index"
             3) "spec"
             4) 1) "index"
                2) (integer) 1
          7) "find_keys"
          8) 1) "type"
             2) "range"
             3) "spec"
             4) 1) "lastkey"
                2) (integer) 0
                3) "keystep"
                4) (integer) 1
                5) "limit"
                6) (integer) 0
   10) (empty array)
3)  1) "eval"
    2) (integer) -3
    3) 1) noscript
       2) stale
       3) skip_monitor
       4) no_mandatory_keys
       5) movablekeys
    4) (integer) 0
    5) (integer) 0
    6) (integer) 0
    7) 1) @slow
       2) @scripting
    8) (empty array)
    9) 1) 1) "notes"
          2) "We cannot tell how the keys will be used so we assume the worst, RW and UPDATE"
          3) "flags"
          4) 1) RW
             2) access
             3) update
          5) "begin_search"
          6) 1) "type"
             2) "index"
             3) "spec"
             4) 1) "index"
                2) (integer) 2
          7) "find_keys"
          8) 1) "type"
             2) "keynum"
             3) "spec"
             4) 1) "keynumidx"
                2) (integer) 0
                3) "firstkey"
                4) (integer) 1
                5) "keystep"
                6) (integer) 1
   10) (empty array)
127.0.0.1:6379> COMMAND INFO foo evalsha config bar
1) (nil)
2)  1) "evalsha"
    2) (integer) -3
    3) 1) noscript
       2) stale
       3) skip_monitor
       4) no_mandatory_keys
       5) movablekeys
    4) (integer) 0
    5) (integer) 0
    6) (integer) 0
    7) 1) @slow
       2) @scripting
    8) (empty array)
    9) 1) 1) "flags"
          2) 1) RW
             2) access
             3) update
          3) "begin_search"
          4) 1) "type"
             2) "index"
             3) "spec"
             4) 1) "index"
                2) (integer) 2
          5) "find_keys"
          6) 1) "type"
             2) "keynum"
             3) "spec"
             4) 1) "keynumidx"
                2) (integer) 0
                3) "firstkey"
                4) (integer) 1
                5) "keystep"
                6) (integer) 1
   10) (empty array)
3)  1) "config"
    2) (integer) -2
    3) (empty array)
    4) (integer) 0
    5) (integer) 0
    6) (integer) 0
    7) 1) @slow
    8) (empty array)
    9) (empty array)
   10) 1)  1) "config|rewrite"
           2) (integer) 2
           3) 1) admin
              2) noscript
              3) loading
              4) stale
           4) (integer) 0
           5) (integer) 0
           6) (integer) 0
           7) 1) @admin
              2) @slow
              3) @dangerous
           8) 1) "request_policy:all_nodes"
              2) "response_policy:all_succeeded"
           9) (empty array)
          10) (empty array)
       2)  1) "config|resetstat"
           2) (integer) 2
           3) 1) admin
              2) noscript
              3) loading
              4) stale
           4) (integer) 0
           5) (integer) 0
           6) (integer) 0
           7) 1) @admin
              2) @slow
              3) @dangerous
           8) 1) "request_policy:all_nodes"
              2) "response_policy:all_succeeded"
           9) (empty array)
          10) (empty array)
       3)  1) "config|help"
           2) (integer) 2
           3) 1) loading
              2) stale
           4) (integer) 0
           5) (integer) 0
           6) (integer) 0
           7) 1) @slow
           8) (empty array)
           9) (empty array)
          10) (empty array)
       4)  1) "config|get"
           2) (integer) -3
           3) 1) admin
              2) noscript
              3) loading
              4) stale
           4) (integer) 0
           5) (integer) 0
           6) (integer) 0
           7) 1) @admin
              2) @slow
              3) @dangerous
           8) (empty array)
           9) (empty array)
          10) (empty array)
       5)  1) "config|set"
           2) (integer) -4
           3) 1) admin
              2) noscript
              3) loading
              4) stale
           4) (integer) 0
           5) (integer) 0
           6) (integer) 0
           7) 1) @admin
              2) @slow
              3) @dangerous
           8) 1) "request_policy:all_nodes"
              2) "response_policy:all_succeeded"
           9) (empty array)
          10) (empty array)
4) (nil)
```
