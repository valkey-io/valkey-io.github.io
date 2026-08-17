+++
title = "Analyzing Atomic Slot Migration ACL requirements"
date = 2026-08-21
description = "Explains the ACL permissions required by Atomic Slot Migration and how to debug permission failures"
authors = ["hieun"]

[taxonomies]
blog_type = ["Technical Deep Dive"]
+++


Valkey 9.0 introduced Atomic Slot Migration (ASM), a new resharding mechanism that replaces the traditional key-by-key migration process with a replication-inspired approach. Instead of copying individual keys using MIGRATE, the source node establishes a dedicated connection to the target node and streams the contents of the migrating hash slots, followed by incremental updates until both nodes are synchronized. Once synchronization completes, ownership of the slot is transferred atomically.

Since ASM internally reuses much of the replication infrastructure, it is natural to assume that it can reuse the same ACL permissions as a replica (which includes permission to execute the command `CLUSTER SYNCSLOTS` also introduced in Valkey 9.0):

```
+psync +replconf +ping +cluster|syncslots
```

And with these permissions, when you execute `CLUSTER MIGRATESLOTS` on a fresh cluster, it will complete successfully:

```
127.0.0.1:30001> CLUSTER MIGRATESLOTS SLOTSRANGE 0 0 NODE c5937fede5fa8d4e8aaf04070f2f95cbc0682793
OK

127.0.0.1:30001> CLUSTER GETSLOTMIGRATIONS

1) 1# "name" => "556e352d6e43762a679c8146d589cdfd7a4511cd"
    2# "operation" => "EXPORT"
    3# "slot_ranges" => "0-0"
    4# "target_node" => "c5937fede5fa8d4e8aaf04070f2f95cbc0682793"
    5# "source_node" => "ff4819d483cf6aa47e76bc6e709f42f0bacee339"
    6# "create_time" => (integer) 1786075575
    7# "last_update_time" => (integer) 1786075575
    8# "last_ack_time" => (integer) 1786075575
    9# "state" => "success"
   10# "message" => ""
   11# "cow_size" => (integer) 0
   12# "remaining_repl_size" => (integer) 0
```

But if the slot contains data, the operation will fail:

```
127.0.0.1:30001> CLUSTER COUNTKEYSINSLOT 866
(integer) 1

127.0.0.1:30001> CLUSTER GETSLOTMIGRATIONS
2)  1# "name" => "8558969071de71819f291d0e1e9a8b6bc6a769d5"
    2# "operation" => "EXPORT"
    3# "slot_ranges" => "866-866"
    4# "target_node" => "c5937fede5fa8d4e8aaf04070f2f95cbc0682793"
    5# "source_node" => "ff4819d483cf6aa47e76bc6e709f42f0bacee339"
    6# "create_time" => (integer) 1786076572
    7# "last_update_time" => (integer) 1786076572
    8# "last_ack_time" => (integer) 1786076572
    9# "state" => "failed"
   10# "message" => "Connection lost to target. Check CLUSTER GETSLOTMIGRATIONS on the target node for more information."
   11# "cow_size" => (integer) 0
   12# "remaining_repl_size" => (integer) 0
```

And the log of the target node will report that the operation failed due to the replication user not being permitted to write data (running `SET` commands):

```
5737:M 07 Aug 2026 04:22:14.205 *New slot import job created: {name: 4da2c12235bc1c9a9efebe1fd99a885e805ea081, operation: import, source_node_id: ff4819d483cf6aa47e76bc6e709f42f0bacee339, slots: 866-866}.
5737:M 07 Aug 2026 04:22:14.206* Slot migration {name: 4da2c12235bc1c9a9efebe1fd99a885e805ea081, operation: import, source_node_id: ff4819d483cf6aa47e76bc6e709f42f0bacee339, slots: 866-866} state transition: waiting-for-ack -> receiving-snapshot
5737:M 07 Aug 2026 04:22:14.247 # == CRITICAL == This slot-import-target is sending an error to its slot-import-source: '-NOPERM User replicator has no permissions to run the 'set' command' after processing the command 'set'
```

This raises the question:
> If ASM behaves like replication, why does it require write access while replication does not?

## Why does ASM require write access to Valkey?

To understand this issue, we need to know what the difference is between ASM and a normal replication process. Specifically, about where the ASM and replication requests originate from.

### How the (normal) replication process works

A normal replica establishes a replication link by authenticating to the primary and issuing:

```
PING
REPLCONF
PSYNC
```

Once the primary accepts the request, it begins streaming an RDB snapshot followed by incremental replication data. In the source code (specifically, function `replicationCreatePrimaryClientWithHandler`), we can see that the user associated with this link is NULL:

```c
void replicationCreatePrimaryClientWithHandler(connection *conn, int dbid, ConnectionCallbackFunc handler) {
 server.primary = createClient(conn);
 if (conn) connSetReadHandler(server.primary->conn, handler);
 server.primary->flag.primary = 1;
 clientSetUser(server.primary, NULL, 1);
 // removed for brevity
 server.primary->user = NULL; /* This client can do everything. */
 // removed for brevity
}
```

As noted in the comment above, when no user is associated with a connection, it is treated as a superuser client and can do everything. We can also verify this client's capability by looking at the function `ACLCheckAllUserCommandPerm`:

```c
/* Lower level API that checks if a specified user is able to execute a given command.
* If the command fails an ACL check, idxptr will be to set to the first argv entry that
* causes the failure, either 0 if the command itself fails or the idx of the key/channel
* that causes the failure */

int ACLCheckAllUserCommandPerm(user *u, struct serverCommand*cmd, robj **argv, int argc, int dbid, int *idxptr) {
 listIter li;
 listNode *ln;
 /* If there is no associated user, the connection can run anything.*/
 if (u == NULL) return ACL_OK;
 // removed for brevity
}
```

So, the replication user only needs permission to keep the connection alive (`PING`) and fetch the data from the primary (`PSYNC`, `REPLCONF`). Those data are then applied to the replica as a superuser; thus, the replication user does not need any write permissions.

### How ASM connection works

While ASM also copies data using the replication process (and using the `primaryuser` credentials), instead of having the target node pulling data from the current owner, it is the current slot owner pushing data to the target.
We can verify this by attaching a GDB debug session to the target valkey-server process, and setting a breakpoint at the function `afterErrorReply` (where the log entry `== CRITICAL == This slot-import-target...` is created):

```c
gdb -ex 'break afterErrorReply' -ex 'continue' -p <target valkey-server PID>
```

`SET`ting some keys and then migrating the hash slot:

```
127.0.0.1:30002> SET hello world
-> Redirected to slot [866] located at 127.0.0.1:30001
OK
127.0.0.1:30001> CLUSTER MIGRATESLOTS SLOTSRANGE 866 866 NODE <target node ID>
OK
```

Go back to the GDB session, and we see that the process has hit the breakpoint we set earlier

```c
Thread 1 "valkey-server" hit Breakpoint 1.5, afterErrorReply (flags=0, len=62, s=0xffff9ea47203 "-NOPERM User replicator has no permissions to run the 'set' command", c=0xffff9e49a500) at /opt/valkey/src/networking.c:848
848     void afterErrorReply(client *c, const char*s, size_t len, int flags) {
(gdb)
```

Going down the stacktrace, we can find that the hash slot data is being imported in the function `processCommand` (being the frame right before the error `NOPERM`):

```c
(gdb) backtrace
# 0  afterErrorReply (flags=0, len=62, s=0xffff9ea47203 "-NOPERM User replicator has no permissions to run the 'set' command", c=0xffff9e49a500) at /opt/valkey/src/networking.c:848
# 1  addReplyErrorSdsEx (c=0xffff9e49a500, err=0xffff9ea47203 "-NOPERM User replicator has no permissions to run the 'set' command", flags=0) at /opt/valkey/src/networking.c:991
# 2  0x0000aaaab5c44db4 in rejectCommandFormat (c=c@entry=0xffff9e49a500, notify_modules=notify_modules@entry=0, fmt=fmt@entry=0xaaaab5dbf060 "-NOPERM %s") at /opt/valkey/src/server.c:4134
# 3  0x0000aaaab5c47348 in processCommand (c=0xffff9e49a500) at /opt/valkey/src/server.c:4391
# 4  0x0000aaaab5be6fb0 in processCommandAndResetClient (c=0xffff9e49a500) at /opt/valkey/src/networking.c:3919
# 5  processInputBuffer (c=c@entry=0xffff9e49a500) at /opt/valkey/src/networking.c:4222
# 6  0x0000aaaab5be7484 in readQueryFromClient (conn=<optimized out>) at /opt/valkey/src/networking.c:4335
# 7  0x0000aaaab5c52d98 in callHandler (handler=<optimized out>, conn=0xffff9ea46d80) at /opt/valkey/src/connhelpers.h:79
# 8  connSocketEventHandler (el=<optimized out>, fd=<optimized out>, clientData=0xffff9ea46d80, mask=1) at /opt/valkey/src/socket.c:301
# 9  0x0000aaaab5b16f60 in aeProcessEvents (flags=27, eventLoop=0xffff9ea53140) at /opt/valkey/src/ae.c:486
# 10 aeProcessEvents (flags=27, eventLoop=0xffff9ea53140) at /opt/valkey/src/ae.c:411
# 11 aeMain (eventLoop=0xffff9ea53140) at /opt/valkey/src/ae.c:543
# 12 0x0000aaaab5b080fc in main (argc=35, argv=<optimized out>) at /opt/valkey/src/server.c:7765
```

By printing the argument of processCommand, we can see what is being sent from the current slot owner

```c
(gdb) frame 3
# 3  0x0000aaaab5c47348 in processCommand (c=0xffff9e49a500) at /opt/valkey/src/server.c:4391
4391            rejectCommandFormat(c, 0, "-NOPERM %s", msg);
(gdb) print c->querybuf
$16 = (sds) 0xffff9ebf6005 "*3\r\n$3\r\nSET\r\n$5\r\nhello\r\n$5\r\nworld\r\n*3\r\n$7\r\nCLUSTER\r\n$9\r\nSYNCSLOTS\r\n$12\r\nSNAPSHOT-EOF\r\n"
```

So the target node is asked to process `SET hello world` and `CLUSTER SYNCSLOTS SNAPSHOT-EOF` (You can read more about how to understand the RESP format in [Valkey Serialization Protocol Specification](https://valkey.io/topics/protocol/)). And these commands are being sent by the replication user instead of the internal superuser like in the replication process:

```c
(gdb) p *c->user
$20 = {
  name = 0xffff9ea377d1 "replicator",
  flags = 9,
  passwords = 0xffff9ea3a990,
  selectors = 0xffff9ea3a9c0,
  acl_string = 0x0
}
```

## So what permissions does ASM actually need?

Since ASM is pushing data to the target Valkey instance, it needs write permission like a normal client. It will also need to be granted permission for `SELECT`, as starting with version 9.0, Valkey cluster supports multiple databases. Also, as the `@write` category also includes destructive commands like `FLUSHDB` and `FLUSHALL`, we need to exclude them:

```
+select +@write ~* -flushall -flushdb -restore -del -unlink -restore
```

So the replication user (specified by the config parameter `primaryuser`) will need the following ACL permissions:

```
+psync +replconf +ping +cluster|syncslots +select +@write ~* -flushall -flushdb -restore -del -unlink -restore
```

## Conclusion

Although ASM reuses Valkey’s replication infrastructure, its ACL requirements differ from normal replication because migrated commands are executed on the target as the authenticated `primaryuser`, rather than an internal super-user client. This means migrating populated slots requires write access in addition to the usual replication permissions.

For ASM to work correctly, the replication user therefore needs `+psync +replconf +ping +cluster|syncslots +select +@write ~* -flushall -flushdb -restore -del -unlink -restore`.
