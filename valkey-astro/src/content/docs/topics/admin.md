---
title: Administration
description: Advice for configuring and managing Valkey in production
---

## Valkey setup tips

### Linux

* Deploy Valkey using the Linux operating system.
  Valkey is also regularly tested on macOS and FreeBSD, and from time to time on other OpenBSD, NetBSD, DragonFlyBSD and Solaris-derived systems.
  However, Linux is where most of the stress testing is performed, and where most production deployments are run.

* Set the Linux kernel overcommit memory setting to 1. Add `vm.overcommit_memory = 1` to `/etc/sysctl.conf`. Then, reboot or run the command `sysctl vm.overcommit_memory=1` to activate the setting. See [FAQ: Background saving fails with a fork() error on Linux?](faq.md#background-saving-fails-with-a-fork-error-on-linux) for details. 

* To ensure the Linux kernel feature Transparent Huge Pages does not impact Valkey memory usage and latency, run the command: `echo never > /sys/kernel/mm/transparent_hugepage/enabled` to disable it. See [Latency Diagnosis - Latency induced by transparent huge pages](latency.md#latency-induced-by-transparent-huge-pages) for additional context. 

### Memory

* Ensured that swap is enabled and that your swap file size is equal to amount of memory on your system. If Linux does not have swap set up, and your Valkey instance accidentally consumes too much memory, Valkey can crash when it is out of memory, or the Linux kernel OOM killer can kill the Valkey process. When swapping is enabled, you can detect latency spikes and act on them.

* Set an explicit `maxmemory` option limit in your instance to make sure that it will report errors instead of failing when the system memory limit is near to be reached. Note that `maxmemory` should be set by calculating the overhead for Valkey, other than data, and the fragmentation overhead. So if you think you have 10 GB of free memory, set it to 8 or 9.

* If you are using Valkey in a write-heavy application, while saving an RDB file on disk or rewriting the AOF log, Valkey can use up to 2 times the memory normally used. The additional memory used is proportional to the number of memory pages modified by writes during the saving process, so it is often proportional to the number of keys (or aggregate types items) touched during this time. Make sure to size your memory accordingly.

* See the `LATENCY DOCTOR` and `MEMORY DOCTOR` commands to assist in troubleshooting.

### Imaging

* When running under daemontools, use `daemonize no`.

### Replication

* Set up a non-trivial replication backlog in proportion to the amount of memory Valkey is using. The backlog allows replicas to sync with the primary instance much more easily.

* If you use replication, Valkey performs RDB saves even if persistence is disabled. (This does not apply to diskless replication.) If you don't have disk usage on the primary, enable diskless replication.

* If you are using replication, ensure that either your primary has persistence enabled, or that it does not automatically restart on crashes. Replicas will try to maintain an exact copy of the primary, so if a primary restarts with an empty data set, replicas will be wiped as well.

### Security

* By default, Valkey does not require any authentication and listens to all the network interfaces. This is a big security issue if you leave Valkey exposed on the internet or other places where attackers can reach it. Please check our [security page](security.md) and the [quick start](quickstart.md) for information about how to secure Valkey.

## Running Valkey on EC2

* Use HVM based instances, not PV based instances.
* The use of Valkey persistence with EC2 EBS volumes needs to be handled with care because sometimes EBS volumes have high latency characteristics.
* You may want to try diskless replication if you have issues when replicas are synchronizing with the primary.

## Upgrading or restarting a Valkey instance without downtime

Valkey is designed to be a long-running process in your server. You can modify many configuration options without a restart using the `CONFIG SET` command. You can also switch from AOF to RDB snapshots persistence, or the other way around, without restarting Valkey. Check the output of the `CONFIG GET *` command for more information.

From time to time, a restart is required, for example, to upgrade the Valkey process to a newer version, or when you need to modify a configuration parameter that is currently not supported by the `CONFIG` command.

Follow these steps to avoid downtime.

* Set up your new Valkey instance as a replica for your current Valkey instance. In order to do so, you need a different server, or a server that has enough RAM to keep two instances of Valkey running at the same time.

* If you use a single server, ensure that the replica is started on a different port than the primary instance, otherwise the replica cannot start.

* Wait for the replication initial synchronization to complete. Check the replica's log file.

* Using `INFO`, ensure the primary and replica have the same number of keys. Use `valkey-cli` to check that the replica is working as expected and is replying to your commands.

* Allow writes to the replica using `CONFIG SET replica-read-only no`.

* Configure all your clients to use the new instance (the replica). Note that you may want to use the `CLIENT PAUSE` command to ensure that no client can write to the old primary during the switch.

* Once you confirm that the primary is no longer receiving any queries (you can check this using the `MONITOR` command), elect the replica to primary using the `REPLICAOF NO ONE` command, and then shut down your primary.

If you are using [Valkey Sentinel](sentinel.md) or [Valkey Cluster](cluster-tutorial.md), the simplest way to upgrade to newer versions is to upgrade one replica after the other. Then you can perform a manual failover to promote one of the upgraded replicas to primary, and finally promote the last replica.
