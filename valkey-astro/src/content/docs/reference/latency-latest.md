---
title: "LATENCY LATEST"
description: "LATENCY LATEST command reference documentation"
---

The `LATENCY LATEST` command reports the latest latency events logged.

Each reported event has the following fields:

* Event name.
* Unix timestamp of the latest latency spike for the event.
* Latest event latency in millisecond.
* All-time maximum latency for this event.
* Sum of the latencies recorded in the time series for this event, added in 8.1.
* The number of latency spikes recorded in the time series for this event, added in 8.1.

"All-time" means the maximum latency since the Valkey instance was
started, or the time that events were reset [`LATENCY RESET`](latency-reset.md).

## Examples

```
127.0.0.1:6379> debug sleep 1
OK
(1.00s)
127.0.0.1:6379> debug sleep .25
OK
127.0.0.1:6379> latency latest
1) 1) "command"
   2) (integer) 1738651470
   3) (integer) 254
   4) (integer) 1005
   5) (integer) 1259
   6) (integer) 2
```

For more information refer to the [Latency Monitoring Framework page][lm].

[lm]: ../topics/latency-monitor.md
