---
title: "ROLE"
description: "ROLE command reference documentation"
---

Provide information on the role of a Valkey instance in the context of replication, by returning if the instance is currently a `master`, `slave`, or `sentinel`. The command also returns additional information about the state of the replication (if the role is primary or replica) or the list of monitored primary names (if the role is sentinel).

## Output format

The command returns an array of elements. The first element is the role of
the instance, as one of the following three strings:

* "master"
* "slave"
* "sentinel"

The additional elements of the array depends on the role.

## Primary output

An example of output when `ROLE` is called in a primary instance:

```
1) "master"
2) (integer) 3129659
3) 1) 1) "127.0.0.1"
      2) "9001"
      3) "3129242"
   2) 1) "127.0.0.1"
      2) "9002"
      3) "3129543"
```

The primary output is composed of the following parts:

1. The string `master`.
2. The current primary replication offset, which is an offset that primaries and replicas share to understand, in partial resynchronizations, the part of the replication stream the replicas needs to fetch to continue.
3. An array composed of three elements array representing the online replicas. Every sub-array contains the replica IP, port, and the last acknowledged replication offset.

## Output of the command on replicas

An example of output when `ROLE` is called in a replica instance:

```
1) "slave"
2) "127.0.0.1"
3) (integer) 9000
4) "connected"
5) (integer) 3167038
```

The replica output is composed of the following parts:

1. The string `slave`, because of Redis OSS compatibility (see note at the end of this page).
2. The IP of the primary.
3. The port number of the primary.
4. The state of the replication from the point of view of the replica, that can be `connect` (the instance needs to connect to its primary), `connecting` (the primary-replica connection is in progress), `handshake` (the primary and replica are doing the handshake), `sync` (the primary and replica are trying to perform the synchronization), `connected` (the replica is online).
5. The amount of data received from the replica so far in terms of primary replication offset.

## Sentinel output

An example of Sentinel output:

```
1) "sentinel"
2) 1) "resque-master"
   2) "html-fragments-master"
   3) "stats-master"
   4) "metadata-master"
```

The sentinel output is composed of the following parts:

1. The string `sentinel`.
2. An array of primary names monitored by this Sentinel instance.

## Examples

```
127.0.0.1:6379> ROLE
1) "master"
2) (integer) 0
3) (empty array)
```

**A note about the word slave used in this man page**: If not for backward compatibility, the Valkey project no longer uses the words "master" and "slave". Unfortunately in the given commands these words are part of the protocol, so we'll be able to remove such occurrences only when this API will be naturally deprecated.