+++
title = "Can you use Valkey with a disk-based database?"
weight = 3
[extra]
question = "Can you use Valkey with a disk-based database?"
category = "general"
+++

Yes, a common design pattern involves taking very write-heavy small data in Valkey (and data you need the Valkey data structures to model your problem in an efficient way), and big *blobs* of data into an SQL or eventually consistent on-disk database. Similarly sometimes Valkey is used in order to take in memory another copy of a subset of the same data stored in the on-disk database. This may look similar to caching, but actually is a more advanced model since normally the Valkey dataset is updated together with the on-disk DB dataset, and not refreshed on cache misses. 
