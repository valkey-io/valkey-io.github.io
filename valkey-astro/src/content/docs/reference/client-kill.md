---
title: "CLIENT KILL"
description: "CLIENT KILL command reference documentation"
---

The `CLIENT KILL` command closes a given client connection. This command support two formats, the old format:

    CLIENT KILL addr:port

The `ip:port` should match a line returned by the `CLIENT LIST` command (`addr` field).

The new format:

    CLIENT KILL <filter> <value> ... ... <filter> <value>

With the new form it is possible to kill clients by different attributes
instead of killing just by address. The following filters are available:

* `CLIENT KILL ADDR ip:port`. This is exactly the same as the old three-arguments behavior.
* `CLIENT KILL LADDR ip:port`. Kill all clients connected to specified local (bind) address.
* `CLIENT KILL ID client-id [client-id ...]`. Allows to kill a client by its unique `ID` field. Client `ID`'s can be retrieved using the `CLIENT LIST` command. The filter supports one or more `client-id` arguments.
* `CLIENT KILL TYPE type`, where *type* is one of `normal`, `master`, `replica` and `pubsub`. This closes the connections of **all the clients** in the specified class. Note that clients blocked into the `MONITOR` command are considered to belong to the `normal` class.
* `CLIENT KILL USER username`. Closes all the connections that are authenticated with the specified [ACL](../topics/acl.md) username, however it returns an error if the username does not map to an existing ACL user.
* `CLIENT KILL SKIPME yes/no`. By default this option is set to `yes`, that is, the client calling the command will not get killed, however setting this option to `no` will have the effect of also killing the client calling the command.
* `CLIENT KILL MAXAGE maxage`. Closes all the connections that are older than the specified age, in seconds.
* `CLIENT KILL FLAGS flags`. Kill only clients whose flag string includes the specified characters. Returns an error if valid flags are not used.
* `CLIENT KILL NAME name`. Kill clients with the specified name.
* `CLIENT KILL IDLE idle`. Kill only clients that have been idle for at least the specified time.
* `CLIENT KILL LIB-NAME lib-name`. Kill clients using the specified library name.
* `CLIENT KILL LIB-VER lib-version`. Kill clients running the specified library version.
* `CLIENT KILL DB db`. Kill clients operating on the specified database id.
* `CLIENT KILL IP ip`. Kill clients with the specified originating IP address.
* `CLIENT KILL CAPA capa`. Kill clients that have the specified capabilities.
* `CLIENT KILL NOT-ID client-id [client-id ...]`. Kill clients are not in the IDs set.
* `CLIENT KILL NOT-TYPE type`. Kill clients are not in the specified type.
* `CLIENT KILL NOT-ADDR ip:port`. Kill clients except the specified ip and port.
* `CLIENT KILL NOT-LADDR ip:port`. Kill all clients not connected to specified local (bind) address.
* `CLIENT KILL NOT-USER username`. Closes all the connections that are not authenticated with the specified [ACL](../topics/acl.md) username.
* `CLIENT KILL NOT-FLAGS flags`. Kill clients not with the specified flag string.
* `CLIENT KILL NOT-NAME name`. Kill clients not with the specified name.
* `CLIENT KILL NOT-LIB-NAME lib-name`. Kill clients not using the specified library name.
* `CLIENT KILL NOT-LIB-VER lib-version`. Kill clients not with the specified library version.
* `CLIENT KILL NOT-DB db`. Kill clients not with the specified database ID.
* `CLIENT KILL NOT-CAPA capa`. Kill clients not with the specified capabilities.
* `CLIENT KILL NOT-IP ip`. Kill clients not with the specified IP address.

It is possible to provide multiple filters at the same time. The command will handle multiple filters via logical AND. For example:

    CLIENT KILL addr 127.0.0.1:12345 type pubsub

is valid and will kill only a pubsub client with the specified address. This format containing multiple filters is rarely useful currently.

When the new form is used the command no longer returns `OK` or an error, but instead the number of killed clients, that may be zero.

## CLIENT KILL and Valkey Sentinel

Valkey Sentinel uses CLIENT KILL to terminate client connections when an instance is reconfigured.
This mechanism ensures that clients re-establish a connection with a Sentinel, refreshing their configurations.

## Notes

Due to the single-threaded nature of Valkey, it is not possible to
kill a client connection while it is executing a command. From
the client point of view, the connection can never be closed
in the middle of the execution of a command. However, the client
will notice the connection has been closed only when the
next command is sent (and results in network error).
