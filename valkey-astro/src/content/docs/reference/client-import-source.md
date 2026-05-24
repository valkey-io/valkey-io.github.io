---
title: "CLIENT IMPORT SOURCE"
description: "CLIENT IMPORT SOURCE command reference documentation"
---

When the client sync data from a Redis-like server to Valkey using some sync tools like [RedisShake](https://github.com/tair-opensource/RedisShake), Valkey performs expiration and eviction as usual because it's a primary, which may cause data corruption. For example, the client calls `set key 1 ex 1` on the source server and this command is transferred to the destination server. Then the client calls `incr key` on the source server before the key expired, there will be a key on the source server with the value of 2. But when the command arrived at the destination server, the key may be expired and has deleted. So there will be a key on the destination server with the value of 1, which is inconsistent with the source server. Sync tools can solve this problem by setting `import-mode` config to `yes` and declaring their connections as `IMPORT-SOURCE`.

The `CLIENT IMPORT-SOURCE` command mark this client as an import source if import-mode is enabled and can visit expired keys. The following modes are available:

* `ON`. In this mode the client can visit expired keys.
* `OFF`. This is the default mode in which the client works as a normal client.

## Notes

The server needs to be configured with `import-mode yes` before marking a client connection as an import source.
