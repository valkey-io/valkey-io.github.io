+++
title = "How can Valkey use multiple CPUs or cores?"
weight = 5
[extra]
question = "How can Valkey use multiple CPUs or cores?"
category = "memory-performance"
+++

Enable I/O threading to offload client communication to threads. In Valkey 8, the I/O threading implementation has been rewritten and greatly improved. Reading commands from clients and writing replies back uses considerable CPU time. By offloading this work to separate threads, the main thread can focus on executing commands.

You can also start multiple instances of Valkey in the same box and combine them into a [cluster](/topics/cluster-tutorial/). 
