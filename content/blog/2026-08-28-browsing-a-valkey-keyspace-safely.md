+++
title = "Browsing a Valkey keyspace safely: SCAN, INFO, and a read-only ACL user"
date = 2026-08-28 01:01:01
description = "Pointing a graphical client at a Valkey server that is taking traffic raises two questions, and neither is answered by the client. Here is how the keyspace listing and the access control list decide whether it is safe."
authors = ["kaya-abdullah"]

[taxonomies]
blog_type = ["How-to"]

[extra]
featured = false
+++

Valkey rarely runs on its own.
It sits in front of a database, and when a page gets slow the answer is either a cache that is not being hit or a query that got worse.
Checking both usually means one terminal on `valkey-cli` and another on the database, and holding the two halves of the picture in your head.

That is the situation I want to walk through, using a graphical user interface (GUI) as the example.
Reaching for one against a server that is serving traffic raises two questions, and neither of them is really about the tool.
The first is whether listing keys blocks the server.
The second is what the tool is allowed to do once it has connected.
Valkey answers both, and the useful thing a client can do is stay out of the way of those answers.

The tool in the examples is [LibreDB Studio](https://github.com/libredb/libredb-studio), an open source database GUI I work on, which connects to Valkey alongside the relational database in the same window.
Everything below was measured against Valkey 9.1.1 from the `valkey/valkey` container image with a default configuration, and every command in it you can run yourself.

## Listing keys without blocking the server

`KEYS` is the obvious way to find out what is in a keyspace and the wrong one on a server with traffic.
It walks the entire keyspace in a single call and blocks the server for the duration.
On a keyspace with millions of keys that is a stall every other client sees.

`SCAN` exists for this reason.
It is cursor based, it returns a bounded batch per call, and other commands run in between.
The guarantee is weaker, which is the point: a key present for the whole scan is returned at least once, but a scan that overlaps with writes samples a moving keyspace rather than photographing a still one.

The key explorer is built on that.
It issues `SCAN` with `COUNT 100`, stops after 1000 keys, groups what it saw by the text before the first colon, and shows the groups as rows:

```text
user:*      2
session:*   1
queue:*     1
```

Two things about that display are worth stating, because a table of names invites the wrong reading.
`user:*` is a grouping derived from key names the scan happened to see, not an object on the server, so nothing can be addressed by it.
And the counts are the sample, not the keyspace.
The total key count shown elsewhere comes from `DBSIZE`, which is the real number.

The effect is that opening the explorer against a busy server costs a bounded number of `SCAN` calls.
To look inside one prefix you send `SCAN 0 MATCH session:* COUNT 50` yourself rather than asking anything to enumerate the keyspace for you.

## Connecting as a user that cannot write

The second question is authorization, and no client has a good answer to it.
A read-only switch in an interface is a property of that interface.
Anyone who can reach the server can open a connection that does not have the switch.
The privileges have to come from Valkey.

An access control list (ACL) user does that.
A client that authenticates with a username and password rather than a password alone reaches the server as that user, and the server enforces the rest.
Here is a grant that covers everything the interface reads:

```bash
valkey-cli ACL SETUSER studio on '>your-password' '~*' '+@read' '+info' '+slowlog|get' '+client|list' '+ping'
```

Each piece of it maps to something on screen:

- `+@read` covers `SCAN`, `TYPE` and `DBSIZE` for the key explorer, and the value reads behind it.
- `+info` is the overview: uptime, connected clients, `maxclients`, `used_memory`, and the keyspace hit and miss counters behind the cache hit ratio.
- `+slowlog|get` is the slow command list, read with `SLOWLOG GET 10`.
- `+client|list` is the session list.
- `+ping` is the connection check the client runs when it opens the connection.

Connected as `studio`, every panel fills in.
A write does not:

```text
SET user:1 hacked
NOPERM User studio has no permissions to run the 'set' command
```

The refusal came from the server, and it reaches the query console as the error it is.
Nothing in the tool decided it, which is the property worth having: the same restriction holds for anyone who takes those credentials and connects with `valkey-cli` instead.

If you want writes, connect as a user that has them.
The point is that the choice is recorded in `ACL GETUSER` on the server rather than in a client side setting, and Valkey 9.1 makes the grant finer with database level ACLs.

## What the monitoring views read

There is no agent and no exporter in any of this.
Every number comes from a command you can run yourself:

| View | Command |
|------|---------|
| Overview and metrics | `INFO` |
| Key count | `DBSIZE` |
| Sessions | `CLIENT LIST` |
| Slow commands | `SLOWLOG GET 10` |

That is worth knowing because it tells you what a number means and when it will be missing.
If `INFO` does not publish a field, the panel behind it has nothing to show.
It also means anything on screen can be checked against `valkey-cli` in a few seconds, which is the right relationship between a graphical client and a server.

Two limits are worth stating rather than leaving to be found.
The session list reads the `name` field from `CLIENT LIST`, which stays empty until a client calls `CLIENT SETNAME`, so the user column reads `default` even when the connection belongs to another ACL user.
Run `CLIENT LIST` directly when you need to know which user a connection belongs to.
And the connection goes to a single standalone node: transport layer security (TLS) is supported, Cluster and Sentinel are not.

One practical note if you try this.
There is no separate Valkey entry in the connection dialog, and Valkey is reached by choosing Redis, because one protocol implementation serves every server that speaks the protocol.
A second identical entry would suggest a difference in the client that does not exist.

## Next steps

Create the restricted user before you point anything at a server that matters.
It is one command, it survives whatever client someone reaches for next, and it is the only read-only access that holds.
Then run `ACL GETUSER` against the users your own tooling connects as, and see whether the answer is the one you expected.
