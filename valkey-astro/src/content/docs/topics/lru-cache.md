---
title: Key eviction
description: Overview of Valkey key eviction policies (LRU, LFU, etc.)
---

When Valkey is used as a cache, it is often convenient to let it automatically
evict old data as you add new data. This behavior is well known in the
developer community, since it is the default behavior for the popular
*memcached* system.

This page covers the more general topic of the Valkey `maxmemory` directive used to limit the memory usage to a fixed amount. It also extensively covers the LRU eviction algorithm used by Valkey, which is actually an approximation of
the exact LRU.

## `Maxmemory` configuration directive

The `maxmemory` configuration directive configures Valkey
to use a specified amount of memory for the data set. You can
set the configuration directive using the `valkey.conf` file, or later using
the `CONFIG SET` command at runtime.

For example, to configure a memory limit of 100 megabytes, you can use the
following directive inside the `valkey.conf` file:

    maxmemory 100mb

Setting `maxmemory` to zero results into no memory limits. This is the
default behavior for 64 bit systems, while 32 bit systems use an implicit
memory limit of 3GB.
When the specified amount of memory is reached, how **eviction policies** are configured determines the default behavior.
Valkey can return errors for commands that could result in more memory
being used, or it can evict some old data to return back to the
specified limit every time new data is added.

### Considerations for `maxmemory` when using replication

If you have set up replication, Valkey needs some RAM as a buffer to send data to the replicas and AOF files. This memory is not included in the used memory count that is compared against the `maxmemory` to trigger eviction. 

The reason for that is that the key eviction process itself generates some changes that need to be added to the replication and AOF buffers. If these buffers were counted for the key eviction, this would result in a loop where a freed memory would immediately be used up by these updates causing more keys to be deleted repeatedly until the database is empty.

For Valkey with replication configured, it's recommended to set the `maxmemory` value lower than for a single instance without replication. This way you ensure there's enough memory for AOF and replication buffers, and other processes. 

You can estimate how much memory is used by the replication and AOF buffers using the `mem_not_counted_for_evict` value of the INFO memory command output. 

## Eviction policies

The exact behavior Valkey follows when the `maxmemory` limit is reached is
configured using the `maxmemory-policy` configuration directive.

The following policies are available:

* **noeviction**: New values aren't saved when memory limit is reached. When a database uses replication, this applies to the primary database
* **allkeys-lru**: Keeps most recently used keys; removes least recently used (LRU) keys
* **allkeys-lfu**: Keeps frequently used keys; removes least frequently used (LFU) keys
* **volatile-lru**: Removes least recently used keys with a time-to-live (TTL) set.
* **volatile-lfu**: Removes least frequently used keys with a TTL set.
* **allkeys-random**: Randomly removes keys to make space for the new data added.
* **volatile-random**: Randomly removes keys with a TTL set.
* **volatile-ttl**: Removes keys with a TTL set, the keys with the shortest remaining time-to-live value first.

The policies **volatile-lru**, **volatile-lfu**, **volatile-random**, and **volatile-ttl** behave like **noeviction** if there are no keys to evict matching the prerequisites.

**LRU**, **LFU** and **volatile-ttl** are implemented using approximated randomized algorithms.

Picking the right eviction policy is important depending on the access pattern
of your application, however you can reconfigure the policy at runtime while
the application is running, and monitor the number of cache misses and hits
using the Valkey `INFO` output to tune your setup.

In general as a rule of thumb:

* Use the **allkeys-lru** policy when you expect a power-law distribution in the popularity of your requests. That is, you expect a subset of elements will be accessed far more often than the rest. **This is a good pick if you are unsure**.

* Use the **allkeys-random** if you have a cyclic access where all the keys are scanned continuously, or when you expect the distribution to be uniform.

* Use the **volatile-ttl** if you want to be able to provide hints to Valkey about what are good candidate for expiration by using different TTL values when you create your cache objects.

The **volatile-lru** and **volatile-random** policies are mainly useful when you want to use a single instance for both caching and to have a set of persistent keys. However it is usually a better idea to run two Valkey instances to solve such a problem.

It is also worth noting that setting a TTL value to a key costs memory, so using a policy like **allkeys-lru** is more memory efficient since there is no need for a TTL configuration for the key to be evicted under memory pressure.

## How the eviction process works

It is important to understand that the eviction process works like this:

* A client runs a new command, resulting in more data added.
* Valkey checks the memory usage, and if it is greater than the `maxmemory` limit , it evicts keys according to the policy.
* A new command is executed, and so forth.

So we continuously cross the boundaries of the memory limit, by going over it, and then by evicting keys to return back under the limits.

If a command results in a lot of memory being used (like a big set intersection stored into a new key) for some time, the memory limit can be surpassed by a noticeable amount.

## Monitor eviction

To monitor the point when Valkey starts to evict data, use the `INFO MEMORY` command. The following fields provide the information about the memory usage and the condition to trigger key eviction:

* `used_memory`: The total number of bytes that the server allocated for storing data. It is the sum of the `used_memory_overhead` and the `used_memory_dataset` outputs.
* `mem_not_counted_for_evict`: The amount of memory not counted for eviction. This includes the replication buffer and AOF buffer.

Thus, the memory usage to trigger eviction is calculated as follows:

```
used_memory - mem_not_counted_for_evict > maxmemory
```

Let's see how this works in practice. 

Consider the following INFO memory output:

```
# Memory
used_memory:12498952
...
maxmemory:10737418240
...
mem_not_counted_for_evict:12336
...
```

In this example, Valkey will not start data eviction because the actual memory usage is `12498952 - 12336 = 12486616` which is considerably less than `maxmemory`.

The following example shows that we're nearing eviction:

```
# Memory
used_memory:12498952
...
maxmemory:12500000
...
mem_not_counted_for_evict:12336
```

Once eviction happens, additional information is available through the `INFO STATS` metrics. The `total_eviction_exceeded_time` metric shows the total time in milliseconds that `used_memory` exceeded `maxmemory`.


## Approximated LRU algorithm

Valkey LRU algorithm is not an exact implementation. This means that Valkey is
not able to pick the *best candidate* for eviction, that is, the key that
was accessed the furthest in the past. Instead it will try to run an approximation
of the LRU algorithm, by sampling a small number of keys, and evicting the
one that is the best (with the oldest access time) among the sampled keys, while
also managing a pool of good candidates for eviction.
This algorithm consumes less memory than an exact LRU algorithm.

What is important about the Valkey LRU algorithm is that you **are able to tune** the precision of the algorithm by changing the number of samples to check for every eviction. This parameter is controlled by the following configuration directive:

    maxmemory-samples 5

The reason Valkey does not use a true LRU implementation is because it
costs more memory. However, the approximation is virtually equivalent for an
application using Valkey. This figure compares
the LRU approximation used by Valkey with true LRU.

![LRU comparison](lru_comparison.png)

The test to generate the above graphs filled a server with a given number of keys. The keys were accessed from the first to the last. The first keys are the best candidates for eviction using an LRU algorithm. Later more 50% of keys are added, in order to force half of the old keys to be evicted.

You can see three kind of dots in the graphs, forming three distinct bands.

* The light gray band are objects that were evicted.
* The gray band are objects that were not evicted.
* The green band are objects that were added.

In a theoretical LRU implementation we expect that, among the old keys, the first half will be evicted.
The Valkey LRU algorithm will instead only *probabilistically* evicts the older keys.

As you can see, Redis OSS 3.0 does a reasonable job with 5 samples.
Using a sample size of 10, the approximation is very close to an exact LRU implementation.
(The LRU algorithm hasn't changed considerably since this test was performed, so the performance of Valkey is similar in this regard.)

Note that LRU is just a model to predict how likely a given key will be accessed in the future. Moreover, if your data access pattern closely
resembles the power law; most of the accesses will be in the set of keys
the LRU approximated algorithm can handle well.

In simulations we found that using a power law access pattern, the difference between true LRU and Valkey approximation were minimal or non-existent.

However you can raise the sample size to 10 at the cost of some additional CPU
usage to closely approximate true LRU, and check if this makes a
difference in your cache misses rate.

To experiment in production with different values for the sample size by using
the `CONFIG SET maxmemory-samples <count>` command, is very simple.

## The LFU mode

The [Least Frequently Used eviction mode](https://web.archive.org/web/20241019222228/http://antirez.com/news/109) is available as an alternative to LRU.
This mode may work better (provide a better
hits/misses ratio) in certain cases. In LFU mode, Valkey will try to track
the frequency of access of items, so the ones used rarely are evicted. This means
the keys used often have a higher chance of remaining in memory.

To configure the LFU mode, the following policies are available:

* `volatile-lfu` Evict using approximated LFU among the keys with a time-to-live (TTL) set.
* `allkeys-lfu` Evict any key using approximated LFU.

LFU is approximated like LRU: it uses a probabilistic counter, called a [Morris counter](https://en.wikipedia.org/wiki/Approximate_counting_algorithm) to estimate the object access frequency using just a few bits per object, combined with a decay period so that the counter is reduced over time. At some point we no longer want to consider keys as frequently accessed, even if they were in the past, so that the algorithm can adapt to a shift in the access pattern.

That information is sampled similarly to what happens for LRU (as explained in the previous section of this documentation) to select a candidate for eviction.

However unlike LRU, LFU has certain tunable parameters: for example, how fast
should a frequent item lower in rank if it gets no longer accessed? It is also possible to tune the Morris counters range to better adapt the algorithm to specific use cases.

By default Valkey is configured to:

* Saturate the counter at, around, one million requests.
* Decay the counter every one minute.

Those should be reasonable values and were tested experimentally, but the user may want to play with these configuration settings to pick optimal values.

Instructions about how to tune these parameters can be found inside the example `valkey.conf` file in the source distribution. Briefly, they are:

```
lfu-log-factor 10
lfu-decay-time 1
```

The decay time is the obvious one, it is the amount of minutes a counter should be decayed, when sampled and found to be older than that value. A special value of `0` means: we will never decay the counter.

The counter *logarithm factor* changes how many hits are needed to saturate the frequency counter, which is just in the range 0-255. The higher the factor, the more accesses are needed to reach the maximum. The lower the factor, the better is the resolution of the counter for low accesses, according to the following table:

```
+--------+------------+------------+------------+------------+------------+
| factor | 100 hits   | 1000 hits  | 100K hits  | 1M hits    | 10M hits   |
+--------+------------+------------+------------+------------+------------+
| 0      | 104        | 255        | 255        | 255        | 255        |
+--------+------------+------------+------------+------------+------------+
| 1      | 18         | 49         | 255        | 255        | 255        |
+--------+------------+------------+------------+------------+------------+
| 10     | 10         | 18         | 142        | 255        | 255        |
+--------+------------+------------+------------+------------+------------+
| 100    | 8          | 11         | 49         | 143        | 255        |
+--------+------------+------------+------------+------------+------------+
```

So basically the factor is a trade off between better distinguishing items with low accesses VS distinguishing items with high accesses. More information is available in the example `valkey.conf` file.
