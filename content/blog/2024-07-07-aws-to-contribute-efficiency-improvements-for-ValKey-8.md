+++
# `title` is how your post will be listed and what will appear at the top of the post
title=  "AWS to Contribute Efficiency Improvements to Valkey 8 "
# `date` is when your post will be published.
# For the most part, you can leave this as the day you _started_ the post.
# The maintainers will update this value before publishing
# The time is generally irrelvant in how Valkey published, so '01:01:01' is a good placeholder
date= 2024-07-08 01:01:01
# 'description' is what is shown as a snippet/summary in various contexts.
# You can make this the first few lines of the post or (better) a hook for readers.
# Aim for 2 short sentences.
description= "Better efficiency reduces cost, improves latency and makes our environment greener"
# 'authors' are the folks who wrote or contributed to the post.
# Each author corresponds to a biography file (more info later in this document)
authors= [ "dantouitou", "uriyagelnik"]
+++
## AWS to Contribute Efficiency Improvements for Valkey 8

From simple in-memory caching implementations to complex job queues, real-time collaboration, and leaderboards applications, we at AWS are continually amazed by how innovatively users employ Valkey. 

Clearly, this is just the tip of the iceberg. As more use cases and industries want to  benefit from the speed, low latency, and cost reduction advantages of in-memory processing as introduced by Valkey, we are fully committed to this vision.

### Our Commitment to Efficiency

One of our primary goals at AWS is to ensure our customers receive the most efficient services. Efficiency not only leads to lower costs, better latency and a greener environment, but also enhances resilience.

For example, take the fork-based snapshotting and replication process. The longer it takes, the more memory is consumed by copied-on-write pages and the replica output buffer, often resulting in high swapping and erratic behavior. By reducing execution time, one can achieve a more predictable memory usage and greater stability.

### Major Upgrade to Valkey Performance

We are excited about the new Linux Foundation sponsorship for Valkey and are taking a bigger step, contributing our major performance improvements and expertise. Starting with version 8, Valkey users will benefit from a breakthrough in performance, thanks to a new multi-threading implementation that can can considerably boost performance on a wide range of hardware types. 

For caching workloads, Valkey users will be able to increase maximum requests per second to over 1 million on multi-core machines such as AWS EC2  r7g.4xl

### Benefits of High Capacity Shards

Valkey's common approach for performance and memory increase is by scaling out, i.e.,
adding more shards to the cluster. The availability of more powerful nodes adds another dimension
of flexibility when designing applications. 

First, higher-capacity shards enable the deployment of clusters
with larger capacity and greater resilience to request surges. Additionally, for applications requiring multi-key
transactions, more powerful shards simplify key distribution when designing the application by allowing a higher
concentration of slots in a single shard. Finally, higher-capacity shards handling requests for a larger number
of slots are more effective in load balancing resources during arbitrary increases in load on random slots.
This reduces the need for costly over-provisioning.

### Performance Without Compromising Simplicity

Implementing multi-threading  can be a complex task. Over the years, contributors have been careful to maintain Redis’ and now Valkey’s simplicity . This ensures an API  that can continuously evolve without the need to use complex synchronization and avoid race conditions. 

We designed our new multi-threading approach to delight Valkey users with intuitive simplicity. It utilizes a minimal number of synchronization mechanisms and keeps Valkey command execution single-threaded, simple, and primed for future enhancements.

![io_threads high level design](/assets/media/pictures/io_threads.png)

### High Level Design 
The above diagram depicts the io_threads implementation from a high-level perspective. Io_threads are stateless worker threads that receive jobs to execute from the main thread. In Valkey 8, a job can involve reading and parsing a command from a client, writing back responses to the client, polling for IO events on TCP connections, or de-allocating memory. This leaves the main thread with more time to execute  commands. 

The main thread orchestrates all the jobs spawned to the io_threads, ensuring that no race conditions occur. Io_threads can be easily added and removed by the main thread based on the current load to ensure efficient utilization of the underlying hardware. Despite the dynamic nature of io_threads, the main thread attempts to maintain thread affinity, ensuring that the same io_thread will handle IO for the same client to improve memory access locality. 

Before executing commands, the main thread performs a new procedure, prefetch-commands-keys, which aims to reduce the number of external memory accesses needed when executing the commands on the main dictionary. A detailed explanation of the technique used in that procedure will be described in our next blog. 

Socket polling system calls, such as epoll_wait, are expensive procedures. When executed solely by the main thread, epoll_wait consumes more than 20 percent of the time. Therefore, we decided to offload epoll_wait execution to the io_threads in the following way: to avoid race conditions, at any time, at most one thread, either an io_thread or the main thread, is executing epoll_wait. Io_threads never sleep on epoll, and whenever there are pending IO operations or commands to be executed, epoll_wait calls are scheduled to the io_threads by the main thread. In all other cases, the main thread executes the epoll_wait with the waiting time as in the original Valkey implementation 

### Future Enhancements

This is just the beginning. We plan to uphold our commitment to enhancing Valkey's commands and processes efficiency. Stay tuned!