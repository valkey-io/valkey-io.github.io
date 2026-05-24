---
title: Cluster tutorial
description: Horizontal scaling with Valkey Cluster
---

Valkey scales horizontally with a deployment topology called Valkey Cluster. 
This topic will teach you how to set up, test, and operate Valkey Cluster in production.
You will learn about the availability and consistency characteristics of Valkey Cluster from the end user's point of view.

If you plan to run a production Valkey Cluster deployment or want to understand better how Valkey Cluster works internally, consult the [Valkey Cluster specification](cluster-spec.md).

## Valkey Cluster 101

Valkey Cluster provides a way to run a Valkey installation where data is automatically sharded across multiple Valkey nodes. 
Valkey Cluster also provides some degree of availability during partitions&mdash;in practical terms, the ability to continue operations when some nodes fail or are unable to communicate. 
However, the cluster will become unavailable in the event of larger failures (for example, when the majority of primaries are unavailable).

So, with Valkey Cluster, you get the ability to:

* Automatically split your dataset among multiple nodes.
* Continue operations when a subset of the nodes are experiencing failures or are unable to communicate with the rest of the cluster.

#### Valkey Cluster TCP ports

Every Valkey Cluster node requires two open TCP connections: a Valkey TCP port used to serve clients, e.g., 6379, and second port known as the _cluster bus port_. 
By default, the cluster bus port is set by adding 10000 to the data port (e.g., 16379); however, you can override this in the `cluster-port` configuration.

Cluster bus is a node-to-node communication channel that uses a binary protocol, which is more suited to exchanging information between nodes due to
little bandwidth and processing time. 
Nodes use the cluster bus for failure detection, configuration updates, failover authorization, and so forth. 
Clients should never try to communicate with the cluster bus port, but rather use the Valkey command port. 
However, make sure you open both ports in your firewall, otherwise Valkey cluster nodes won't be able to communicate.

For a Valkey Cluster to work properly you need, for each node:

1. The client communication port (usually 6379) used to communicate with clients and be open to all the clients that need to reach the cluster, plus all the other cluster nodes that use the client port for key migrations.
2. The cluster bus port must be reachable from all the other cluster nodes.

If you don't open both TCP ports, your cluster will not work as expected.

#### Valkey Cluster and Docker

Currently, Valkey Cluster does not support NATted environments and in general
environments where IP addresses or TCP ports are remapped.

Docker uses a technique called _port mapping_: programs running inside Docker containers may be exposed with a different port compared to the one the program believes to be using. 
This is useful for running multiple containers using the same ports, at the same time, in the same server.

To make Docker compatible with Valkey Cluster, you need to use Docker's _host networking mode_. 
Please see the `--net=host` option in the [Docker documentation](https://docs.docker.com/engine/userguide/networking/dockernetworks/) for more information.

#### Valkey Cluster data sharding

Valkey Cluster does not use consistent hashing, but a different form of sharding
where every key is conceptually part of what we call a **hash slot**.

There are 16384 hash slots in Valkey Cluster, and to compute the hash
slot for a given key, we simply take the CRC16 of the key modulo
16384.

Every node in a Valkey Cluster is responsible for a subset of the hash slots,
so, for example, you may have a cluster with 3 nodes, where:

* Node A contains hash slots from 0 to 5500.
* Node B contains hash slots from 5501 to 11000.
* Node C contains hash slots from 11001 to 16383.

This makes it easy to add and remove cluster nodes. For example, if
I want to add a new node D, I need to move some hash slots from nodes A, B, C
to D. Similarly, if I want to remove node A from the cluster, I can just
move the hash slots served by A to B and C. Once node A is empty,
I can remove it from the cluster completely.

Moving hash slots from a node to another does not require stopping
any operations; therefore, adding and removing nodes, or changing the percentage of hash slots held by a node, requires no downtime.

Valkey Cluster supports multiple key operations as long as all of the keys involved in a single command execution (or whole transaction, or Lua script
execution) belong to the same hash slot. The user can force multiple keys
to be part of the same hash slot by using a feature called *hash tags*.

Hash tags are documented in the Valkey Cluster specification, but the gist is
that if there is a substring between {} brackets in a key, only what is
inside the string is hashed. For example, the keys `user:{123}:profile` and `user:{123}:account` are guaranteed to be in the same hash slot because they share the same hash tag. As a result, you can operate on these two keys in the same multi-key operation.

#### Valkey Cluster primary-replica model

To remain available when a subset of primary nodes are failing or are
not able to communicate with the majority of nodes, Valkey Cluster uses a
primary-replica model where every hash slot has from 1 (the primary itself) to N
replicas (N-1 additional replica nodes).

In our example cluster with nodes A, B, C, if node B fails the cluster is not
able to continue, since we no longer have a way to serve hash slots in the
range 5501-11000.

However, when the cluster is created (or at a later time), we add a replica
node to every primary, so that the final cluster is composed of A, B, C
that are primary nodes, and A1, B1, C1 that are replica nodes.
This way, the system can continue if node B fails.

Node B1 replicates B, and B fails, the cluster will promote node B1 as the new
primary and will continue to operate correctly.

However, note that if nodes B and B1 fail at the same time, Valkey Cluster will not be able to continue to operate.

#### Valkey Cluster consistency guarantees

Valkey Cluster does not guarantee **strong consistency**. In practical
terms this means that under certain conditions it is possible that Valkey
Cluster will lose writes that were acknowledged by the system to the client.

The first reason why Valkey Cluster can lose writes is because it uses
asynchronous replication. This means that during writes the following
happens:

* Your client writes to the primary B.
* The primary B replies OK to your client.
* The primary B propagates the write to its replicas B1, B2 and B3.

As you can see, B does not wait for an acknowledgement from B1, B2, B3 before
replying to the client, since this would be a prohibitive latency penalty
for Valkey, so if your client writes something, B acknowledges the write,
but crashes before being able to send the write to its replicas, one of the
replicas (that did not receive the write) can be promoted to primary, losing
the write forever.

This is very similar to what happens with most databases that are
configured to flush data to disk every second, so it is a scenario you
are already able to reason about because of past experiences with traditional
database systems not involving distributed systems. Similarly you can
improve consistency by forcing the database to flush data to disk before
replying to the client, but this usually results in prohibitively low
performance. That would be the equivalent of synchronous replication in
the case of Valkey Cluster.

Basically, there is a trade-off to be made between performance and consistency.

Valkey Cluster has support for synchronous writes when absolutely needed,
implemented via the `WAIT` command. This makes losing writes a lot less
likely. However, note that Valkey Cluster does not implement strong consistency
even when synchronous replication is used: it is always possible, under more
complex failure scenarios, that a replica that was not able to receive the write
will be elected as primary.

There is another notable scenario where Valkey Cluster will lose writes, that
happens during a network partition where a client is isolated with a minority
of instances including at least a primary.

Take as an example our 6 nodes cluster composed of A, B, C, A1, B1, C1,
with 3 primaries and 3 replicas. There is also a client, that we will call Z1.

After a partition occurs, it is possible that in one side of the
partition we have A, C, A1, B1, C1, and in the other side we have B and Z1.

Z1 is still able to write to B, which will accept its writes. If the
partition heals in a very short time, the cluster will continue normally.
However, if the partition lasts enough time for B1 to be promoted to primary
on the majority side of the partition, the writes that Z1 has sent to B
in the meantime will be lost.

**Note:**
There is a **maximum window** to the amount of writes Z1 will be able
to send to B: if enough time has elapsed for the majority side of the
partition to elect a replica as primary, every primary node in the minority
side will have stopped accepting writes.

This amount of time is a very important configuration directive of Valkey
Cluster, and is called the **node timeout**.

After node timeout has elapsed, a primary node is considered to be failing,
and can be replaced by one of its replicas.
Similarly, after node timeout has elapsed without a primary node to be able
to sense the majority of the other primary nodes, it enters an error state
and stops accepting writes.

## Valkey Cluster configuration parameters

We are about to create an example cluster deployment. 
Before we continue, let's introduce the configuration parameters that Valkey Cluster introduces
in the `valkey.conf` file.

* **cluster-enabled `<yes/no>`**: If yes, enables Valkey Cluster support in a specific Valkey instance. Otherwise the instance starts as a standalone instance as usual.
* **cluster-config-file `<filename>`**: Note that despite the name of this option, this is not a user editable configuration file, but the file where a Valkey Cluster node automatically persists the cluster configuration (the state, basically) every time there is a change, in order to be able to re-read it at startup. The file lists things like the other nodes in the cluster, their state, persistent variables, and so forth. Often this file is rewritten and flushed on disk as a result of some message reception.
* **cluster-node-timeout `<milliseconds>`**: The maximum amount of time a Valkey Cluster node can be unavailable, without it being considered as failing. If a primary node is not reachable for more than the specified amount of time, it will be failed over by its replicas. This parameter controls other important things in Valkey Cluster. Notably, every node that can't reach the majority of primary nodes for the specified amount of time, will stop accepting queries.
* **cluster-replica-validity-factor `<factor>`**: If set to zero, a replica will always consider itself valid, and will therefore always try to failover a primary, regardless of the amount of time the link between the primary and the replica remained disconnected. If the value is positive, a maximum disconnection time is calculated as the *node timeout* value multiplied by the factor provided with this option, and if the node is a replica, it will not try to start a failover if the primary link was disconnected for more than the specified amount of time. For example, if the node timeout is set to 5 seconds and the validity factor is set to 10, a replica disconnected from the primary for more than 50 seconds will not try to failover its primary. Note that any value different than zero may result in Valkey Cluster being unavailable after a primary failure if there is no replica that is able to failover it. In that case the cluster will return to being available only when the original primary rejoins the cluster.
* **cluster-migration-barrier `<count>`**: Minimum number of replicas a primary will remain connected with, for another replica to migrate to a primary which is no longer covered by any replica. See the appropriate section about replica migration in this tutorial for more information.
* **cluster-require-full-coverage `<yes/no>`**: If this is set to yes, as it is by default, the cluster stops accepting writes if some percentage of the key space is not covered by any node. If the option is set to no, the cluster will still serve queries even if only requests about a subset of keys can be processed.
* **cluster-allow-reads-when-down `<yes/no>`**: If this is set to no, as it is by default, a node in a Valkey Cluster will stop serving all traffic when the cluster is marked as failed, either when a node can't reach a quorum of primaries or when full coverage is not met. This prevents reading potentially inconsistent data from a node that is unaware of changes in the cluster. This option can be set to yes to allow reads from a node during the fail state, which is useful for applications that want to prioritize read availability but still want to prevent inconsistent writes. It can also be used for when using Valkey Cluster with only one or two shards, as it allows the nodes to continue serving writes when a primary fails but automatic failover is impossible.

## Create and use a Valkey Cluster

To create and use a Valkey Cluster, follow these steps:

* [Create a Valkey Cluster](#create-a-valkey-cluster)
* [Interact with the cluster](#interact-with-the-cluster)
* [Write an example app with redis-rb-cluster](#write-an-example-app-with-redis-rb-cluster)
* [Reshard the cluster](#reshard-the-cluster)
* [A more interesting example application](#a-more-interesting-example-application)
* [Test the failover](#test-the-failover)
* [Manual failover](#manual-failover)
* [Add a new node](#add-a-new-node)
* [Remove a node](#remove-a-node)
* [Replica migration](#replica-migration)
* [Upgrade nodes in a Valkey Cluster](#upgrade-nodes-in-a-valkey-cluster)
* [Migrate to Valkey Cluster](#migrate-to-valkey-cluster)

But, first, familiarize yourself with the requirements for creating a cluster.

#### Requirements to create a Valkey Cluster

To create a cluster, the first thing you need is to have a few empty Valkey instances running in _cluster mode_. 

At minimum, set the following directives in the `valkey.conf` file:

```
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

To enable cluster mode, set the `cluster-enabled` directive to `yes`.
Every instance also contains the path of a file where the
configuration for this node is stored, which by default is `nodes.conf`.
This file is never touched by humans; it is simply generated at startup
by the Valkey Cluster instances, and updated every time it is needed.

Note that the **minimal cluster** that works as expected must contain
at least three primary nodes. For deployment, we strongly recommend
a six-node cluster, with three primaries and three replicas.

You can test this locally by creating the following directories named
after the port number of the instance you'll run inside any given directory.

For example:

```
mkdir cluster-test
cd cluster-test
mkdir 7000 7001 7002 7003 7004 7005
```

Create a `valkey.conf` file inside each of the directories, from 7000 to 7005.
As a template for your configuration file just use the small example above,
but make sure to replace the port number `7000` with the right port number
according to the directory name.


You can start each instance as follows, each running in a separate terminal tab:

```
cd 7000
valkey-server ./valkey.conf
```
You'll see from the logs that every node assigns itself a new ID:

    [82462] 26 Nov 11:56:55.329 * No cluster configuration found, I'm 97a3a64667477371c4479320d683e4c8db5858b1

This ID will be used forever by this specific instance in order for the instance
to have a unique name in the context of the cluster. Every node
remembers every other node using this IDs, and not by IP or port.
IP addresses and ports may change, but the unique node identifier will never
change for all the life of the node. We call this identifier simply **Node ID**.

#### Create a Valkey Cluster

Now that we have a number of instances running, you need to create your cluster by writing some meaningful configuration to the nodes.

You can configure and execute individual instances manually or use the create-cluster script.
Let's go over how you do it manually.

To create the cluster, run:

    valkey-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 \
    127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
    --cluster-replicas 1

The command used here is **create**, since we want to create a new cluster.
The option `--cluster-replicas 1` means that we want a replica for every primary created.

The other arguments are the list of addresses of the instances I want to use
to create the new cluster.

`valkey-cli` will propose a configuration. Accept the proposed configuration by typing **yes**.
The cluster will be configured and *joined*, which means that instances will be
bootstrapped into talking with each other. Finally, if everything has gone well, you'll see a message like this:

    [OK] All 16384 slots covered

This means that there is at least one primary instance serving each of the
16384 available slots.

If you don't want to create a Valkey Cluster by configuring and executing
individual instances manually as explained above, there is a much simpler
system (but you'll not learn the same amount of operational details).

Find the `utils/create-cluster` directory in the Valkey distribution.
There is a script called `create-cluster` inside (same name as the directory
it is contained into), it's a simple bash script. In order to start
a 6 nodes cluster with 3 primaries and 3 replicas just type the following
commands:

1. `create-cluster start`
2. `create-cluster create`

Reply to `yes` in step 2 when the `valkey-cli` utility wants you to accept
the cluster layout.

You can now interact with the cluster, the first node will start at port 30001
by default. When you are done, stop the cluster with:

3. `create-cluster stop`

Please read the `README` inside this directory for more information on how
to run the script.

#### Interact with the cluster

To connect to Valkey Cluster, you'll need a cluster-aware Valkey client. 
See the documentation for your [client of choice](../clients/) to determine its cluster support.

You can also test your Valkey Cluster using the `valkey-cli` command line utility:

```
$ valkey-cli -c -p 7000
127.0.0.1:7000> set foo bar
-> Redirected to slot [12182] located at 127.0.0.1:7002
OK
127.0.0.1:7002> set hello world
-> Redirected to slot [866] located at 127.0.0.1:7000
OK
127.0.0.1:7000> get foo
-> Redirected to slot [12182] located at 127.0.0.1:7002
"bar"
127.0.0.1:7002> get hello
-> Redirected to slot [866] located at 127.0.0.1:7000
"world"
```

**Note:**
If you created the cluster using the script, your nodes may listen
on different ports, starting from 30001 by default.

The `valkey-cli` cluster support is very basic, so it always uses the fact that
Valkey Cluster nodes are able to redirect a client to the right node.
A serious client is able to do better than that, and cache the map between
hash slots and nodes addresses, to directly use the right connection to the
right node. The map is refreshed only when something changed in the cluster
configuration, for example after a failover or after the system administrator
changed the cluster layout by adding or removing nodes.

#### Write an example app with redis-rb-cluster

Before going forward showing how to operate the Valkey Cluster, doing things
like a failover, or a resharding, we need to create some example application
or at least to be able to understand the semantics of a simple Valkey Cluster
client interaction.

In this way we can run an example and at the same time try to make nodes
failing, or start a resharding, to see how Valkey Cluster behaves under real
world conditions. It is not very helpful to see what happens while nobody
is writing to the cluster.

This section explains some basic usage of
[redis-rb-cluster](https://github.com/antirez/redis-rb-cluster) showing two
examples. 
The first is the following, and is the
[`example.rb`](https://github.com/antirez/redis-rb-cluster/blob/master/example.rb)
file inside the redis-rb-cluster distribution:

```ruby
require './cluster'

if ARGV.length != 2
    startup_nodes = [
        {:host => "127.0.0.1", :port => 7000},
        {:host => "127.0.0.1", :port => 7001}
    ]
else
    startup_nodes = [
        {:host => ARGV[0], :port => ARGV[1].to_i}
    ]
end

rc = RedisCluster.new(startup_nodes,32,:timeout => 0.1)

last = false

while not last
    begin
        last = rc.get("__last__")
        last = 0 if !last
    rescue => e
        puts "error #{e.to_s}"
        sleep 1
    end
end

((last.to_i+1)..1000000000).each{|x|
    begin
        rc.set("foo#{x}",x)
        puts rc.get("foo#{x}")
        rc.set("__last__",x)
    rescue => e
        puts "error #{e.to_s}"
    end
    sleep 0.1
}
```

The application does a very simple thing, it sets keys in the form `foo<number>` to `number`, one after the other. So if you run the program the result is the
following stream of commands:

* SET foo0 0
* SET foo1 1
* SET foo2 2
* And so forth...

The program looks more complex than it should usually as it is designed to
show errors on the screen instead of exiting with an exception, so every
operation performed with the cluster is wrapped by `begin` `rescue` blocks.

The **line 14** is the first interesting line in the program. It creates the
Valkey Cluster object, using as argument a list of *startup nodes*, the maximum
number of connections this object is allowed to take against different nodes,
and finally the timeout after a given operation is considered to be failed.

The startup nodes don't need to be all the nodes of the cluster. The important
thing is that at least one node is reachable. Also note that redis-rb-cluster
updates this list of startup nodes as soon as it is able to connect with the
first node. You should expect such a behavior with any other serious client.

Now that we have the Valkey Cluster object instance stored in the **rc** variable,
we are ready to use the object like if it was a normal Valkey object instance.

This is exactly what happens in **line 18 to 26**: when we restart the example
we don't want to start again with `foo0`, so we store the counter inside
Valkey itself. The code above is designed to read this counter, or if the
counter does not exist, to assign it the value of zero.

However note how it is a while loop, as we want to try again and again even
if the cluster is down and is returning errors. Normal applications don't need
to be so careful.

**Lines between 28 and 37** start the main loop where the keys are set or
an error is displayed.

Note the `sleep` call at the end of the loop. In your tests you can remove
the sleep if you want to write to the cluster as fast as possible (relatively
to the fact that this is a busy loop without real parallelism of course, so
you'll get the usually 10k ops/second in the best of the conditions).

Normally writes are slowed down in order for the example application to be
easier to follow by humans.

Starting the application produces the following output:

```
ruby ./example.rb
1
2
3
4
5
6
7
8
9
^C (I stopped the program here)
```

This is not a very interesting program and we'll use a better one in a moment
but we can already see what happens during a resharding when the program
is running.

#### Reshard the cluster

Now we are ready to try a cluster resharding. To do this, please
keep the example.rb program running, so that you can see if there is some
impact on the program running. Also, you may want to comment the `sleep`
call to have some more serious write load during resharding.

Resharding basically means to move hash slots from a set of nodes to another
set of nodes. 
Like cluster creation, it is accomplished using the valkey-cli utility.

To start a resharding, just type:

    valkey-cli --cluster reshard 127.0.0.1:7000

You only need to specify a single node, valkey-cli will find the other nodes
automatically.

Currently valkey-cli is only able to reshard with the administrator support,
you can't just say move 5% of slots from this node to the other one (but
this is pretty trivial to implement). So it starts with questions. The first
is how much of a resharding do you want to do:

    How many slots do you want to move (from 1 to 16384)?

We can try to reshard 1000 hash slots, that should already contain a non
trivial amount of keys if the example is still running without the sleep
call.

Then valkey-cli needs to know what is the target of the resharding, that is,
the node that will receive the hash slots.
I'll use the first primary node, that is, 127.0.0.1:7000, but I need
to specify the Node ID of the instance. This was already printed in a
list by valkey-cli, but I can always find the ID of a node with the following
command if I need:

```
$ valkey-cli -p 7000 cluster nodes | grep myself
97a3a64667477371c4479320d683e4c8db5858b1 :0 myself,master - 0 0 0 connected 0-5460
```

Ok so my target node is 97a3a64667477371c4479320d683e4c8db5858b1.

Now you'll get asked from what nodes you want to take those keys.
I'll just type `all` in order to take a bit of hash slots from all the
other primary nodes.

After the final confirmation you'll see a message for every slot that
valkey-cli is going to move from a node to another, and a dot will be printed
for every actual key moved from one side to the other.

While the resharding is in progress you should be able to see your
example program running unaffected. You can stop and restart it multiple times
during the resharding if you want.

At the end of the resharding, you can test the health of the cluster with
the following command:

    valkey-cli --cluster check 127.0.0.1:7000

All the slots will be covered as usual, but this time the primary at
127.0.0.1:7000 will have more hash slots, something around 6461.

Resharding can be performed automatically without the need to manually
enter the parameters in an interactive way. This is possible using a command
line like the following:

    valkey-cli --cluster reshard <host>:<port> --cluster-from <node-id> --cluster-to <node-id> --cluster-slots <number of slots> --cluster-yes

This allows to build some automatism if you are likely to reshard often,
however currently there is no way for `valkey-cli` to automatically
rebalance the cluster checking the distribution of keys across the cluster
nodes and intelligently moving slots as needed. This feature will be added
in the future.

The `--cluster-yes` option instructs the cluster manager to automatically answer
"yes" to the command's prompts, allowing it to run in a non-interactive mode.
Note that this option can also be activated by setting the
`REDISCLI_CLUSTER_YES` environment variable.

#### A more interesting example application

The example application we wrote early is not very good.
It writes to the cluster in a simple way without even checking if what was
written is the right thing.

From our point of view the cluster receiving the writes could just always
write the key `foo` to `42` to every operation, and we would not notice at
all.

So in the `redis-rb-cluster` repository, there is a more interesting application
that is called `consistency-test.rb`. It uses a set of counters, by default 1000, and sends `INCR` commands in order to increment the counters.

However instead of just writing, the application does two additional things:

* When a counter is updated using `INCR`, the application remembers the write.
* It also reads a random counter before every write, and check if the value is what we expected it to be, comparing it with the value it has in memory.

What this means is that this application is a simple **consistency checker**,
and is able to tell you if the cluster lost some write, or if it accepted
a write that we did not receive acknowledgment for. In the first case we'll
see a counter having a value that is smaller than the one we remember, while
in the second case the value will be greater.

Running the consistency-test application produces a line of output every
second:

```
$ ruby consistency-test.rb
925 R (0 err) | 925 W (0 err) |
5030 R (0 err) | 5030 W (0 err) |
9261 R (0 err) | 9261 W (0 err) |
13517 R (0 err) | 13517 W (0 err) |
17780 R (0 err) | 17780 W (0 err) |
22025 R (0 err) | 22025 W (0 err) |
25818 R (0 err) | 25818 W (0 err) |
```

The line shows the number of **R**eads and **W**rites performed, and the
number of errors (query not accepted because of errors since the system was
not available).

If some inconsistency is found, new lines are added to the output.
This is what happens, for example, if I reset a counter manually while
the program is running:

```
$ valkey-cli -h 127.0.0.1 -p 7000 set key_217 0
OK

(in the other tab I see...)

94774 R (0 err) | 94774 W (0 err) |
98821 R (0 err) | 98821 W (0 err) |
102886 R (0 err) | 102886 W (0 err) | 114 lost |
107046 R (0 err) | 107046 W (0 err) | 114 lost |
```

When I set the counter to 0 the real value was 114, so the program reports
114 lost writes (`INCR` commands that are not remembered by the cluster).

This program is much more interesting as a test case, so we'll use it
to test the Valkey Cluster failover.

#### Test the failover

To trigger the failover, the simplest thing we can do (that is also
the semantically simplest failure that can occur in a distributed system)
is to crash a single process, in our case a single primary.

**Note:**
During this test, you should take a tab open with the consistency test
application running.

We can identify a primary and crash it with the following command:

```
$ valkey-cli -p 7000 cluster nodes | grep master
3e3a6cb0d9a9a87168e266b0a0b24026c0aae3f0 127.0.0.1:7001 master - 0 1385482984082 0 connected 5960-10921
2938205e12de373867bf38f1ca29d31d0ddb3e46 127.0.0.1:7002 master - 0 1385482983582 0 connected 11423-16383
97a3a64667477371c4479320d683e4c8db5858b1 :0 myself,master - 0 0 0 connected 0-5959 10922-11422
```

Ok, so 7000, 7001, and 7002 are primaries. Let's crash node 7002 with the
**DEBUG SEGFAULT** command:

```
$ valkey-cli -p 7002 debug segfault
Error: Server closed the connection
```

Now we can look at the output of the consistency test to see what it reported.

```
18849 R (0 err) | 18849 W (0 err) |
23151 R (0 err) | 23151 W (0 err) |
27302 R (0 err) | 27302 W (0 err) |

... many error warnings here ...

29659 R (578 err) | 29660 W (577 err) |
33749 R (578 err) | 33750 W (577 err) |
37918 R (578 err) | 37919 W (577 err) |
42077 R (578 err) | 42078 W (577 err) |
```

As you can see during the failover the system was not able to accept 578 reads and 577 writes, however no inconsistency was created in the database. This may
sound unexpected as in the first part of this tutorial we stated that Valkey
Cluster can lose writes during the failover because it uses asynchronous
replication. What we did not say is that this is not very likely to happen
because Valkey sends the reply to the client, and the commands to replicate
to the replicas, about at the same time, so there is a very small window to
lose data. However the fact that it is hard to trigger does not mean that it
is impossible, so this does not change the consistency guarantees provided
by Valkey cluster.

We can now check what is the cluster setup after the failover (note that
in the meantime I restarted the crashed instance so that it rejoins the
cluster as a replica):

```
$ valkey-cli -p 7000 cluster nodes
3fc783611028b1707fd65345e763befb36454d73 127.0.0.1:7004 slave 3e3a6cb0d9a9a87168e266b0a0b24026c0aae3f0 0 1385503418521 0 connected
a211e242fc6b22a9427fed61285e85892fa04e08 127.0.0.1:7003 slave 97a3a64667477371c4479320d683e4c8db5858b1 0 1385503419023 0 connected
97a3a64667477371c4479320d683e4c8db5858b1 :0 myself,master - 0 0 0 connected 0-5959 10922-11422
3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 127.0.0.1:7005 master - 0 1385503419023 3 connected 11423-16383
3e3a6cb0d9a9a87168e266b0a0b24026c0aae3f0 127.0.0.1:7001 master - 0 1385503417005 0 connected 5960-10921
2938205e12de373867bf38f1ca29d31d0ddb3e46 127.0.0.1:7002 slave 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 0 1385503418016 3 connected
```

Now the primaries are running on ports 7000, 7001 and 7005. What was previously
a primary, that is the Valkey instance running on port 7002, is now a replica of
7005.

The output of the `CLUSTER NODES` command may look intimidating, but it is actually pretty simple, and is composed of the following tokens:

* Node ID
* ip:port
* flags: master, replica, myself, fail, ...
* if it is a replica, the Node ID of the master
* Time of the last pending PING still waiting for a reply.
* Time of the last PONG received.
* Configuration epoch for this node (see the Cluster specification).
* Status of the link to this node.
* Slots served...

#### Manual failover

Sometimes it is useful to force a failover without actually causing any problem
on a primary. For example, to upgrade the Valkey process of one of the
primary nodes it is a good idea to failover it to turn it into a replica
with minimal impact on availability.

Manual failovers are supported by Valkey Cluster using the `CLUSTER FAILOVER`
command, that must be executed in one of the replicas of the primary you want
to failover.

Manual failovers are special and are safer compared to failovers resulting from
actual primary failures. They occur in a way that avoids data loss in the
process, by switching clients from the original primary to the new primary only
when the system is sure that the new primary processed all the replication stream
from the old one.

This is what you see in the replica log when you perform a manual failover:

    # Manual failover user request accepted.
    # Received replication offset for paused primary manual failover: 347540
    # All primary replication stream processed, manual failover can start.
    # Start of election delayed for 0 milliseconds (rank #0, offset 347540).
    # Starting a failover election for epoch 7545.
    # Failover election won: I'm the new primary.

Clients sending write commands to the primary are blocked during the failover.
When the primary sends its replication offset to the replica, the replica
waits to reach the offset on its side. When the replication offset is reached,
the failover starts, and the old primary is informed about the configuration
switch. When the switch is complete, the clients are unblocked on the old
primary and they are redirected to the new primary.

**Note:**
To promote a replica to primary, it must first be known as a replica by a majority of the primaries in the cluster.
  Otherwise, it cannot win the failover election.
  If the replica has just been added to the cluster (see [Add a new node as a replica](#add-a-new-node-as-a-replica)), you may need to wait a while before sending the `CLUSTER FAILOVER` command, to make sure the primaries in cluster are aware of the new replica.

#### Add a new node

Adding a new node is basically the process of adding an empty node and then
moving some data into it, in case it is a new primary, or telling it to
setup as a replica of a known node, in case it is a replica.

We'll show both, starting with the addition of a new primary instance.

In both cases the first step to perform is **adding an empty node**.

This is as simple as to start a new node in port 7006 (we already used
from 7000 to 7005 for our existing 6 nodes) with the same configuration
used for the other nodes, except for the port number, so what you should
do in order to conform with the setup we used for the previous nodes:

* Create a new tab in your terminal application.
* Enter the `cluster-test` directory.
* Create a directory named `7006`.
* Create a valkey.conf file inside, similar to the one used for the other nodes but using 7006 as port number.
* Finally start the server with `../valkey-server ./valkey.conf`

At this point the server should be running.

Now we can use **valkey-cli** as usual in order to add the node to
the existing cluster.

    valkey-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000

As you can see I used the **add-node** command specifying the address of the
new node as first argument, and the address of a random existing node in the
cluster as second argument.

In practical terms valkey-cli here did very little to help us, it just
sent a `CLUSTER MEET` message to the node, something that is also possible
to accomplish manually. However valkey-cli also checks the state of the
cluster before to operate, so it is a good idea to perform cluster operations
always via valkey-cli even when you know how the internals work.

Now we can connect to the new node to see if it really joined the cluster:

```
valkey 127.0.0.1:7006> cluster nodes
3e3a6cb0d9a9a87168e266b0a0b24026c0aae3f0 127.0.0.1:7001 master - 0 1385543178575 0 connected 5960-10921
3fc783611028b1707fd65345e763befb36454d73 127.0.0.1:7004 slave 3e3a6cb0d9a9a87168e266b0a0b24026c0aae3f0 0 1385543179583 0 connected
f093c80dde814da99c5cf72a7dd01590792b783b :0 myself,master - 0 0 0 connected
2938205e12de373867bf38f1ca29d31d0ddb3e46 127.0.0.1:7002 slave 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 0 1385543178072 3 connected
a211e242fc6b22a9427fed61285e85892fa04e08 127.0.0.1:7003 slave 97a3a64667477371c4479320d683e4c8db5858b1 0 1385543178575 0 connected
97a3a64667477371c4479320d683e4c8db5858b1 127.0.0.1:7000 master - 0 1385543179080 0 connected 0-5959 10922-11422
3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 127.0.0.1:7005 master - 0 1385543177568 3 connected 11423-16383
```

Note that since this node is already connected to the cluster it is already
able to redirect client queries correctly and is generally speaking part of
the cluster. However it has two peculiarities compared to the other primaries:

* It holds no data as it has no assigned hash slots.
* Because it is a primary without assigned slots, it does not participate in the election process when a replica wants to become a primary.

Now it is possible to assign hash slots to this node using the resharding
feature of `valkey-cli`. 
It is basically useless to show this as we already
did in a previous section, there is no difference, it is just a resharding
having as a target the empty node.

##### Add a new node as a replica

Adding a new replica can be performed in two ways. The obvious one is to
use valkey-cli again, but with the --cluster-replica option, like this:

    valkey-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000 --cluster-replica

Note that the command line here is exactly like the one we used to add
a new primary, so we are not specifying to which primary we want to add
the replica. In this case, what happens is that valkey-cli will add the new
node as replica of a random primary among the primaries with fewer replicas.

However you can specify exactly what primary you want to target with your
new replica with the following command line:

    valkey-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000 --cluster-replica --cluster-master-id 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e

This way we assign the new replica to a specific primary.

A more manual way to add a replica to a specific primary is to add the new
node as an empty primary, and then turn it into a replica using the
`CLUSTER REPLICATE` command. This also works if the node was added as a replica
but you want to move it as a replica of a different primary.

For example in order to add a replica for the node 127.0.0.1:7005 that is
currently serving hash slots in the range 11423-16383, that has a Node ID
3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e, all I need to do is to connect
with the new node (already added as empty primary) and send the command:

    valkey 127.0.0.1:7006> cluster replicate 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e

That's it. Now we have a new replica for this set of hash slots, and all
the other nodes in the cluster already know (after a few seconds needed to
update their config). We can verify with the following command:

```
$ valkey-cli -p 7000 cluster nodes | grep slave | grep 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e
f093c80dde814da99c5cf72a7dd01590792b783b 127.0.0.1:7006 replica 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 0 1385543617702 3 connected
2938205e12de373867bf38f1ca29d31d0ddb3e46 127.0.0.1:7002 replica 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e 0 1385543617198 3 connected
```

The node 3c3a0c... now has two replicas, running on ports 7002 (the existing one) and 7006 (the new one).

#### Remove a node

To remove a replica node just use the `del-node` command of valkey-cli:

    valkey-cli --cluster del-node 127.0.0.1:7000 `<node-id>`

The first argument is just a random node in the cluster, the second argument
is the ID of the node you want to remove.

You can remove a primary node in the same way as well, **however in order to
remove a primary node it must be empty**. If the primary is not empty you need
to reshard data away from it to all the other primary nodes before.

An alternative to remove a primary node is to perform a manual failover of it
over one of its replicas and remove the node after it turned into a replica of the
new primary. Obviously this does not help when you want to reduce the actual
number of primaries in your cluster, in that case, a resharding is needed.

There is a special scenario where you want to remove a failed node.
You should not use the `del-node` command because it tries to connect to all nodes and you will encounter a "connection refused" error.
Instead, you can use the `call` command:

    valkey-cli --cluster call 127.0.0.1:7000 cluster forget `<node-id>`

This command will execute `CLUSTER FORGET` command on every node. 

#### Replica migration

In Valkey Cluster, you can reconfigure a replica to replicate with a
different primary at any time just using this command:

    CLUSTER REPLICATE <master-node-id>

However there is a special scenario where you want replicas to move from one
primary to another one automatically, without the help of the system administrator.
The automatic reconfiguration of replicas is called *replicas migration* and is
able to improve the reliability of a Valkey Cluster.

**Note:**
You can read the details of replicas migration in the [Valkey Cluster Specification](cluster-spec.md), here we'll only provide some information about the
general idea and what you should do in order to benefit from it.

The reason why you may want to let your cluster replicas to move from one primary
to another under certain condition, is that usually the Valkey Cluster is as
resistant to failures as the number of replicas attached to a given primary.

For example a cluster where every primary has a single replica can't continue
operations if the primary and its replica fail at the same time, simply because
there is no other instance to have a copy of the hash slots the primary was
serving. However while net-splits are likely to isolate a number of nodes
at the same time, many other kind of failures, like hardware or software failures
local to a single node, are a very notable class of failures that are unlikely
to happen at the same time, so it is possible that in your cluster where
every primary has a replica, the replica is killed at 4am, and the primary is killed
at 6am. This still will result in a cluster that can no longer operate.

To improve reliability of the system we have the option to add additional
replicas to every primary, but this is expensive. Replica migration allows to
add more replicas to just a few primaries. So you have 10 primaries with 1 replica
each, for a total of 20 instances. However you add, for example, 3 instances
more as replicas of some of your primaries, so certain primaries will have more
than a single replica.

With replicas migration what happens is that if a primary is left without
replicas, a replica from a primary that has multiple replicas will migrate to
the *orphaned* primary. So after your replica goes down at 4am as in the example
we made above, another replica will take its place, and when the primary
will fail as well at 5am, there is still a replica that can be elected so that
the cluster can continue to operate.

So what you should know about replicas migration in short?

* The cluster will try to migrate a replica from the primary that has the greatest number of replicas in a given moment.
* To benefit from replica migration you have just to add a few more replicas to a single primary in your cluster, it does not matter what primary.
* There is a configuration parameter that controls the replica migration feature that is called `cluster-migration-barrier`: you can read more about it in the example `valkey.conf` file provided with Valkey Cluster.

#### Upgrade nodes in a Valkey Cluster

Upgrading replica nodes is easy since you just need to stop the node and restart
it with an updated version of Valkey. If there are clients scaling reads using
replica nodes, they should be able to reconnect to a different replica if a given
one is not available.

Upgrading primaries is a bit more complex. The suggested procedure is to trigger
a manual failover to turn the old primary into a replica and then upgrading it.

A complete rolling upgrade of all nodes in a cluster can be performed by
repeating the following procedure for each shard (a primary and its replicas):

1. Add one or more upgraded nodes as new replicas to the primary. This step is
   optional but it ensures that the number of replicas is not compromised during
   the rolling upgrade. To add a new node, use [`CLUSTER
   MEET`](../commands/cluster-meet.md) and [`CLUSTER
   REPLICATE`](../commands/cluster-replicate.md) or use `valkey-cli` as
   described under [Add a new node as a replica](#add-a-new-node-as-a-replica).

   An alternative is to upgrade one replica at a time and have fewer replicas
   online during the upgrade.

2. Upgrade the old replicas you want to keep by restarting them with the updated
   version of Valkey. If you're replacing all the old nodes with new nodes, you
   can skip this step.

3. Select one of the upgraded replicas to be the new primary. Wait until this
   replica has caught up the replication offset with the primary. You can use
   [`INFO REPLICATION`](../commands/info.md) and check for the line
   `master_link_status:up` to be present. This indicates that the initial sync
   with the primary is complete.

   After the initial full sync, the replica might still lag behind in
   replication. Send `INFO REPLICATION` to the primary and the replica and
   compare the field `master_repl_offset` returned by both nodes. If the offsets
   match, it means that all writes have been replicated. However, if the primary
   receives a constant stream of writes, it's possible that the offsets will
   never be equal. In this step, you can accept a small difference. It's usually
   enough to wait for some seconds to minimize the difference.

4. Check that the new replica is known by all nodes in the cluster, or at least
   by the primaries in the cluster. You can send [`CLUSTER
   NODES`](../commands/cluster-nodes.md) to each of the nodes in the cluster and
   check that they all are aware of the new node. Wait for some time and repeat
   the check if necessary.

5. Trigger a manual failover by sending [`CLUSTER
   FAILOVER`](../commands/cluster-failover.md) to the replica node selected to
   become the new primary. See the [Manual failover](#manual-failover) section
   in this document for more information.

6. Wait for the failover to complete. To check, you can use
   [`ROLE`](../commands/role.md), [`INFO REPLICATION`](../commands/info.md)
   (which indicates `role:master` after successful failover) or [`CLUSTER
   NODES`](../commands/cluster-nodes.md) to verify that the state of the cluster
   has changed shortly after the command was sent.

7. Take the old primary (now a replica) out of service, or upgrade it and add it
   again as a replica. Remove additional replicas kept for redundancy during the
   upgrade, if any.

Repeat this sequence for each shard (each primary and its replicas) until all
nodes in the cluster have been upgraded.

#### Migrate to Valkey Cluster

Users willing to migrate to Valkey Cluster may have just a single primary, or
may already using a preexisting sharding setup, where keys
are split among N nodes, using some in-house algorithm or a sharding algorithm
implemented by their client library or Valkey proxy.

In both cases it is possible to migrate to Valkey Cluster easily, however
what is the most important detail is if multiple-keys operations are used
by the application, and how. There are three different cases:

1. Multiple keys operations, or transactions, or Lua scripts involving multiple keys, are not used. Keys are accessed independently (even if accessed via transactions or Lua scripts grouping multiple commands, about the same key, together).
2. Multiple keys operations, or transactions, or Lua scripts involving multiple keys are used but only with keys having the same **hash tag**, which means that the keys used together all have a `{...}` sub-string that happens to be identical. For example the following multiple keys operation is defined in the context of the same hash tag: `SUNION {user:1000}.foo {user:1000}.bar`.
3. Multiple keys operations, or transactions, or Lua scripts involving multiple keys are used with key names not having an explicit, or the same, hash tag.

The third case is not handled by Valkey Cluster: the application requires to
be modified in order to not use multi keys operations or only use them in
the context of the same hash tag.

Case 1 and 2 are covered, so we'll focus on those two cases, that are handled
in the same way, so no distinction will be made in the documentation.

Assuming you have your preexisting data set split into N primaries, where
N=1 if you have no preexisting sharding, the following steps are needed
in order to migrate your data set to Valkey Cluster:

1. Stop your clients. No automatic live-migration to Valkey Cluster is currently possible. You may be able to do it orchestrating a live migration in the context of your application / environment.
2. Generate an append only file for all of your N primaries using the `BGREWRITEAOF` command, and waiting for the AOF file to be completely generated.
3. Save your AOF files from aof-1 to aof-N somewhere. At this point you can stop your old instances if you wish (this is useful since in non-virtualized deployments you often need to reuse the same computers).
4. Create a Valkey Cluster composed of N primaries and zero replicas. You'll add replicas later. Make sure all your nodes are using the append only file for persistence.
5. Stop all the cluster nodes, substitute their append only file with your pre-existing append only files, aof-1 for the first node, aof-2 for the second node, up to aof-N.
6. Restart your Valkey Cluster nodes with the new AOF files. They'll complain that there are keys that should not be there according to their configuration.
7. Use `valkey-cli --cluster fix` command in order to fix the cluster so that keys will be migrated according to the hash slots each node is authoritative or not.
8. Use `valkey-cli --cluster check` at the end to make sure your cluster is ok.
9. Restart your clients modified to use a Valkey Cluster aware client library.

There is an alternative way to import data from external instances to a Valkey
Cluster, which is to use the `valkey-cli --cluster import` command.

The command moves all the keys of a running instance (deleting the keys from
the source instance) to the specified pre-existing Valkey Cluster. 

**Note:**
If not for backward compatibility, the Valkey project no longer uses the words "master" and "slave". Unfortunately in this command these words are part of the protocol, so we'll be able to remove such occurrences only when this API will be naturally deprecated.

## Learn more

* [Valkey Cluster specification](cluster-spec.md)
* [Docker documentation](https://docs.docker.com/engine/userguide/networking/dockernetworks/)

