+++
title = "Keeping Valkey 9.2 Responsive Under Heavy Load"
date = 2026-11-30
description = "Valkey 9.2 processes cluster heartbeats and replication ahead of client commands. You can also reserve connection slots for your own admin connections, so you can still connect when maxclients is reached."
authors = ["dragosandriciuc", "satheeshagowda"]
draft = true

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = true
featured_image = "/assets/media/featured/random-03.webp"
+++

When your Valkey nodes are overwhelmed with client requests, the problem isn't just slower responses.
Cluster heartbeats and replication traffic also need CPU time to be processed, and monitoring tools may struggle to connect when the server reaches its client connection limit.

That can make an already difficult situation worse, where a healthy node may be marked as failed, triggering an unnecessary failover, while operators struggle to diagnose what is going on.

Up to Valkey 9.1, the event loop treated every connection the same way.
Valkey 9.2 adds Quality of Service (QoS) in two parts.
The first works without any configuration: cluster bus, replication and slot migration connections are processed **ahead** of client traffic.
The second is opt-in: you reserve connection slots for the subnets your operators and monitoring connect from.

Let's see how to configure both features, verify their behavior, and understand their limitations.

## What Valkey 9.2 prioritizes automatically

Valkey 9.2 ensures that the connections that keep the cluster healthy are marked as high priority, and their events are handled **before** client commands.
Connections such as outbound cluster bus, replication and slot migration are marked when Valkey creates them, while inbound ones are promoted when a replica sends [`SYNC`](https://valkey.io/commands/sync/) or [`PSYNC`](https://valkey.io/commands/psync/), or a slot import starts.
Every other client connection stays at normal priority.

The high-priority sockets are kept in a second polling set; it's a separate `epoll` instance on Linux or `kqueue` on macOS and BSD.
That second set is registered **inside** the main one, so traffic on any priority socket still wakes the event loop.

![Event loop processing order with priority events](/assets/media/pictures/event-loop-flow.svg)

The processing order lives in [`aeProcessEvents()`](https://github.com/valkey-io/valkey/blob/9.2.0-rc1/src/ae.c#L609-L630), shown here with the comments shortened:

```c
/* Always drain priority events before processing normal events. */
processed += aeProcessQoSEvents(eventLoop);

for (j = 0; j < numevents; j++) {
    int fd = eventLoop->fired[j].fd;
    if (fd == eventLoop->priority_fd) continue;   /* already processed above */
    aeFireFileEvent(eventLoop, fd, eventLoop->fired[j].mask);
    processed++;
    /* Every 4th event: drain priority events again if the interval has passed. */
    if ((j & AE_QOS_PREEMPT_CHECK_MASK) == 0)
        processed += aeProcessQoSEventsPreemptively(eventLoop);
}
```

Priority events are drained before any client event.
While Valkey works through a batch of client events, it checks every fourth event whether `priority-preemptive-poll-interval-us` (2000 µs by default) has passed, and if so, then it drains the priority set again.
Setting `priority-preemptive-poll-interval-us` to `0` turns off the mid-batch check; however priority events are **still** drained first on every cycle.
On builds that use `select` or `evport`, Valkey cannot nest polling sets, so it runs without prioritization and logs the following line at startup:

```text
QoS event prioritization not supported on <backend> multiplexer, falling back to standard event processing
```

### Check it on your nodes

Replication links are client connections, so they show up in [`CLIENT LIST`](https://valkey.io/commands/client-list/) with the new `H` flag.
The following examples are from a 6-node cluster running on Valkey 9.2.0-rc1 in Docker, with 3 primaries, 3 replicas, all on `epoll`.
On a primary with one replica:

```shell
valkey-cli CLIENT LIST FLAGS H
```

```text
id=5 addr=127.0.0.1:38888 laddr=127.0.0.1:6371 fd=23 name= age=43 idle=0 flags=SH capa= db=0 sub=0 psub=0 ssub=0 multi=-1 watch=0 qbuf=0 qbuf-free=0 argv-mem=0 multi-mem=0 rbs=1024 rbp=0 obl=0 oll=1 omem=20504 tot-mem=22168 events=r cmd=replconf user=default redir=-1 resp=2 lib-name= lib-ver= tot-net-in=2267 tot-net-out=83 tot-cmds=43
```

Cluster bus links aren't clients, so they don't appear in `CLIENT LIST`.
To see if priority events are being processed, watch the new event loop fields using the [`INFO`](https://valkey.io/commands/info/) command:

```shell
valkey-cli INFO stats | grep eventloop_priority
```

```text
eventloop_priority_cycles:331
eventloop_priority_duration_sum:17959
eventloop_priority_duration_cmd_sum:165
```

```shell
valkey-cli INFO debug | grep eventloop_priority
```

```text
eventloop_priority_duration_max:185
eventloop_priority_cmd_per_cycle_max:1
```

In the above examples, the counters move even with no client traffic, because cluster bus heartbeats still need to go through the priority set.
The above event loop fields mean the following:

- `eventloop_priority_cycles` counts how many times Valkey drained priority events,
- `eventloop_priority_duration_sum` is the total time it spent doing so in microseconds,
- `eventloop_priority_duration_cmd_sum` is the time spent running commands from priority clients, in microseconds, and
- `INFO debug` adds the longest single drain and the most commands processed in one drain.

## Reserving connection slots for operators

While prioritizing heartbeats is useful, it doesn't really help your monitoring agent if the node refuses its connection.
`maxclients` applies to **everyone**, so when application clients fill it, operators are locked out with them.

The second part of Valkey 9.2's improvements focuses on adding two configs for this:

- `priority-subnets` lists the IP addresses or Classless Inter-Domain Routing (CIDR) subnets your admin connections come from, and
- `maxclients-reserved` sets how many slots inside `maxclients` are reserved for them.

Valkey now checks the source IP of every new connection against `priority-subnets` before it creates a client.
The check happens in [`hasMaxClientsLimitReached()`](https://github.com/valkey-io/valkey/blob/9.2.0-rc1/src/networking.c#L2043-L2065), simplified here:

```c
total = clients + cluster_connections;
if (total >= maxclients)  return true;   /* hard limit, applies to everyone */
if (is_prioritized)       return false;  /* from priority-subnets = admitted */

if (maxclients_reserved > 0 && priority_subnets_count > 0) {
    normal_limit = maxclients - maxclients_reserved;
    return (total - priority_clients) >= normal_limit;
}
return false;
```

With this improvement, normal clients can use at most `maxclients` minus `maxclients-reserved` slots, while clients from `priority-subnets` can connect up to `maxclients`.
The reservation only takes effect when both configurations are set.
It is a minimum for admin connections though, not a cap: if admin connections go past it and fill the node, normal clients are refused by the hard limit.
Clients from `priority-subnets` also get the event loop priority from the previous section, so list only operator and monitoring hosts there, not application servers.

In `valkey.conf`:

```text
maxclients 10000
priority-subnets "10.20.0.0/24"
maxclients-reserved 128
```

You can change both configs at runtime with [`CONFIG SET`](https://valkey.io/commands/config-set/).
Raising `maxclients-reserved` doesn't disconnect anyone; new normal clients are refused until enough existing ones disconnect.

### Try the reservation on one machine

To try this reservation you need two source addresses: one in `priority-subnets` and one outside it.
On a Linux test machine, you can use loopback as the admin address and the machine’s LAN address as the application one.
Start a node with six slots and reserve two:

```shell
valkey-server --port 6379 --protected-mode no --daemonize yes \
  --maxclients 6 --maxclients-reserved 2 --priority-subnets "127.0.0.1/32"
LAN_IP=$(hostname -I | awk '{print $1}')
```

`--protected-mode no` lets the LAN address connect without a password, **so use it only on a test machine**.
Fill the four normal slots with blocking clients, then try a fifth:

```shell
for i in 1 2 3 4; do valkey-cli -h "$LAN_IP" BLPOP demo 0 & done
valkey-cli -h "$LAN_IP" PING
```

```text
ERR max number of clients reached
```

The admin connection from loopback still gets in:

```shell
valkey-cli -h 127.0.0.1 INFO clients | grep -E 'connected_(priority_)?clients'
```

```text
connected_clients:5
connected_priority_clients:1
```

```shell
valkey-cli -h 127.0.0.1 INFO stats | grep -E 'rejected_(priority_)?connections'
```

```text
rejected_connections:1
rejected_priority_connections:0
```

In the above example, `rejected_priority_connections` only counts admin connections refused by the hard `maxclients` limit, so it stays 0 here.

## What QoS doesn't do

The QoS improvements above only change the order of work, not the amount of it, so a few situations are still unchanged.

- A command or script that is already running isn't interrupted: priority events wait until a long [`EVALSHA`](https://valkey.io/commands/evalsha/) returns.
- Normal clients aren't throttled: their events are interleaved with priority drains, not deferred.
- Unix socket connections never match `priority-subnets`, so a local admin connecting over the socket isn't protected by the reservation.
- A normal client refused because of the reservation gets the same error as when `maxclients` is reached.
- Builds on `select` or `evport` get no event prioritization; the slot reservation still works.

Both changes were written by [Satheesha Gowda](https://github.com/satheeshaGowda), with [Jim Brunner](https://github.com/JimB123) co-authoring the connection reservation:

- [#4076](https://github.com/valkey-io/valkey/pull/4076) for socket prioritization, and
- [#4005](https://github.com/valkey-io/valkey/pull/4005) for reserved slots.

## Try it on Valkey 9.2

Install [Valkey 9.2](https://valkey.io/download/) on a test node, set `priority-subnets` to the subnet your monitoring runs from, and watch `connected_priority_clients` and the `eventloop_priority_*` fields under your normal load.
If the numbers don't match what you expect, [open an issue](https://github.com/valkey-io/valkey/issues) with your configuration and `INFO` output.
