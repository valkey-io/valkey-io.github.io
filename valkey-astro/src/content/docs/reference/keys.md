---
title: "KEYS"
description: "KEYS command reference documentation"
---

Returns all keys matching `pattern`.

While the time complexity for this operation is O(N), the constant times are
fairly low.
For example, Valkey running on an entry level laptop can scan a 1 million key
database in 40 milliseconds.

**Warning**: consider `KEYS` as a command that should only be used in production
environments with extreme care.
It may ruin performance when it is executed against large databases.
This command is intended for debugging and special operations, such as changing
your keyspace layout.
Don't use `KEYS` in your regular application code.
If you're looking for a way to find keys in a subset of your keyspace, consider
using [`SCAN`](scan.md) or [sets][tdts].

[tdts]: ../topics/data-types.md#sets

Supported glob-style patterns:

* `h?llo` matches `hello`, `hallo` and `hxllo`
* `h*llo` matches `hllo` and `heeeello`
* `h[ae]llo` matches `hello` and `hallo,` but not `hillo`
* `h[^e]llo` matches `hallo`, `hbllo`, ... but not `hello`
* `h[a-b]llo` matches `hallo` and `hbllo`

Use `\` to escape special characters if you want to match them verbatim.

When using [Valkey Cluster](../topics/cluster-tutorial.md), the search is optimized for patterns that imply a single slot.
If a pattern can only match keys of one slot,
Valkey only iterates over keys in that slot, rather than the whole database,
when searching for keys matching the pattern.
For example, with the pattern `{a}h*llo`, Valkey would only try to match it with the keys in slot 15495, which hash tag `{a}` implies.
To use pattern with hash tag, see [Hash tags](../topics/cluster-spec.md#hash-tags) in the Cluster specification for more information.

## Examples

```
127.0.0.1:6379> MSET firstname Jack lastname Stuntman age 35
OK
127.0.0.1:6379> KEYS *name*
1) "lastname"
2) "firstname"
127.0.0.1:6379> KEYS a??
1) "age"
127.0.0.1:6379> KEYS *
1) "age"
2) "lastname"
3) "firstname"
```
