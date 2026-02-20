+++
title = "What happens if Valkey runs out of memory?"
weight = 4
[extra]
question = "What happens if Valkey runs out of memory?"
category = "memory-performance"
+++

Valkey has built-in protections allowing the users to set a max limit on memory usage, using the `maxmemory` option in the configuration file to put a limit to the memory Valkey can use. If this limit is reached, Valkey will start to reply with an error to write commands (but will continue to accept read-only commands).

You can also configure Valkey to evict keys when the max memory limit is reached. See the [eviction policy docs](/topics/lru-cache/) for more information on this. 
