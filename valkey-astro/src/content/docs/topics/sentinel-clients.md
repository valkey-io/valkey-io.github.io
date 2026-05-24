---
title: "Sentinel client spec"
description: How to build clients for Valkey Sentinel
---

Valkey Sentinel is a monitoring solution for Valkey instances that handles
automatic failover of Valkey primaries and service discovery (who is the current
primary for a given group of instances?). Since Sentinel is both responsible
for reconfiguring instances during failovers, and providing configurations to
clients connecting to Valkey primaries or replicas, clients are required to have
explicit support for Valkey Sentinel.

This document is targeted at Valkey clients developers that want to support Sentinel in their clients implementation with the following goals:

* Automatic configuration of clients via Sentinel.
* Improved safety of Valkey Sentinel automatic failover.

For details about how Valkey Sentinel works, please check the [Valkey Documentation](sentinel.md), as this document only contains information needed for Valkey client developers, and it is expected that readers are familiar with the way Valkey Sentinel works.

## Valkey service discovery via Sentinel

Valkey Sentinel identifies every primary with a name like "stats" or "cache".
Every name actually identifies a *group of instances*, composed of a primary
and a variable number of replicas.

The address of the Valkey primary that is used for a specific purpose inside a network may change after events like an automatic failover, a manually triggered failover (for instance in order to upgrade a Valkey instance), and other reasons.

Normally Valkey clients have some kind of hard-coded configuration that specifies the address of a Valkey primary instance within a network as IP address and port number. However if the primary address changes, manual intervention in every client is needed.

A Valkey client supporting Sentinel can automatically discover the address of a Valkey primary from the primary name using Valkey Sentinel. So instead of a hard coded IP address and port, a client supporting Sentinel should optionally be able to take as input:

* A list of ip:port pairs pointing to known Sentinel instances.
* The name of the service, like "cache" or "timelines".

This is the procedure a client should follow in order to obtain the primary address starting from the list of Sentinels and the service name.

Step 1: connect to the first Sentinel
---

The client should iterate the list of Sentinel addresses. For every address it should try to connect to the Sentinel, using a short timeout (in the order of a few hundreds of milliseconds). On errors or timeouts the next Sentinel address should be tried.

If all the Sentinel addresses were tried without success, an error should be returned to the client.

The first Sentinel replying to the client request should be put at the start of the list, so that at the next reconnection, we'll try first the Sentinel that was reachable in the previous connection attempt, minimizing latency.

Step 2: ask for primary address
---

Once a connection with a Sentinel is established, the client should retry to execute the following command on the Sentinel:

    SENTINEL get-master-addr-by-name master-name

Where *master-name* should be replaced with the actual service name specified by the user.

The result from this call can be one of the following two replies:

* An ip:port pair.
* A null reply. This means Sentinel does not know this primary.

If an ip:port pair is received, this address should be used to connect to the Valkey primary. Otherwise if a null reply is received, the client should try the next Sentinel in the list.

Step 3: call the ROLE command in the target instance
---

Once the client discovered the address of the primary instance, it should
attempt a connection with the primary, and call the `ROLE` command in order
to verify the role of the instance is actually a primary.

If the instance is not a primary as expected, the client should wait a short amount of time (a few hundreds of milliseconds) and should try again starting from Step 1.

Handling reconnections
===

Once the service name is resolved into the primary address and a connection is established with the Valkey primary instance, every time a reconnection is needed, the client should resolve again the address using Sentinels restarting from Step 1. For instance Sentinel should contacted again the following cases:

* If the client reconnects after a timeout or socket error.
* If the client reconnects because it was explicitly closed or reconnected by the user.

In the above cases and any other case where the client lost the connection with the Valkey server, the client should resolve the primary address again.

Sentinel failover disconnection
===

When Valkey Sentinel changes the configuration of
an instance, for example promoting a replica to a primary, demoting a primary to
replicate to the new primary after a failover, or simply changing the primary
address of a stale replica instance, it sends a `CLIENT KILL type normal`
command to the instance in order to make sure all the clients are disconnected
from the reconfigured instance. This will force clients to resolve the primary
address again.

If the client will contact a Sentinel with yet not updated information, the verification of the Valkey instance role via the `ROLE` command will fail, allowing the client to detect that the contacted Sentinel provided stale information, and will try again.

Note: it is possible that a stale primary returns online at the same time a client contacts a stale Sentinel instance, so the client may connect with a stale primary, and yet the ROLE output will match. However when the primary is back again Sentinel will try to demote it to replica, triggering a new disconnection. The same reasoning applies to connecting to stale replicas that will get reconfigured to replicate with a different primary.

Connecting to replicas
===

Sometimes clients are interested to connect to replicas, for example in order to scale read requests. This protocol supports connecting to replicas by modifying step 2 slightly. Instead of calling the following command:

    SENTINEL get-master-addr-by-name master-name

The clients should call instead:

    SENTINEL replicas primary-name

In order to retrieve a list of replica instances.

Symmetrically the client should verify with the `ROLE` command that the
instance is actually a replica, in order to avoid scaling read queries with
the primary.

Connection pools
===

For clients implementing connection pools, on reconnection of a single connection, the Sentinel should be contacted again, and in case of a primary address change all the existing connections should be closed and connected to the new address.

Error reporting
===

The client should correctly return the information to the user in case of errors. Specifically:

* If no Sentinel can be contacted (so that the client was never able to get the reply to `SENTINEL get-master-addr-by-name`), an error that clearly states that Valkey Sentinel is unreachable should be returned.
* If all the Sentinels in the pool replied with a null reply, the user should be informed with an error that Sentinels don't know this primary name.

Sentinels list automatic refresh
===

Optionally once a successful reply to `get-master-addr-by-name` is received, a client may update its internal list of Sentinel nodes following this procedure:

* Obtain a list of other Sentinels for this primary using the command `SENTINEL sentinels <master-name>`.
* Add every ip:port pair not already existing in our list at the end of the list.

It is not needed for a client to be able to make the list persistent updating its own configuration. The ability to upgrade the in-memory representation of the list of Sentinels can be already useful to improve reliability.

Subscribe to Sentinel events to improve responsiveness
===

The [Sentinel documentation](sentinel.md) shows how clients can connect to
Sentinel instances using Pub/Sub in order to subscribe to changes in the
Valkey instances configurations.

This mechanism can be used in order to speedup the reconfiguration of clients,
that is, clients may listen to Pub/Sub in order to know when a configuration
change happened in order to run the three steps protocol explained in this
document in order to resolve the new Valkey primary (or replica) address.

However update messages received via Pub/Sub should not substitute the
above procedure, since there is no guarantee that a client is able to
receive all the update messages.

> NOTE: If not for backward compatibility, the Valkey project no longer uses the words "master" and "slave". Unfortunately in the given commands these words are part of the protocol, so we’ll be able to remove such occurrences only when this API will be naturally deprecated.
