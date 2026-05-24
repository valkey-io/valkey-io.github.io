---
title: "MONITOR"
description: "MONITOR command reference documentation"
---

`MONITOR` is a debugging command that streams back every command processed by
the Valkey server.
It can help in understanding what is happening to the database.
This command can both be used via `valkey-cli` and via `telnet`.

The ability to see all the requests processed by the server is useful in order
to spot bugs in an application both when using Valkey as a database and as a
distributed caching system.

```
$ valkey-cli monitor
1339518083.107412 [0 127.0.0.1:60866] "keys" "*"
1339518087.877697 [0 127.0.0.1:60866] "dbsize"
1339518090.420270 [0 127.0.0.1:60866] "set" "x" "6"
1339518096.506257 [0 127.0.0.1:60866] "get" "x"
1339518099.363765 [0 127.0.0.1:60866] "eval" "return server.call('set','x','7')" "0"
1339518100.363799 [0 lua] "set" "x" "7"
1339518100.544926 [0 127.0.0.1:60866] "del" "x"
```

Use `SIGINT` (Ctrl-C) to stop a `MONITOR` stream running via `valkey-cli`.

```
$ telnet localhost 6379
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
MONITOR
+OK
+1339518083.107412 [0 127.0.0.1:60866] "keys" "*"
+1339518087.877697 [0 127.0.0.1:60866] "dbsize"
+1339518090.420270 [0 127.0.0.1:60866] "set" "x" "6"
+1339518096.506257 [0 127.0.0.1:60866] "get" "x"
+1339518099.363765 [0 127.0.0.1:60866] "del" "x"
+1339518100.544926 [0 127.0.0.1:60866] "get" "x"
QUIT
+OK
Connection closed by foreign host.
```

Manually issue the [`QUIT`](quit.md) or [`RESET`](reset.md) commands to stop a `MONITOR` stream running
via `telnet`.

## Commands not logged by MONITOR

Because of security concerns, no administrative commands are logged
by `MONITOR`'s output and sensitive data is redacted in the command [`AUTH`](auth.md).

Furthermore, the command `QUIT` is also not logged.

## Cost of running MONITOR

Because `MONITOR` streams back **all** commands, its use comes at a cost.
The following (totally unscientific) benchmark numbers illustrate what the cost
of running `MONITOR` can be.

Benchmark result **without** `MONITOR` running:

```
$ src/valkey-benchmark -c 10 -n 100000 -q
PING_INLINE: 101936.80 requests per second
PING_BULK: 102880.66 requests per second
SET: 95419.85 requests per second
GET: 104275.29 requests per second
INCR: 93283.58 requests per second
```

Benchmark result **with** `MONITOR` running (`valkey-cli monitor > /dev/null`):

```
$ src/valkey-benchmark -c 10 -n 100000 -q
PING_INLINE: 58479.53 requests per second
PING_BULK: 59136.61 requests per second
SET: 41823.50 requests per second
GET: 45330.91 requests per second
INCR: 41771.09 requests per second
```

In this particular case, running a single `MONITOR` client can reduce the
throughput by more than 50%.
Running more `MONITOR` clients will reduce throughput even more.

Note that, 
*  [`AUTH`](auth.md) is excluded from the command's output.
*  [`RESET`](reset.md) can be called to exit monitor mode.
*  `AUTH`, [`HELLO`](hello.md), [`EVAL`](eval.md), [`EVAL_RO`](eval_ro.md), [`EVALSHA`](evalsha.md) and [`EVALSHA_RO`](evalsha_ro.md) are included in the command's output.
