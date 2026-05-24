---
title: "TIME"
description: "TIME command reference documentation"
---

The `TIME` command returns the current server time as a two items lists: a Unix
timestamp and the amount of microseconds already elapsed in the current second.
Basically the interface is very similar to the one of the `gettimeofday` system
call.

## Examples

```
127.0.0.1:6379> TIME
1) "1714701491"
2) "723379"
127.0.0.1:6379> TIME
1) "1714701491"
2) "731773"
```
