---
title: "HEXPIRETIME"
description: "HEXPIRETIME command reference documentation"
---

The `HEXPIRETIME` command returns the absolute Unix timestamp (since January 1, 1970) in seconds at which the given hash field(s) will expire or -1 if the hash field doesn't have expiration time.

See also the [`HPEXPIRETIME`](hpexpiretime.md) command that returns the same information with milliseconds resolution.

## Examples

```
127.0.0.1:6379> HSET myhash f1 v1 f2 v2 f3 v3
(integer) 3
27.0.0.1:6379> HEXPIREAT myhash 1754846600 FIELDS 2 f2 f3
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> HEXPIRETIME myhash FIELDS 4 f1 f2 f3 non-exist
1) (integer) -1
2) (integer) 1754846600
3) (integer) 1754846600
4) (integer) -2
```
