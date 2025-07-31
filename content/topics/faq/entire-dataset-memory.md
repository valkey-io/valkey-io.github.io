+++
title = "Why does Valkey keep its entire dataset in memory?"
weight = 2

[extra]
question = "Why does Valkey keep its entire dataset in memory?"
category = "memory-performance"
+++

In the past, developers experimented with Virtual Memory and other systems in order to allow larger than RAM datasets, but after all we are very happy if we can do one thing well: data served from memory, disk used for storage. So for now there are no plans to create an on disk backend for Valkey. Most of what Valkey is, after all, a direct result of its current design.

If your real problem is not the total RAM needed, but the fact that you need to split your data set into multiple Valkey instances, please read the [partitioning page](/topics/cluster-tutorial/) in this documentation for more info. 
