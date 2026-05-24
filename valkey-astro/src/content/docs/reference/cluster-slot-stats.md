---
title: "CLUSTER SLOT STATS"
description: "CLUSTER SLOT STATS command reference documentation"
---

Returns an array of slot usage statistics for slots assigned to the current shard.
The command is suitable for Valkey Cluster users aiming to assess general slot usage trends, identify hot / cold slots, migrate slots for a balanced cluster workload, and / or re-write application logic to better utilize slots.

The following statistics are supported:

* `key-count` -- Number of keys residing in a given slot.
* `cpu-usec` -- Amount of CPU time (in microseconds) spent on a given slot.
* `network-bytes-in` -- Amount of network ingress (in bytes) received for given slot.
* `network-bytes-out` -- Amount of network egress (in bytes) sent out for given slot.

**Note:** By default, only `key-count` is returned. To enable `cpu-usec`, `network-bytes-in`, and `network-bytes-out` statistics, set `cluster-slot-stats-enabled yes` in the configuration.

## Options

* `ORDERBY` -- Returns an ordered slot statistics based on the specified statistic and sub-arguments to identify hot / cold slots across the cluster. Either `ASC` or `DESC` modifiers can be used. In the event of a tie in the stats, ascending slot number is used as a tie breaker.
* `SLOTSRANGE` -- Returns slot statistics based on the slots range provided for pagination. The range is inclusive. The response is ordered in ascending slot number.

## Examples

### Response in RESP2

For `ORDERBY`:
```
> CLUSTER SLOT-STATS ORDERBY KEY-COUNT LIMIT 2 DESC
1) 1) (integer) 12426
   2) 1) "key-count"
      2) (integer) 45
      3) "cpu-usec"
      4) (integer) 0
      5) "network-bytes-in"
      6) (integer) 0
      7) "network-bytes-out"
      8) (integer) 0
2) 1) (integer) 13902
   2) 1) "key-count"
      2) (integer) 20
      3) "cpu-usec"
      4) (integer) 0
      5) "network-bytes-in"
      6) (integer) 0
      7) "network-bytes-out"
      8) (integer) 0
```

For `SLOTSRANGE`:
```
> CLUSTER SLOT-STATS SLOTSRANGE 0 1
1) 1) (integer) 0
   2) 1) "key-count"
      2) (integer) 0
      3) "cpu-usec"
      4) (integer) 0
      5) "network-bytes-in"
      6) (integer) 0
      7) "network-bytes-out"
      8) (integer) 0
2) 1) (integer) 1
   2) 1) "key-count"
      2) (integer) 0
      3) "cpu-usec"
      4) (integer) 0
      5) "network-bytes-in"
      6) (integer) 0
      7) "network-bytes-out"
      8) (integer) 0
```

### Response in RESP3

For `ORDERBY`:
```
> CLUSTER SLOT-STATS ORDERBY KEY-COUNT LIMIT 2 DESC
1) 1) (integer) 12426
   2) 1# "key-count" => (integer) 45
      2# "cpu-usec" => (integer) 0
      3# "network-bytes-in" => (integer) 0
      4# "network-bytes-out" => (integer) 0
2) 1) (integer) 13902
   2) 1# "key-count" => (integer) 20
      2# "cpu-usec" => (integer) 0
      3# "network-bytes-in" => (integer) 0
      4# "network-bytes-out" => (integer) 0
```

For `SLOTSRANGE`:
```
> CLUSTER SLOT-STATS SLOTSRANGE 0 1
1) 1) (integer) 0
   2) 1# "key-count" => (integer) 0
      2# "cpu-usec" => (integer) 0
      3# "network-bytes-in" => (integer) 0
      4# "network-bytes-out" => (integer) 0
2) 1) (integer) 1
   2) 1# "key-count" => (integer) 0
      2# "cpu-usec" => (integer) 0
      3# "network-bytes-in" => (integer) 0
      4# "network-bytes-out" => (integer) 0
```
