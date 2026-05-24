---
title: "CLIENT INFO"
description: "CLIENT INFO command reference documentation"
---

The command returns information and statistics about the current client connection in a mostly human readable format.

The reply format is identical to that of [`CLIENT LIST`](client-list.md), and the content consists only of information about the current client.

## Examples

```
127.0.0.1:6379> CLIENT INFO
id=2875 addr=127.0.0.1:38610 laddr=127.0.0.1:6379 fd=10 name= age=0 idle=0 flags=N capa= db=0 sub=0 psub=0 ssub=0 multi=-1 watch=0 qbuf=26 qbuf-free=20448 argv-mem=10 multi-mem=0 rbs=16384 rbp=16384 obl=0 oll=0 omem=0 tot-mem=37786 events=r cmd=client|info user=default redir=-1 resp=2 lib-name= lib-ver=
```
