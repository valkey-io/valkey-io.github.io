---
title: "PFMERGE"
description: "PFMERGE command reference documentation"
---

Merge multiple HyperLogLog values into a unique value that will approximate
the cardinality of the union of the observed Sets of the source HyperLogLog
structures.

The computed merged HyperLogLog is set to the destination variable, which is
created if does not exist (defaulting to an empty HyperLogLog).

If the destination variable exists, it is treated as one of the source sets 
and its cardinality will be included in the cardinality of the computed
HyperLogLog.

## Examples

```
127.0.0.1:6379> PFADD hll1 foo bar zap a
(integer) 1
127.0.0.1:6379> PFADD hll2 a b c foo
(integer) 1
127.0.0.1:6379> PFMERGE hll3 hll1 hll2
OK
127.0.0.1:6379> PFCOUNT hll3
(integer) 6
```
