+++
title = "When Stateless Compute Meets Stateful AI: Engineering Valkey for Serverless Agent Systems"
date = 2026-11-02 01:01:01
description = "Using Valkey Functions to fence stale workers and test checkpoint recovery."
authors = ["aditigupta", "shuvajyotikar"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = false
+++

*Testing stale-worker fencing and recovery in Valkey-backed agent workflows.*

Worker A starts an agent task, records checkpoint version 12, and calls an external tool. Its lease then expires. A coordinator transfers ownership to worker B, which advances the task. Minutes later, A resumes with version 12 still in memory and tries to publish its result.

Serverless workers may pause or outlive requests, then resume after ownership has moved.

That write can reach Valkey even though A no longer owns the task. Command success is therefore the wrong correctness test. The real question is whether the write is still a valid workflow transition—and whether an accepted transition survives the recovery contract the application claims to provide.

> **This investigation contributes a testable checkpoint-transition contract for Valkey-backed workflows, an atomic ownership-and-version protocol, and a reproducible method for verifying stale-worker rejection and recovery of acknowledged progress.**

Valkey's [agent-memory guidance](https://valkey.io/blog/modern-ai-workloads-mapping-to-valkey/) covers the broader landscape. This post tests a narrower question: how do we prove a distributed worker's update is still authoritative?

## Define one valid transition

A valid transition advances the expected checkpoint **version** under the current **epoch**.

An epoch is a fencing token: a monotonically increasing number distinguishing current from older owners. It changes on ownership transfer; the version changes on checkpoint commit. Version alone cannot reject a former owner; epoch alone cannot prevent competing current-owner updates.

| **Requirement** | **What it prevents** |
| --- | --- |
| Caller supplies the current epoch | A former owner publishing late work |
| Caller supplies the expected version | A competing worker overwriting newer progress |
| Version advances once per transition ID | Duplicate checkpoint publication |
| Payload reference and digest resolve | Metadata naming missing or changed state |
| Declared acknowledgment policy succeeds | Calling weaker evidence “recoverable” |
| External effect is idempotent or reconcilable | Duplicate real-world actions |

Fencing rejects old owners; idempotency prevents duplicate version advances; durability follows the declared replication or persistence policy. External effects remain outside this boundary.

1. A owns epoch 42 and version 12.
2. An authoritative coordinator decides takeover is allowed.
3. A conditional Valkey Function installs B at epoch 43; version remains 12.
4. B publishes version 13 using epoch 43.
5. A returns with epoch 42 and receives `STALE_EPOCH`.
6. Another epoch-43 write expecting version 12 receives `VERSION_CONFLICT`.

The coordinator owns lease policy; the Function conditionally applies its decision against the expected owner and epoch.

## Make ownership and checkpointing separate atomic operations

The metadata hash stores `owner`, `epoch`, `version`, `transition_id`, and `checkpoint_ref`. Two [Valkey Functions](https://valkey.io/topics/functions-intro/) implement the protocol. Each runs atomically on its key's server, preventing read-check-write interleaving—not creating a cross-system transaction.

~~~lua
#!lua name=agent_checkpoint_v1

local function takeover(keys, args)
    local key = keys[1]
    local owner = server.call('HGET', key, 'owner')
    local epoch = tonumber(server.call('HGET', key, 'epoch') or '-1')

    if owner == false then
        return server.error_reply('STATE_NOT_FOUND')
    end
    if owner ~= args[1] or epoch ~= tonumber(args[2]) then
        return server.error_reply('TAKEOVER_CONFLICT')
    end

    local next_epoch = epoch + 1
    server.call('HSET', key, 'owner', args[3],
                'epoch', tostring(next_epoch))
    return {'OK', tostring(next_epoch)}
end

local function checkpoint(keys, args)
    local key = keys[1]
    local epoch_raw = server.call('HGET', key, 'epoch')
    if epoch_raw == false then
        return server.error_reply('STATE_NOT_FOUND')
    end

    local epoch = tonumber(epoch_raw)
    local version = tonumber(server.call('HGET', key, 'version') or '-1')
    local transition = server.call('HGET', key, 'transition_id')

    if epoch ~= tonumber(args[1]) then
        return server.error_reply('STALE_EPOCH')
    end
    if transition == args[3] and version == tonumber(args[2]) + 1 then
        return {'ALREADY_APPLIED', tostring(version)}
    end
    if version ~= tonumber(args[2]) then
        return server.error_reply('VERSION_CONFLICT')
    end

    local next_version = version + 1
    server.call('HSET', key,
                'version', tostring(next_version),
                'transition_id', args[3],
                'checkpoint_ref', args[4])
    return {'OK', tostring(next_version)}
end

server.register_function('takeover_task', takeover)
server.register_function('advance_checkpoint', checkpoint)
~~~

Deploy the same versioned library to every writable primary with [`FUNCTION LOAD REPLACE`](https://valkey.io/commands/function-load/). Before traffic and after promotion, verify its digest with [`FUNCTION LIST ... WITHCODE`](https://valkey.io/commands/function-list/); block writes on mismatch.

Each `transition_id` is unique through the ambiguity window. The current record reconciles a lost reply; after later commits replace its ID, the caller consults a transition log. Epochs cannot be reused or rolled back, and authorization restricts invocation.

## State the cross-system boundary

An `s3://` checkpoint cannot be atomically written with Valkey metadata. The contract therefore has three stages:

- **Precondition:** write an immutable payload identified by an object version or digest, then confirm it is addressable.
- **Atomic Valkey operation:** validate epoch and version, then publish its reference.
- **Postcondition:** verify that every accepted reference still resolves under the declared storage contract.

If payload succeeds but metadata fails, it is an orphan. Retain it through the ambiguity window and check references before deletion. Rejecting a checkpoint cannot undo an email or provisioned resource; that action needs an idempotency key, status query, or reconciliation record.

## Test correctness, progress, and recovery

### 1. Correctness

Initialize A at epoch 42/version 12, transfer ownership to B, race contenders, submit A's stale transition, replay a lost response, and audit payloads. Success requires one owner, one version advance, correct rejections and replay, and no missing accepted payload.

### 2. Progress

Report **valid checkpoint transitions per second**, not command attempts:

~~~text
valid transitions/s =
    contract-valid logical commits / measurement duration in seconds
~~~

Retries, stale rejections, version conflicts, and ambiguous responses are recorded separately.

### 3. Recovery

Each run issued `FCALL` and [`WAIT 1`](https://valkey.io/commands/wait/) on the same connection, verified the count, killed the primary, promoted the replica, and audited transition IDs and payloads. `WAIT` supplies replication evidence, not strong consistency or a universal survival guarantee. [`WAITAOF`](https://valkey.io/commands/waitaof/) can add AOF-write evidence when required.

## Publication evidence

The harness used Valkey 9.1.3 with one primary, one replica, 10,000 progress transitions, and 100 `WAIT`-acknowledged transitions per recorded run. After five warm-ups, all six tests passed in 30/30 independent clean-start runs.

| **Test or measure** | **Observed result** |
| --- | --- |
| Stale worker after takeover | `STALE_EPOCH`; checkpoint unchanged in 30/30 runs |
| Competing current-epoch writes | One version advancement; other writes conflicted in 30/30 runs |
| Lost client response | Replay reconciled the accepted transition in 30/30 runs |
| Payload succeeds, metadata fails | Orphan detected; no invalid accepted reference in 30/30 runs |
| Valid checkpoint progress | Median 20,355.7 transitions/s; IQR 19,618.9–20,720.3; range 13,108.4–21,038.3; median of per-run `FCALL` p99 values 1.486 ms |
| Primary loss and promotion | 3,000/3,000 acknowledged transitions retained across 30 events; every payload reference resolved; promotion median 297.4 ms, IQR 274.1–328.6 ms, range 163.5–493.6 ms |

These are same-host development results, not universal Valkey performance limits.

## Takeaway

Under the tested configuration, the protocol rejected stale and conflicting updates, reconciled ambiguous responses, and retained acknowledged checkpoint records and their payload references through the injected primary losses.

Valkey Functions provide atomic conditional publication, not a cross-system transaction, lease authority, or unconditional durability guarantee. Define ownership, version, payload, and acknowledgment checks first—and count throughput only after transitions pass that contract.

