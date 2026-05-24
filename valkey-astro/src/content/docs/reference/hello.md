---
title: "HELLO"
description: "HELLO command reference documentation"
---

Switch to a different protocol, optionally authenticating and setting the
connection's name, or provide a contextual client report.

Valkey supports two protocols: RESP2 and RESP3. RESP3 has certain advantages since
when the connection is in this mode, Valkey is able to reply with more semantical
replies: for instance, [`HGETALL`](hgetall.md) will return a *map type*, so a client library
implementation no longer requires to know in advance to translate the array into
a hash before returning it to the caller. For a full coverage of RESP3, please
check the [RESP3 specification](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md).

Valkey connections start in RESP2 mode, so clients implementing RESP2 do
not need to updated or changed. There are no short term plans to drop support for
RESP2, although future version may default to RESP3.

`HELLO` always replies with a list of current server and connection properties,
such as: versions, modules loaded, client ID, replication role and so forth.
The `availability_zone` field only shows up when it is set in the configs,
see `availability-zone` config for more details, added in Valkey 8.1.

When called without any arguments and its default use of RESP2
protocol, the reply looks like this:

    > HELLO
     1) "server"
     2) "redis"
     3) "version"
     4) "255.255.255"
     5) "proto"
     6) (integer) 2
     7) "id"
     8) (integer) 5
     9) "mode"
    10) "standalone"
    11) "role"
    12) "master"
    13) "modules"
    14) (empty array)
    15) "availability_zone"
    16) "us-east-1"

Clients that want to handshake using the RESP3 mode need to call the `HELLO`
command and specify the value "3" as the `protover` argument, like so:

    > HELLO 3
    1# "server" => "redis"
    2# "version" => "7.2.4"
    3# "proto" => (integer) 3
    4# "id" => (integer) 10
    5# "mode" => "standalone"
    6# "role" => "master"
    7# "modules" => (empty array)
    8# "availability_zone" => "us-east-1"

Because `HELLO` replies with useful information, and given that `protover` is
optional or can be set to "2", client library authors may consider using this
command instead of the canonical `PING` when setting up the connection.

When called with the optional `protover` argument, this command switches the
protocol to the specified version and also accepts the following options:

* `AUTH <username> <password>`: directly authenticate the connection in addition to switching to the specified protocol version. This makes calling [`AUTH`](auth.md) before `HELLO` unnecessary when setting up a new connection. Note that the `username` can be set to "default" to authenticate against a server that does not use ACLs, but rather the simpler `requirepass` mechanism.
* `SETNAME <clientname>`: this is the equivalent of calling [`CLIENT SETNAME`](client-setname.md).
