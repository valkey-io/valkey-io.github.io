+++
title = "Recovery headroom under sustained writes in Valkey"
date = 2026-10-31
description = "A cluster can serve writes while losing the capacity needed to recover. Use replication, migration, memory, and failover checks to find that limit."
authors = ["Aditi566", "shuvajyotikar13"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
+++

# Recovery Headroom Under Sustained Writes: What Replication, Resharding, and Failover Reveal in Valkey

## An incident-style investigation of when a healthy cluster becomes harder to recover

At 2:03 AM, a CDC pipeline was sustaining its expected write rate. Application p99 remained inside its normal band, and no node was unavailable. Yet the primary replication offset was advancing faster than the replica's acknowledged offset.

The incident was not an outage. It was the loss of the margin needed to survive the next interruption.

Peak-throughput tests ask how fast a cluster can run while healthy. The more useful production question is:

> **How much workload can a Valkey cluster sustain while it is serving, replicating, migrating, and recovering?**

We call the difference between those limits **recovery headroom**. To study it, we built the open-source [Valkey Resilience Lab](https://github.com/shuvajyotikar13/valkey-resilience-lab): hold offered load steady, inject one operational event, verify which mechanism actually occurred, and measure when application behavior and redundancy become stable again.

## Incident frame: a green dashboard and a shrinking escape route

The development topology used Valkey 9.1.2 with three primaries and one replica per primary. It preloaded 250,000 keys and applied a bounded mix of 95% updates and 5% deletes. An open-loop generator offered 150,000 logical operations per second, below the observed queueing knee, so a fault would not merely expose pre-existing saturation. Each node had a 768 MiB container limit, 512 MiB `maxmemory`, and a 64 MiB replication backlog unless the experiment overrode it.

Every run retained the resolved configuration, environment, client workload, per-node metrics, per-link replication evidence, topology snapshots, and event timeline. The figures below are single development traces (`n=1`), not universal Valkey performance claims.

That evidence distinction matters: requesting a partial resynchronization, migration, or failover does not prove that Valkey followed the intended path. Counters, ownership, roles, and postconditions establish what actually happened.

## Finding 1: replication debt consumes the cheap-recovery window

[Valkey replication](https://valkey.io/topics/replication/) is asynchronous. A primary advances its replication offset as it produces the command stream; a replica acknowledges how far it has processed. For one replication history:

`offset gap = primary offset - replica processed offset`

The offset alone is insufficient because Valkey identifies history by replication ID and offset. After an interruption, `PSYNC` can use partial synchronization only if the primary still recognizes that history and retains the missing bytes. Otherwise, recovery becomes a full synchronization: create or stream a snapshot, buffer concurrent mutations, and send the remaining stream before the replica catches up.

Two estimates turn backlog size into an operational deadline:

`backlog coverage time ~= retained history / replication-stream bytes per second`

`remaining partial-sync margin ~= (retained history - offset gap) / replication-stream bytes per second`

The lab drove both paths. A run counted as partial only when `sync_partial_ok` increased without `sync_full`; a full-sync run required `sync_full` to increase, with `sync_partial_err` retained as supporting evidence. This prevents a scenario label from becoming the conclusion.

It also explains why adding replicas is not free resilience. An empty replica first forces snapshot, network, and buffering work onto the primary. Replica creation should therefore be admitted like any other operational workload, while sufficient recovery headroom still exists.

## Finding 2: resharding competes with foreground traffic

Both resharding mechanisms move slot ownership while writes continue, but they create different work. The legacy path repeatedly marks slots importing or migrating and issues `MIGRATE` batches. [Atomic slot migration](https://valkey.io/topics/atomic-slot-migration/) uses a snapshot, streams concurrent mutations, then briefly pauses affected writes while ownership moves.

Matched development runs moved 1,024 slots at 150,000 offered operations per second. During the atomic run, foreground throughput stayed near the offered rate and peak sampled tail latency was about 110 ms. During the legacy run, throughput briefly fell toward 110,000 operations per second and tail latency reached about 830 ms before queued work drained.

This single trace supports only a contained conclusion: atomic migration caused a shorter disturbance in this environment. A valid migration result must also prove that exactly the requested slots changed owner, no slot remains importing or migrating, all nodes agree on ownership, and the atomic job reports completion. A zero CLI exit status is not that proof.

## Finding 3: promotion is only the middle of failover

[Cluster failover](https://valkey.io/topics/cluster-spec/) is a timeline, not one timestamp:

- **T0:** the primary stops.
- **Td:** peers declare it failed.
- **T1:** the expected replica becomes primary and owns slots.
- **T2:** application rate, errors, and latency remain inside the recovery band.
- **T3:** redundancy and replication links are restored.

In the no-retry trace, useful throughput remained near zero for roughly five seconds and sampled tail latency rose into seconds. Throughput then overshot as queued and newly admitted work converged on the recovered shard. Application behavior stabilized before the old primary had rejoined as a replica. Measuring only T1 would have declared recovery too early.

Retries create a second workload. One logical operation can produce several physical attempts, TCP dials, and topology refreshes. We compared no retries, five immediate attempts, and five attempts using full jitter with a 10 ms base and 250 ms cap.

The single-client traces did not establish a defensible jitter advantage. All workers shared one client's pools, so the test did not reproduce independent processes waking together. That negative result narrows the next experiment: preserve the same deadlines and attempt budget, but use multiple load-generator processes or hosts and report repeated-trial ranges.

## Contributing pressure: memory is not one budget

`used_memory < maxmemory` does not prove that recovery work will fit. Dataset memory, allocator overhead, RSS, client and replication buffers, and fork copy-on-write describe different scopes.

During [`BGSAVE`](https://valkey.io/topics/persistence/), throughput remained near 150,000 operations per second while the terminal RDB COW value reached approximately 20 MiB. The run did not cause an out-of-memory event; it demonstrated that physical recovery cost rose while logical dataset memory stayed stable.

A practical admission rule is:

`physical headroom > repeated COW + buffer growth + allocator variation + safety margin`

## Practical takeaways: preserve room to recover

Use these checks to turn recovery headroom into everyday operating decisions:

1. **Set capacity from recovery tests.** Find the load at which the cluster can still recover from a replica interruption, migration, or failover within your application’s latency and error budgets. Keep normal traffic below that tested limit, and track offered, admitted, completed, failed, and dropped work separately.
2. **Monitor the partial-sync window.** Track each replica’s offset gap within its replication history, whether that gap is growing or closing, and the backlog’s remaining coverage in seconds. Size the backlog for credible interruptions and catch-up time, with a workload-specific margin. Investigate shrinking coverage before a disconnect forces full synchronization.
3. **Gate migration and replica creation on available resources.** Check the busiest source-target pair, replication debt, and physical memory before starting. Establish pause or abort thresholds for latency, errors, and growing offset gaps. Verify final slot ownership and replica health before declaring the operation complete.
4. **Budget physical memory beyond `maxmemory`.** Measure RSS, buffers, allocator overhead, and COW during sustained writes and synchronization. Reserve room for repeated recovery work; a stable dataset size does not establish that the next snapshot or full sync will fit.
5. **Measure failover through restored redundancy.** Record failure detection, promotion, application stabilization, and replica restoration separately. Close the incident only when application behavior, topology, replication links, and offset gaps remain stable over a defined observation window.
6. **Treat retries as additional load.** Bound attempts by an end-to-end deadline, and measure physical attempts, connection dials, and topology refreshes alongside logical operations. Test retry policies with multiple independent clients before assuming jitter will control a fleet-wide reconnect surge.

Start with one representative write workload and one injected event. Retain the configuration, timeline, metrics, and postconditions, then repeat the experiment to establish ranges you can use as operating thresholds. The development traces here identify mechanisms to test; your own repeated measurements should determine the limits you enforce.
