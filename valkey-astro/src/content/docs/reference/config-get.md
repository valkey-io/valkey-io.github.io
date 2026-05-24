---
title: "CONFIG GET"
description: "CONFIG GET command reference documentation"
---

The `CONFIG GET` command is used to read the configuration parameters of a
running Valkey server.

The symmetric command used to alter the configuration at run time is [`CONFIG
SET`](config-set.md).

`CONFIG GET` takes multiple arguments, which are glob-style patterns.
Any configuration parameter matching any of the patterns are reported as a list
of key-value pairs.
In Valkey 9.0 and later, the list is sorted alphabetically by keys.
Example:

```
127.0.0.1:6379> config get *max-*-entries* maxmemory
 1) "hash-max-listpack-entries"
 2) "512"
 3) "hash-max-ziplist-entries"
 4) "512"
 5) "maxmemory"
 6) "0"
 7) "set-max-intset-entries"
 8) "512"
 9) "set-max-listpack-entries"
10) "128"
11) "zset-max-listpack-entries"
12) "128"
13) "zset-max-ziplist-entries"
14) "128"
```

You can obtain a list of all the supported configuration parameters by typing
`CONFIG GET *` in an open [valkey-cli](../topics/cli.md) prompt.

All the supported parameters have the same meaning of the equivalent
configuration parameter used in the [valkey.conf][hgcarr22rc] file:

[hgcarr22rc]: http://github.com/valkey-io/valkey/raw/unstable/valkey.conf

Note that you should look at the valkey.conf file relevant to the version you're
working with as configuration options might change between versions. The link
above is to the latest development version.
