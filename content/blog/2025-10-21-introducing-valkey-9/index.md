+++
title="Valkey 9.0: innovation, features, and improvements."
date=2025-10-21 00:00:01
description= """ 
For Valkey's second major release, Valkey 9.0 brings innovation, long-requested features, and improvements to classic features updated for today’s workloads.
Read on to find out all the team packed into this release.
    """
authors= ["kyledvs"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-08.webp"
+++

For Valkey's second major release, Valkey 9.0 brings innovation, long-requested features, and improvements to classic features updated for today’s workloads.
Read on to find out all the team packed into this release.

## Atomic Slot Migrations

Atomic slot migrations fundamentally changes how Valkey migrates data from node-to-node inside the cluster.
Prior to Valkey 9.0, data migrated in the cluster key-by-key.
This approach works for most situations, but corner cases can lead to degraded performance, operational headaches, and, at worst, blocked node migrations and lost data.

Key-by-key migration uses a move-then-delete sequence.
Performance issues arise when a client tries to access a key during a partially migrated state: if the migration hasn’t completed, the client may not know if the key resides on a the original node or the new node and leading to a condition that has more network hops and additional processing.
Worse, in a multi-key operation, if one key resides in the original node and another in the new node, Valkey cannot properly execute the command, so it requires the client to retry the request until the data resides on a single node, leading to a mini-outage where Valkey still has the data but it is inaccessible until the migration is complete for the affected data.
Finally, in a situation where Valkey is attempting to migrate a very large key (such as collections in data types like sorted sets, sets, or lists) from one node to another, the entire key may be too large to be accepted by the target node’s input buffer leading to a blocked migration that needs manual intervention.
To unblock the migration you need to increase the input buffer limit or end up losing data either through forcing the slot assignment or deleting the key.

In Valkey, keys are bundled into one of 16,384 ‘slots’ and each node takes one or more slots.
In Valkey 9.0 instead of being key-by-key, Valkey migrates entire slots at a time, atomically moving the slot from one node to another using the AOF format.
AOF can send individual items in a collection instead of the whole key.
Consequently, this prevents large collections from causing latency spikes when they are being processed during migration.
The new atomic slot migration doesn’t migrate keys directly, instead, the move-then-delete sequence is on the entire slot; the original node still retains all the keys and data until the entire slot migration is complete avoiding the pre-Valkey 9.0 issues with redirects or retries.
For more information, check outthe video from our recent [Keyspace conference talk recording about Valkey 9.0](https://www.youtube.com/watch?v=GoKfeJGXEH0&list=PLAV1X7hxH2HtZWc2YNQRMQe9FT9XTWemE) and look for an upcoming deep dive on atomic slot migrations.

## Hash Field Expiration

The hash data type allows you to neatly tie together data with multiple fields under one key.
But because all this data lives attached to a single key, the expiry was, until Valkey 9.0, all-or-nothing: you couldn't expire fields individually.
For users who needed _some_ of the data to expire, the limitation made users look to awkward hacks with multiple keys, compounding the complexity and increasing the memory footprint of the data.
Valkey 9.0 now address this gap by adding the following commands:

* [HEXPIRE](/commands/hexpire/)
* [HEXPIREAT](/commands/hexpireat/)
* [HEXPIRETIME](/commands/hexpiretime/)
* [HGETEX](/commands/hgetex/)
* [HPERSIST](/commands/hpersist/)
* [HPEXPIRE](/commands/hpexpire/)
* [HPEXPIREAT](/commands/hpexpireat/)
* [HPEXPIRETIME](/commands/hpexpiretime/)
* [HPTTL](/commands/hpttl/)
* [HSETEX](/commands/hsetex/)
* [HTTL](/commands/httl/)

You can read more about how hash field expiration works in [Ran Shidlansik's deep dive](/blog/hash-fields-expiration/) on the subject.

## Numbered Databases in cluster mode

Numbered databases allow you to separate data and avoid key name clashes: each database contains keys  unique to that database.
This is an old feature dating back to the very first version of the preceding project.
However, before Valkey 9.0, numbered databases were severely limited with cluster mode being restricted to having a single database (db 0).
Without cluster support, numbered databases were discouraged as using them limited you to never scaling beyond a single node.

Based on user feedback and reconsideration by the team, Valkey 9.0 breaks from the preceding project and adds full support for numbered databases in cluster mode.
Numbered databases have a whole host of use cases and some very handy clustering characteristics, find out more in the [feature write up](/blog/numbered-databases/).

## Much, much, more

Valkey 9.0 brings numerous small changes and improvements:

* **[1 Billion Requests/Second with Large Clusters](/blog/1-billion-rps/)**: Improvements in the resilience of large clusters, enabling scaling to 2,000 nodes and achieving over 1 billion requests per second,
* **[Pipeline Memory Prefetch](https://github.com/valkey-io/valkey/pull/2092)**: Memory prefetching when pipelining, yielding up to 40% higher throughput,
* **[Un-deprecation](https://github.com/valkey-io/valkey/pull/2546)**: In a similar vein to numbered databases, the Valkey project re-evaluated 25 previously deprecated commands and, based on the stance of API backward compatibility, restored the usage recommendation for these commands.
* **[Zero copy Responses](https://github.com/valkey-io/valkey/pull/2078)**: Large requests avoid internal memory copying, yielding up to 20% higher throughput,
* **[Multipath TCP](https://github.com/valkey-io/valkey/pull/1811)**: Adds Multipath TCP support which can reduce latency by 25%.
* **[SIMD for BITCOUNT and HyperLogLog](https://github.com/valkey-io/valkey/pull/1741)**: optimizations that yield up to a 200% higher throughput,
* **[By Polygon for Geospatial Indices](https://github.com/valkey-io/valkey/pull/1809)**: query location by a specified polygon,
* **[Conditional Delete](https://github.com/valkey-io/valkey/pull/1975)**: Adds the [DELIFEQ](/commands/delifeq/) command that deletes the key if the value is equal to a specified value,
* **[CLIENT LIST Filtering](https://github.com/valkey-io/valkey/pull/1466)**: options to filter [CLIENT LIST](/commands/client-list/) using flags, name, idle, library name/version, database, IP, and capabilities.

And, perhaps, most importantly, a new, whimsical [LOLWUT](/commands/lolwut/) generative art piece especially for version 9.

## Get it today

Valkey 9.0 was built by the collaborative efforts of dozens of contributors.
Make sure and grab Valkey 9.0 today as a [binary, container](/download/releases/v9-0-1), or [build it from source](https://github.com/valkey-io/valkey/releases/tag/9.0.1) and watch for it in your favourite Linux distribution.
Feel free to post a question on our GitHub discussions or Slack and if you find a bug, make sure and tell the team as an issue.