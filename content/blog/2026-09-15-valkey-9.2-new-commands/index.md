+++
title = "What’s New in Valkey 9.2: Commands and Options Developers Should Know"
date = 2026-09-15
description = "Exploring Valkey's new 9.2 commands as well as options developers should know, with practical examples of how to use most of them in your deployment." 
authors =  ["dragosandriciuc"]
[taxonomies]
blog_type = ["Community Highlight"]
+++

<!-- Some Valkey 9.2 features covered here are still under development and their syntax or behavior may change before release. In particular, feedback is welcome on the sections covering MULTIIF, XACKDEL, and other recently proposed command changes -->

With the arrival of Valkey 9.2, this is a good time to go over some of the new commands that have been added and see what changes they can bring to your deployment. We'll take a look at what these new commands are and give a few examples on how to use them, as well as refreshing your knowledge on some of the already existing commands that haven't been covered from previous releases.

Valkey 9.2 gives applications more precise control over operations and more precise information about their results.

## `MULTIIF` for optimistic-locking workflows

<!-- The feature is still being finalized: it started life as a dedicated MULTIIF command, but recent core-team discussion is leaning toward folding the conditions into EXEC itself (e.g. EXEC IFEQ key value, EXEC NX key, EXEC XX key). Ask about it's functionality once merged.
-->

Starting off with one of the newest proposed commands added in the 9.2 update, `MULTIIF`. This command allows you to attach transaction preconditions before `EXEC`, avoiding the extra `WATCH` round trip that trips up pipelined clients.

Consider the following example:

    ```bash
    127.0.0.1:6599> WATCH ver{foo}
    127.0.0.1:6599> GET ver{foo}
    127.0.0.1:6599> MULTI
    127.0.0.1:6599> SET ver{foo} <new> IFEQ <old>
    127.0.0.1:6599> SET mykey{foo}1 111
    127.0.0.1:6599> SET mykey{foo}2 222
    127.0.0.1:6599> EXEC
    ```

Now with the updated command, you can do:

    ```bash
    127.0.0.1:6599> SET ver{foo} 1
    OK
    127.0.0.1:6599> GET ver{foo}
    "1"
    127.0.0.1:6599> MULTIIF ver{foo} EQ 1
    OK
    127.0.0.1:6599> SET ver{foo} 2
    QUEUED
    127.0.0.1:6599> SET mykey{foo}1 111
    QUEUED
    127.0.0.1:6599> SET mykey{foo}2 222
    QUEUED
    127.0.0.1:6599> EXEC
    1) OK
    2) OK
    3) OK
    ```

The transaction executes as expected, but the real value of `MULTIIF` shows up when another client changes `ver{foo}` after you've read it but before your `EXEC` runs. With the old `WATCH`-based approach, `WATCH` handles that detection with an extra round trip. However here the same protection comes from the precondition attached at `MULTIIF` time:

    ```bash
    Client A:  GET ver{foo}
    "1"
    Client A:  MULTIIF ver{foo} EQ 1
    OK
    Client A:  SET ver{foo} 2
    QUEUED
    Client A:  SET mykey{foo}1 111
    QUEUED
    Client A:  SET mykey{foo}2 222
    QUEUED
    Client B:  SET ver{foo} 99
    OK (a concurrent write sneaks in)
    Client A:  EXEC
    (nil)
    ```

Because `ver{foo}` no longer equals `1` by the time `EXEC` runs, the entire transaction is discarded: `ver{foo}` is left at Client B's `99`, and neither `mykey{foo}1` nor `mykey{foo}2` is ever written. That's the same safety `WATCH` provides, without the extra round trip to set it up.

<!-- To add: For more information see the [MULTI command documentation](https://valkey.io/commands/multi/) OR EXEC command link. It's still being discussed. -->

## `XACKDEL` to delete acknowledged messages

<!-- The feature is still being finalized. -->

`XACKDEL` is a stream command that acknowledges one or more messages and (conditionally) deletes them from the stream.

**Note:** This is particularly useful when multiple consumer groups independently process the same stream and you need to reclaim entries without deleting messages that another group still needs.

It works by periodically reclaiming space once messages are acknowledged by all groups. You could use a Lua script that replicates the `XACKDEL` logic, but `XACKDEL` together with `ACKED` mode makes Lua script unnecessary.

The command supports the following deletion modes:

- `KEEPREF` (default, implicit): acknowledges and deletes messages immediately, leaving `PEL` references in other groups
- `ACKED`: deletes messages only once every consumer group has acknowledged or passed the message, making it safe for fan-out stream topologies, if a message was acknowledged but not deleted then the response is 2
- `DELREF`: acknowledges, deletes, and forcibly removes PEL entries from all other groups, it shares its deletion semantics with `XDELEX` below, which shows `ACKED` mode in action

## `XDELEX` to delete stream messages

<!-- The feature is still being finalized. -->

`XDELEX` is an extension of the Valkey Streams [`XDEL` command](https://valkey.io/commands/xdel/) that allows you to delete one or more stream messages with more control over how those message entries are deleted concerning consumer groups.

The command supports three deletion modes:

- `KEEPREF` (default): Deletes the stream entry but leaves PEL references intact in all consumer groups
- `DELREF`: Deletes the stream entry and forcibly removes it from all consumer group PELs
- `ACKED`: Only deletes the entry once every consumer group has acknowledged or passed it — safe for fan-out topologies

**Note:** The command returns a per-ID integer array: 1 for deleted, 2 for exists-but-not-yet-deletable (ACKED mode only), and -1 for not found.

Consider the following example of `ACKED` mode in action:

    ```bash
    127.0.0.1:6899> XADD s4 * a 1
    "1788346731590-0"
    127.0.0.1:6899> XGROUP CREATE s4 grp 0
    OK
    127.0.0.1:6899> XREADGROUP GROUP grp cons1 COUNT 10 STREAMS s4 >
    1) 1) "s4"
        2) 1) 1) "1788346731590-0"
                2) 1) "a"
                   2) "1"
    127.0.0.1:6899> XDELEX s4 ACKED IDS 1 1788346731590-0
    1) (integer) 2
    127.0.0.1:6899> XLEN s4
    (integer) 1
    127.0.0.1:6899> XACK s4 grp 1788346731590-0
    (integer) 1
    127.0.0.1:6899> XDELEX s4 ACKED IDS 1 1788346731590-0
    1) (integer) 1
    127.0.0.1:6899> XLEN s4
    (integer) 0
    ```

**Note:** Your `XADD` will return a different ID, ensure you substitute it throughout.

From the above example you can see that the first `XDELEX ... ACKED` call returns `2`, the message still isn't deleted because `grp` hasn't acknowledged it yet, and `XLEN` confirms it's still in the stream. Once `XACK` explicitly acknowledges it for `grp`, the same `XDELEX ... ACKED` call returns `1` and `XLEN` drops to `0` which means the message is only actually removed once every consumer group has acknowledged it.

## `MOVE key db [ REPLACE ]` for moving database keys

The `MOVE ...` command moves a key from the currently selected database to the specified destination database. By default, if the key already exists in the destination database, or it doesn't exist in the source database, `MOVE` does nothing.  Because of this it is possible to use `MOVE` as a locking primitive.

The new `REPLACE` option, added in 9.2.0, changes that. It tells `MOVE` to overwrite the key in the destination database if one is already present there.

**Note:** You must have access to the current and destination databases.

- Reply `1`: if key was moved
- Reply `0`: if key wasn't moved, either because it already exists in the destination database (and the `REPLACE` argument wasn't given), or because it doesn't exist in the source database

Consider the following example:

    ```bash
    127.0.0.1:6379> SELECT 0
    OK
    127.0.0.1:6379> SET session:42 "active"
    OK
    127.0.0.1:6379> SELECT 1
    OK
    127.0.0.1:6379[1]> SET session:42 "stale"
    OK
    127.0.0.1:6379[1]> SELECT 0
    OK
    127.0.0.1:6379> MOVE session:42 1
    (integer) 0
    127.0.0.1:6379> MOVE session:42 1 REPLACE
    (integer) 1
    127.0.0.1:6379> SELECT 1
    OK
    127.0.0.1:6379[1]> GET session:42
    "active"
    ```

Without `REPLACE`, the first `MOVE` fails silently because `session:42` already exists in database 1. Adding `REPLACE` forces the move, overwriting the `stale` value with the `active` value. For more information see the [MOVE command documentation](https://valkey.io/commands/move/).

## `ZRANGE XX` for distinguishing missing keys from empty ranges

`ZRANGE` can't tell you the difference between "this key doesn't exist" and "this key exists but has no members in the requested range". Both of these cases return an empty array. The new `XX` option, added in 9.2.0, fixes that ambiguity. When the key doesn't exist, `ZRANGE ... XX` returns `nil` instead of an empty array.

Consider the following example:

    ```bash
    127.0.0.1:6379> ZADD myset 1 a 2 b 3 c
    (integer) 3
    127.0.0.1:6379> ZRANGE nosuchkey 0 -1
    (empty array)
    127.0.0.1:6379> ZRANGE nosuchkey 0 -1 XX
    (nil)
    127.0.0.1:6379> ZRANGE myset 0 -1 XX
    1) "a"
    2) "b"
    3) "c"
    ```

When the key exists, `XX` has no effect on the result, it only changes the reply when the key is missing entirely (displays `nil`). For more information see the [ZRANGE command documentation](https://valkey.io/commands/zrange/).

## `SET IFNE` to set a key when its value doesn't match a specified value

<!-- The feature is still being finalized. Ask about it's functionality once merged. -->

The `IFNE` option, added in 9.2.0, sets a key only if the current value does not equal the comparison value.

Consider the following example:

    ```bash
    127.0.0.1:6379> SET foo hello
    OK
    127.0.0.1:6379> SET foo world IFNE hello
    (nil)
    127.0.0.1:6379> GET foo
    "hello"
    127.0.0.1:6379> SET foo world IFNE goodbye
    OK
    127.0.0.1:6379> GET foo
    "world"
    ```

In this example `SET foo world IFNE goodbye` means "Set foo to world, but only if foo's current value is NOT goodbye." For more information, see the [SET command](https://valkey.io/commands/set/).

## `SISMEMBER XX` for distinguishing missing keys from empty members

The `SISMEMBER` command returns 1 if a `member` is a member of the set or a 0 if the element is not a member of the set, or if the key doesn't exist. The new addition of XX changes what you get back when the key itself doesn't exist, letting you tell that apart from "the key exists but this member isn't in it", which otherwise both just return 0.

So XX here is a reply-disambiguation flag, `SISMEMBER` still just checks membership either way, but XX unlocks a third possible answer (-1) so you can distinguish "no such key" from "key exists, member absent" without a separate `EXISTS` call.

Consider the following example:

    ```bash
    127.0.0.1:6379> sadd myset a b c
    (integer) 3
    127.0.0.1:6379> sismember myset a
    (integer) 1
    127.0.0.1:6379> sismember myset z
    (integer) 0
    127.0.0.1:6379> sismember myset z XX
    (integer) 0
    127.0.0.1:6379> sismember nosuchkey a
    (integer) 0
    127.0.0.1:6379> sismember nosuchkey a XX
    (integer) -1
    ```

In this example, `SISMEMBER nosuchkey a XX` returns `-1` because the key `nosuchkey` doesn't exist. Without XX, that same call would just return `0`, indistinguishable from a real "not a member" result. For more information, see the [SISMEMBER command](https://valkey.io/commands/sismember/).

## Try it yourself

Most of what's covered here is still taking shape some of these commands are proposals working through review, and syntax may shift before they land. But that's exactly why now is a good time to get familiar with the direction Valkey is heading: fewer round trips for transactional workflows, and replies that finally let you tell "empty" apart from "doesn't exist" without extra calls.

If you're still running an older version of Valkey, this is a good moment to start planning your upgrade path as each release since has closed real gaps like these, and 9.2 looks to continue that trend. In the meantime, you don't have to wait for a tagged release to see this code in action, everything shown here was tested by building Valkey directly from its `unstable` branch, and you can do the same.

Clone the repo, `git fetch` the PR branch you're curious about, `make`, and spin up your own local server!  It's the fastest way to see where these commands stand today and to leave feedback on the PRs themselves before they lock in for good.

Have thoughts on any of these proposals? The GitHub discussions are open, and contributor feedback shapes what ships.
