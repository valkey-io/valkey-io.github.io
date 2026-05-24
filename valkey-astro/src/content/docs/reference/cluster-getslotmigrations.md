---
title: "CLUSTER GETSLOTMIGRATIONS"
description: "CLUSTER GETSLOTMIGRATIONS command reference documentation"
---

`CLUSTER GETSLOTMIGRATIONS` returns an array of information about in-progress
and recently completed
[atomic slot migrations](../topics/atomic-slot-migration.md).

Each job previously started by [`CLUSTER MIGRATESLOTS`](cluster-migrateslots.md)
creates a single entry. The number of visible slot migration entries depends on
the configured `cluster-slot-migration-log-max-len`. After the limit is reached,
the oldest inactive entry is removed. Note that active slot migrations will
always be visible through `CLUSTER GETSLOTMIGRATIONS`, even if there are more
entries than the configured limit.

Information about the slot migration operations is stored in-memory and is not
persisted across restarts. Slot migration entries are visible on the primary
node of both the target and source shard and the replica nodes of the target
shard.

The following information is reported for each slot migration entry:

- `name`: A unique 40 byte name for the slot migration
- `operation`: The operation performed by the slot migration job on this node
  (either `EXPORT` or `IMPORT`)
- `slot_ranges`: The range(s) of slots being migrated, with both start and end
  inclusive. The start and end slot are separated by `-` in each range, and
  multiple ranges are joined together with a space ("` `").
- `target_node`: The primary node receiving the slot ownership as part of the
  migration. This information is only supplied on the primary node of the
  participating shards.
- `source_node`: The primary node sending the slot ownership as part of the
  migration. This information is only supplied on the primary node of the
  participating shards.
- `create_time`: The Unix timestamp (in seconds) when the slot
  migration was started.
- `last_update_time`: The Unix timestamp (in seconds) when the slot
  migration's status was last changed.
- `last_ack_time`: The Unix timestamp (in seconds) when the slot
  migration last received a heartbeat.
- `state`: The current state of the slot migration. The terminal states are
  `success` if completed successfully, `failed` if some unexpected failure
  occurred, and `cancelled` if a `CLUSTER CANCELSLOTMIGRATIONS` request was
  received during the migration. Any other state denotes an active slot
  migration.
- `message`: Either a human readable status message, if there is more
  information to display about the state, or empty string if no message is
  available.
- `cow_size`: The copy-on-write overhead accumulated while the migration was
  in progress, in bytes.
- `remaining_repl_size`: The number of bytes remaining in the source node's
  output buffer that are pending to be sent to the target node during slot
  migration. Added in Valkey 9.1.

## Examples

### Response in RESP 2

```
127.0.0.1:30001> CLUSTER GETSLOTMIGRATIONS
1)  1) "name"
    2) "5371b28997de6fd0bbe813ad8ebdfdf2faadb308"
    3) "operation"
    4) "EXPORT"
    5) "slot_ranges"
    6) "0-10"
    7) "target_node"
    8) "4b4f12fdfb58d5e30fef7b9ad3f1651dacbbaba9"
    9) "source_node"
   10) "93941e777e17fcbc92d4398cc957ffea888f472b"
   11) "create_time"
   12) (integer) 1754870400
   13) "last_update_time"
   14) (integer) 1754870400
   15) "last_ack_time"
   16) (integer) 1754870400
   17) "state"
   18) "success"
   19) "message"
   20) ""
   21) "cow_size"
   22) (integer) 0
   23) "remaining_repl_size"
   24) (integer) 0
```

### Response in RESP 3

```
127.0.0.1:30001> CLUSTER GETSLOTMIGRATIONS
1)  1# "name" => "5371b28997de6fd0bbe813ad8ebdfdf2faadb308"
    2# "operation" => "EXPORT"
    3# "slot_ranges" => "0-10"
    4# "target_node" => "4b4f12fdfb58d5e30fef7b9ad3f1651dacbbaba9"
    5# "source_node" => "93941e777e17fcbc92d4398cc957ffea888f472b"
    6# "create_time" => (integer) 1754870400
    7# "last_update_time" => (integer) 1754870400
    8# "last_ack_time" => (integer) 1754870400
    9# "state" => "success"
   10# "message" => ""
   11# "cow_size" => (integer) 0
   12# "remaining_repl_size" => (integer) 0
```
