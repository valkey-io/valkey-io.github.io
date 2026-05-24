---
title: "Security"
description: Security model and features in Valkey
---

This document provides an introduction to the topic of security from the point of
view of Valkey. It covers the access control provided by Valkey, code security concerns,
attacks that can be triggered from the outside by selecting malicious inputs, and
other similar topics. 

For security-related contacts, open an issue on GitHub, or when you feel it
is really important to preserve the security of the communication, use the
GPG key at the end of this document.

## Security model

Valkey is designed to be accessed by trusted clients inside trusted environments.
This means that usually it is not a good idea to expose the Valkey instance
directly to the internet or, in general, to an environment where untrusted
clients can directly access the Valkey TCP port or UNIX socket.

For instance, in the common context of a web application implemented using Valkey
as a database, cache, or messaging system, the clients inside the front-end
(web side) of the application will query Valkey to generate pages or
to perform operations requested or triggered by the web application user.

In this case, the web application mediates access between Valkey and
untrusted clients (the user browsers accessing the web application).

In general, untrusted access to Valkey should
always be mediated by a layer implementing ACLs, validating user input,
and deciding what operations to perform against the Valkey instance.

## Network security

Access to the Valkey port should be denied to everybody but trusted clients
in the network, so the servers running Valkey should be directly accessible
only by the computers implementing the application using Valkey.

In the common case of a single computer directly exposed to the internet, such
as a virtualized Linux instance (Linode, EC2, ...), the Valkey port should be
firewalled to prevent access from the outside. Clients will still be able to
access Valkey using the loopback interface.

Note that it is possible to bind Valkey to a single interface by adding a line
like the following to the **valkey.conf** file:

    bind 127.0.0.1

Failing to protect the Valkey port from the outside can have a big security
impact because of the nature of Valkey. For instance, a single `FLUSHALL` command can be used by an external attacker to delete the whole data set.

## Protected mode

Unfortunately, many users fail to protect Valkey instances from being accessed
from external networks. Many instances are simply left exposed on the
internet with public IPs. Valkey enters a special mode called **protected mode** when it is
executed with the default configuration (binding all the interfaces) and
without any password in order to access it. In this mode, Valkey only replies to queries from the
loopback interfaces, and replies to clients connecting from other
addresses with an error that explains the problem and how to configure
Valkey properly.

We expect protected mode to seriously decrease the security issues caused
by unprotected Valkey instances executed without proper administration. However,
the system administrator can still ignore the error given by Valkey and
disable protected mode or manually bind all the interfaces.

## Authentication

Valkey provides two ways to authenticate clients.
The recommended authentication method is via Access Control Lists, allowing named users to be created and assigned fine-grained permissions.
Read more about Access Control Lists [here](acl.md).

The legacy authentication method is enabled by editing the **valkey.conf** file, and providing a database password using the `requirepass` setting.
This password is then used by all clients.

When the `requirepass` setting is enabled, Valkey will refuse any query by
unauthenticated clients. A client can authenticate itself by sending the
**AUTH** command followed by the password.

The password is set by the system administrator in clear text inside the
valkey.conf file. It should be long enough to prevent brute force attacks
for two reasons:

* Valkey is very fast at serving queries. Many passwords per second can be tested by an external client.
* The Valkey password is stored in the **valkey.conf** file and inside the client configuration. Since the system administrator does not need to remember it, the password can be very long.

The goal of the authentication layer is to optionally provide a layer of
redundancy. If firewalling or any other system implemented to protect Valkey
from external attackers fail, an external client will still not be able to
access the Valkey instance without knowledge of the authentication password.

Since the `AUTH` command, like every other Valkey command, is sent unencrypted, it
does not protect against an attacker that has enough access to the network to
perform eavesdropping.

## TLS support

Valkey has optional support for TLS on all communication channels, including
client connections, replication links, and the Valkey Cluster bus protocol. Read more about TLS [here](tls.md).

## Attacks triggered by malicious inputs from external clients

There is a class of attacks that an attacker can trigger from the outside even
without external access to the instance. For example, an attacker might insert data into Valkey that triggers pathological (worst case)
algorithm complexity on data structures implemented inside Valkey internals.

An attacker could supply, via a web form, a set of strings that
are known to hash to the same bucket in a hash table in order to turn the
O(1) expected time (the average time) to the O(N) worst case. This can consume more
CPU than expected and ultimately cause a Denial of Service.

To prevent this specific attack, Valkey uses a per-execution, pseudo-random
seed to the hash function.

Valkey implements the SORT command using the qsort algorithm. Currently,
the algorithm is not randomized, so it is possible to trigger a quadratic
worst-case behavior by carefully selecting the right set of inputs.

## String escaping and NoSQL injection

The Valkey protocol has no concept of string escaping, so injection
is impossible under normal circumstances using a normal client library.
The protocol uses prefixed-length strings and is completely binary safe.

Since Lua scripts executed by the `EVAL` and `EVALSHA` commands follow the
same rules, those commands are also safe.

While it would be a strange use case, the application should avoid composing the body of the Lua script from strings obtained from untrusted sources.

## Code security

Internally, Valkey uses all the well-known practices for writing secure code to
prevent buffer overflows, format bugs, and other memory corruption issues.

Valkey does not require root privileges to run. It is recommended to
run it as an unprivileged *valkey* user that is only used for this purpose.

