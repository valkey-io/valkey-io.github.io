+++
title = "Valkey 9.2: Fewer Reasons to Reach for Lua"
date = 2026-09-20
draft = true
description = "How several of Valkey 9.2's new commands and options let application developers replace patterns that used to need WATCH, manual bookkeeping, or a Lua script, with real, practical examples."
authors = ["dragosandriciuc"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
+++

A lot of application logic built on top of Valkey ends up in one of two places: either scattered across multiple round trips in your client code, or pushed into a Lua script so the server can do it atomically in one call.
Both work, but they have different costs: extra round trips add latency and race windows, while scripts add something to write, ship, cache, and get right.

Several of Valkey 9.2's changes exist specifically to shrink that second category: giving plain commands the conditional logic that used to mean either extra round trips or a script.

If you want the background on how Lua scripting works in Valkey before diving in, the [Introduction to Eval Scripts](https://valkey.io/topics/eval-intro/) documentation page is a good starting point.

Let's look at where 9.2 actually changes things.

## `SET IFNE` to set a key when its value doesn't match a specified value

Sometimes your application wants to update a value only if it hasn't already been set to something specific, to replace a stale default or placeholder, for example, without touching it if another process has already moved it on.

Before 9.2, doing this safely meant a `GET` first, checking the value in your application code, then conditionally issuing a `SET` which is an extra round trip, and a race window between the `GET` and the `SET` where another client could write in between.
A Lua script can close that race window in one round trip. However, it's still a script you have to write for a pattern that comes up constantly.

With Valkey 9.2, the `IFNE` option lets `SET` do that check itself.
It sets a key only if the current value does **not** equal the comparison value, in a single call:

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

In this example, `SET foo world IFNE goodbye` means "Set foo to world, but only if foo's current value is **NOT** goodbye."
Since `foo` is `"hello"`, which isn't `"goodbye"`, the condition passes and the write goes through.

Beyond avoiding a stale overwrite, `IFNE` has a second, sharper use: suppressing idempotent writes.
A plain `SET` always counts as a write, even when you're writing the exact value that's already there such as a heartbeat key refreshed every few seconds with the same status string.

Here's the difference in practice, one client `WATCH`es a key while another writes to it:

```bash
# Case A: plain SET with the same value
Client A:  WATCH heartbeat                -> OK
Client B:  SET heartbeat alive            -> OK    #(same value as before)
Client A:  MULTI                          -> OK
Client A:  GET heartbeat                  -> QUEUED
Client A:  EXEC                           -> (nil)   #<- WATCH was invalidated anyway

# Case B: SET ... IFNE with the same value
Client A:  WATCH heartbeat                -> OK
Client B:  SET heartbeat alive IFNE alive -> (nil)   #(write skipped, values match)
Client A:  MULTI                          -> OK
Client A:  GET heartbeat                  -> QUEUED
Client A:  EXEC                           -> ["alive"]  #<- WATCH still valid, transaction succeeds
```

Because `IFNE` skips the write entirely when the value hasn't changed, it never touches the key so it never triggers replication, AOF writes, or `WATCH` invalidation for other clients either.
For keys written frequently with values that often don't change, that's a real reduction in unnecessary churn, and it's built into the command instead of requiring anyone to think to script it.

For more information, see the [SET command](https://valkey.io/commands/set/).

## Conditional `EXEC` for optimistic-locking workflows: an alternative to `WATCH` and Lua

Say your application tracks account balances, and a transfer needs to update two keys together, but only if the account hasn't been touched by another transfer since your application last read it.
This is a classic optimistic-locking pattern: the database reads a version number, then writes only if it hasn't changed.

Before 9.2, Valkey gave you two ways to do this atomically.
You could `WATCH` the version key before opening `MULTI`, at the cost of an extra round trip before you've even queued a command:

```bash
127.0.0.1:6599> WATCH ver{foo}
127.0.0.1:6599> GET ver{foo}
127.0.0.1:6599> MULTI
127.0.0.1:6599> SET ver{foo} 2
127.0.0.1:6599> SET mykey{foo}1 111
127.0.0.1:6599> SET mykey{foo}2 222
127.0.0.1:6599> EXEC
```

Or you could write a Lua script and let the server do the check and the writes in a single round trip:

```lua
-- KEYS[1] = version key, ARGV[1] = expected value, ARGV[2] = new value
-- KEYS[2], KEYS[3] = the other keys, ARGV[3], ARGV[4] = their new values
local current = server.call('GET', KEYS[1])
if current ~= ARGV[1] then
    return nil
end
server.call('SET', KEYS[1], ARGV[2])
server.call('SET', KEYS[2], ARGV[3])
server.call('SET', KEYS[3], ARGV[4])
return {'OK', 'OK', 'OK'}
```

```bash
127.0.0.1:6999> EVAL "<script above>" 3 ver{foo} mykey{foo}1 mykey{foo}2 1 2 111 222
1) OK
2) OK
3) OK
```

That works, and it's genuinely fewer round trips than `WATCH`.
But it comes with real costs of its own: the script has to be written, tested, and either sent verbatim on every call or preloaded with `SCRIPT LOAD` and invoked by hash, with cached scripts subject to eviction, meaning your client needs to handle `NOSCRIPT` errors and reload logic.
Some teams restrict or disable scripting entirely for operational reasons.
And a reviewer or on-call engineer has to read Lua to know what a script actually does, where a transaction full of plain commands is legible at a glance.

Valkey 9.2 gives you a third option: attach the same kind of precondition directly to `EXEC`, no script required.

```bash
127.0.0.1:6599> GET ver{foo}
"1"
127.0.0.1:6599> MULTI
OK
127.0.0.1:6599> SET ver{foo} 2
QUEUED
127.0.0.1:6599> SET mykey{foo}1 111
QUEUED
127.0.0.1:6599> SET mykey{foo}2 222
QUEUED
127.0.0.1:6599> EXEC IFEQ ver{foo} 1
1) OK
2) OK
3) OK
```

The real value shows up when another client changes `ver{foo}` after you've read it but **before** your `EXEC` runs.
With the old `WATCH`-based approach, `WATCH` handles that detection with an extra round trip. Here, the same protection comes from the precondition attached at `EXEC` time:

```bash
# Client A:
127.0.0.1:6599> GET ver{foo}
"1"
127.0.0.1:6599> MULTI
OK
127.0.0.1:6599> SET ver{foo} 2
QUEUED
127.0.0.1:6599> SET mykey{foo}1 111
QUEUED
127.0.0.1:6599> SET mykey{foo}2 222
QUEUED
# Client B:
127.0.0.1:6599> SET ver{foo} 99
OK   (a concurrent write sneaks in)
# Client A:
127.0.0.1:6599> EXEC IFEQ ver{foo} 1
(nil)
```

Because `ver{foo}` no longer equals `1` by the time `EXEC` runs, the entire transaction is discarded.
That leaves `ver{foo}` at Client B's `99`, and neither `mykey{foo}1` nor `mykey{foo}2` is ever written.

`IFNE`, `NX`, and `XX` work the same way as conditions on `EXEC`, `NX key` only runs if `key` doesn't exist, `XX key` only runs if it does, and `IFNE key value` runs unless `key` currently equals `value`.
Lua already gives you a single round trip, but these conditions let you express the same logic in plain commands, without writing, deploying, or caching a script to do it.

For more information, see the [EXEC command](https://valkey.io/commands/exec/).

## `XACKDEL` and `XDELEX` for safe cleanup in fan-out stream consumers

Sometimes your application has more than one consumer group independently processing the same stream, one group logging events, another triggering notifications, and so on.

Before 9.2, cleaning up old entries meant either trimming the stream on a schedule and hoping every group had caught up, or writing your own bookkeeping to check every group's pending-entries list before deleting anything.
Delete too early, and a slower consumer group loses messages it hasn't processed yet, that data is gone forever.

Valkey 9.2 adds two commands that build that check into the delete itself.
`XACKDEL`, which acknowledges a message for one specific group **and** deletes it in the same call, and `XDELEX`, which deletes stream entries directly.
Of everything in this post, these two are the hardest to fake with a Lua script.

The equivalent Lua implementation is possible, here's what replicating `XDELEX ... ACKED` yourself actually looks like:

```lua
-- KEYS[1] = stream key, ARGV[1] = the entry ID to conditionally delete
local stream = KEYS[1]
local id = ARGV[1]

-- enumerate every consumer group on the stream
local groups = server.call('XINFO', 'GROUPS', stream)

-- check whether this ID is still pending in any of them
for i, group in ipairs(groups) do
    local groupName = nil
    for j = 1, #group, 2 do
        if group[j] == 'name' then
            groupName = group[j + 1]
        end
    end
    if groupName then
        local pending = server.call('XPENDING', stream, groupName, id, id, 1)
        if #pending > 0 then
            return 2  -- still referenced, not safe to delete
        end
    end
end

-- no group still needs it
local deleted = server.call('XDEL', stream, id)
if deleted == 1 then
    return 1
else
    return -1
end
```

```bash
127.0.0.1:6899> EVAL "<script above>" 1 s4 1788346731590-0
(integer) 2                    
# grp still has it pending
127.0.0.1:6899> XACK s4 grp 1788346731590-0
(integer) 1
127.0.0.1:6899> EVAL "<script above>" 1 s4 1788346731590-0
(integer) 1                    
# deleted, once acknowledged
```

It produces the same result as `XDELEX ... ACKED` on the same scenario, but getting there means enumerating groups, walking the `XINFO GROUPS` reply's field/value reply structure by hand, and looping `XPENDING` per group before you can call `XDEL`.
`XDELEX` does all of that in one call.

### `XACKDEL` to delete acknowledged messages

`XACKDEL` is a stream command that acknowledges one or more messages and (conditionally) deletes them from the stream.

This is particularly useful when multiple consumer groups independently process the same stream and you need to reclaim entries without deleting messages that another group still needs.

The command supports the following deletion modes:

- `KEEPREF` (default, implicit): acknowledges and deletes messages immediately, leaving `PEL` references in other groups
- `DELREF`: acknowledges, deletes, and forcibly removes PEL entries from all other groups
- `ACKED`: deletes a message only once no consumer group still needs it: every existing group must have advanced its last-delivered ID past the entry and have no pending reference to it, so no group can still deliver it later

`XACKDEL` combines acknowledgment and conditional deletion into a single command, whereas `XDELEX` below handles the deletion separately.
See `XDELEX`'s example below for `ACKED` mode in action.

### `XDELEX` to delete stream messages

`XDELEX` is an extension of the Valkey Streams [`XDEL` command](https://valkey.io/commands/xdel/) that allows you to delete one or more stream messages with more control over how those message entries are deleted concerning consumer groups.

The command supports three deletion modes:

- `KEEPREF` (default): deletes the stream entry but leaves PEL references intact in all consumer groups
- `DELREF`: deletes the stream entry and forcibly removes it from all consumer group PELs
- `ACKED`: deletes a message only once no consumer group still needs it: every existing group must have advanced its last-delivered ID past the entry and have no pending reference to it, so no group can still deliver it later

**Note:** The command returns a per-ID integer array: `1` for deleted, `2` for exists-but-not-yet-deletable (`ACKED` mode only), and `-1` when the message wasn't found.

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

From the above example you can see that the first `XDELEX ... ACKED` call returns `2`, because `grp` still has the message pending, and `XLEN` confirms it's still in the stream.
Once `XACK` explicitly acknowledges it for `grp`, the same `XDELEX ... ACKED` call returns `1` and `XLEN` drops to `0` which means the message is only actually removed once **no** consumer group still needs it.

For more information, see the [XDEL command documentation](https://valkey.io/commands/xdel/) and [XACK command documentation](https://valkey.io/commands/xack/).

## Sharper replies, fewer moving parts: `ZRANGE XX`, `SISMEMBER XX`, and `MOVE ... REPLACE`

The rest of 9.2's changes covered here follow a simpler pattern: an existing command gains an option that removes a companion call your application used to need, such as an `EXISTS` check, or a manual copy-then-delete.

It's not just saving a round trip, there's a correctness problem too.
Two separate calls can be interleaved by another client.
For example, let's take a look at an `EXISTS` followed by a `SISMEMBER`, with a concurrent `DEL` command landing in the gap:

```bash
Client A:  EXISTS users:online              -> 1        
# key is there
Client B:  DEL users:online                 -> 1        
# key destroyed in the gap
Client A:  SISMEMBER users:online alice     -> 0
```

Client A now has `1` from step one and `0` from step two, and concludes "the set exists and alice isn't in it."
The set doesn't exist at all, the answer is simply wrong, and those two independent calls cannot be made atomic through client-side result handling alone.

Atomicity is the real reason to reach for Lua here.
This is a Lua script that runs from start to finish with no other client interleaving:

```lua
-- KEYS[1] = the key, ARGV[1] = the member to check
if server.call('EXISTS', KEYS[1]) == 0 then
    return -1
end
return server.call('SISMEMBER', KEYS[1], ARGV[1])
```

```bash
127.0.0.1:6799> EVAL "<script above>" 1 users:online alice
(integer) 1                                   
# the key exists, alice is a member
127.0.0.1:6799> EVAL "<script above>" 1 users:online carol
(integer) 0                                   
# the key exists, carol is not a member
127.0.0.1:6799> DEL users:online
(integer) 1
127.0.0.1:6799> EVAL "<script above>" 1 users:online alice
(integer) -1                                  
# the key doesn't exist
```

`ZRANGE XX` and `SISMEMBER XX` both solve exactly this issue, "if the key exists, give me the command's normal result; if not, give me a distinct value I can tell apart".
In 9.2, that distinction is built into the commands themselves, so you get the result without a separate existence check or a Lua script.

### `ZRANGE XX`

Sometimes your application needs to know if a range query came back empty because there was nothing there, or because the key you asked for wasn't there.
Before 9.2, `ZRANGE` couldn't distinguish "this key doesn't exist" from "this key exists but has no members in the requested range" and both come back as the same empty array.

A leaderboard that's empty because no one has scored yet, and a leaderboard that doesn't exist because you misspelled the key, both come back identically.
You could use `EXISTS leaderboard:weekly` before every `ZRANGE`, but that's a second round trip for information the server already has at the moment it runs the range query.

With Valkey 9.2, `ZRANGE` gains an `XX` option that surfaces that information directly in the reply:

```bash
127.0.0.1:6379> ZADD leaderboard:weekly 100 alice 85 bob
(integer) 2
127.0.0.1:6379> ZRANGE leaderboard:weekly 0 -1
1) "bob"
2) "alice"
127.0.0.1:6379> ZRANGE leaderboard:weekly 10 20
(empty array)
127.0.0.1:6379> ZRANGE leaderboard:monthly 0 -1
(empty array)
127.0.0.1:6379> ZRANGE leaderboard:weekly 10 20 XX
(empty array)
127.0.0.1:6379> ZRANGE leaderboard:monthly 0 -1 XX
(nil)
```

When the key exists, `XX` doesn't change the reply, even when the requested range is empty.
When the key is missing, however, `XX` returns `(nil)` instead of an `(empty array)`.
Your application can distinguish "the key exists but nothing matched" from "the key doesn't exist" without issuing a separate `EXISTS` call.

For more information, see the [ZRANGE command documentation](https://valkey.io/commands/zrange/).

### `SISMEMBER XX`

Sometimes your application needs to distinguish between "the user isn't in this set" and "the set doesn't exist."
Before 9.2, this distinction couldn't be made.
For example, if you ran `SISMEMBER users:online alice` you'd get `0`.
But what does `0` actually mean? That Alice isn't online? That `users:online` doesn't exist?
There's no way to tell.
You could use `EXISTS users:online` then `SISMEMBER users:online alice`, but now you've got another round trip, and your application needs to combine two pieces of information together.

With Valkey 9.2, `SISMEMBER` gains an `XX` option that makes that distinction explicit:

```bash
127.0.0.1:6379> SADD users:online alice bob
(integer) 2
127.0.0.1:6379> SISMEMBER users:online alice XX
(integer) 1
127.0.0.1:6379> SISMEMBER users:online carol XX
(integer) 0
127.0.0.1:6379> SISMEMBER users:offline alice XX
(integer) -1
```

Now your application can distinguish:

- `1` means Alice is a member
- `0` means the set exists, but the member isn't in it
- `-1` means the set doesn't exist

### `MOVE ... REPLACE`

Sometimes your application uses separate logical databases to represent different states of the same data, a staging area versus a live one for example, and needs to promote a key from one to the other.
Before 9.2, `MOVE` could do that, but only if the destination key didn't already exist; if it did, `MOVE` silently did nothing, leaving whatever was already there untouched.

Unfortunately you can't just wrap `DEL` and `MOVE` in a `MULTI`/`EXEC`, because a `SELECT` inside a transaction persists on the connection after `EXEC` finishes:

```bash
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379> SELECT 1
QUEUED
127.0.0.1:6379> EXEC
1) OK
127.0.0.1:6379> SET canary hello
OK                                  
# this just landed in db1, not db0
```

Every subsequent command on that connection goes to the wrong database until you notice and switch back, which is a hard to track down.

A Lua script avoids that, because Valkey restores the connection's selected database when the script exits:

```lua
-- KEYS[1] = the key, ARGV[1] = source db, ARGV[2] = destination db
server.call('SELECT', ARGV[2])
server.call('DEL', KEYS[1])
server.call('SELECT', ARGV[1])
server.call('MOVE', KEYS[1], ARGV[2])
return 1
```

```bash
127.0.0.1:6379> EVAL "<script above>" 1 session:42 0 1
(integer) 1
```

It works, but look at what it takes: you have to switch databases, delete the destination key, switch back, move, and reason carefully about which database you're on at each step.
Get the order wrong and you delete the wrong key or write to the wrong database.

The new `REPLACE` option, added in 9.2.0, collapses all of that into one call.
It tells `MOVE` to overwrite the key in the destination database if one is already present there.

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

Reply `1` means the key was moved; reply `0` means it wasn't, either because it already existed in the destination (and `REPLACE` wasn't given), or because it didn't exist in the source.
Without `REPLACE`, the first `MOVE` does nothing because `session:42` already exists in database 1.
Adding `REPLACE` allows the move to continue, overwriting the `stale` value with the `active` one, with no database juggling and nothing to restore afterwards.

For more information, see the [MOVE command documentation](https://valkey.io/commands/move/) and the original [feature request](https://github.com/valkey-io/valkey/issues/2278).

## Try it yourself

Lua isn't going away, and it shouldn't. When an operation needs application-specific logic that Valkey doesn't expose as a command, scripting is still a useful way to keep that logic atomic. The point of these 9.2 changes is to make several common patterns no longer need a script at all.

Taken together, these changes point in one direction: less application logic living in round trips or in Lua, more of it expressed directly in the commands themselves.
Whether you're locking on a version key, cleaning up a fan-out stream, or just tired of an extra `EXISTS` call, 9.2 gives you a way to say what you mean in one call instead of building it yourself.

If you're running an older version of Valkey, these examples are a good way to identify application logic that can become simpler after upgrading.
Get latest version from the [downloads](https://valkey.io/download/releases/) page and try the commands for yourself.

Have thoughts on any of these features? The [GitHub discussions](https://github.com/orgs/valkey-io/discussions) are open, and contributor feedback shapes what ships.
