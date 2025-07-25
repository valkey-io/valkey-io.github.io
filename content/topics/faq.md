+++
title = "FAQ"
template = "faq.html"
+++

<div class="faq-section">
  <h2 id="general">General</h2>
  <div class="faq-item">
    <h3 class="faq-question">What is Valkey?</h3>
    <div class="faq-answer">
      Valkey is an open-source, in-memory data structure store that can be used as a database, cache, and message broker. It supports various data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes with radius queries, and streams.
    </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">How is Valkey different from other key-value stores?</h3>
    <div class="faq-answer">
      Valkey has a different evolution path in the key-value DBs where values can contain more complex data types, with atomic operations defined on those data types. Valkey data types are closely related to fundamental data structures and are exposed to the programmer as such, without additional abstraction layers.

      Valkey is an in-memory but persistent on disk database, so it represents a different trade off where very high write and read speed is achieved with the limitation of data sets that can't be larger than memory. Another advantage of in-memory databases is that the memory representation of complex data structures is much simpler to manipulate compared to the same data structures on disk, so Valkey can do a lot with little internal complexity.
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">Can you use Valkey with a disk-based database?</h3>
    <div class="faq-answer">
      Yes, a common design pattern involves taking very write-heavy small data in Valkey (and data you need the Valkey data structures to model your problem in an efficient way), and big *blobs* of data into an SQL or eventually consistent on-disk database. Similarly sometimes Valkey is used in order to take in memory another copy of a subset of the same data stored in the on-disk database. This may look similar to caching, but actually is a more advanced model since normally the Valkey dataset is updated together with the on-disk DB dataset, and not refreshed on cache misses.
    </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">Why did Linux Foundation start the Valkey project?</h3>
    <div class="faq-answer">
      Valkey was created as a fork of Redis after Redis changed its licensing model. The Linux Foundation started the Valkey project to ensure the continued availability of an open-source, community-driven in-memory data store that maintains the original Redis API compatibility while being developed under open-source principles.
    </div>
  </div>
</div>

<div class="faq-section">
  <h2 id="memory-performance">Memory & Performance</h2>

  <div class="faq-item">
    <h3 class="faq-question">What's the Valkey memory footprint?</h3>
    <div class="faq-answer">
      To give you a few examples:

      * An empty instance uses ~ 3MB of memory.
      * 1 Million small Keys -> String Value pairs use ~ 85MB of memory.
      * 1 Million Keys -> Hash value, representing an object with 5 fields, use ~ 160 MB of memory.

      Testing your use case is trivial. Use the `valkey-benchmark` utility to generate random data sets then check the space used with the `INFO memory` command.
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">Why does Valkey keep its entire dataset in memory?</h3>
    <div class="faq-answer">
      In the past, developers experimented with Virtual Memory and other systems in order to allow larger than RAM datasets, but after all we are very happy if we can do one thing well: data served from memory, disk used for storage. So for now there are no plans to create an on disk backend for Valkey. Most of what Valkey is, after all, a direct result of its current design.

      If your real problem is not the total RAM needed, but the fact that you need to split your data set into multiple Valkey instances, please read the [partitioning page](cluster-tutorial.md) in this documentation for more info.
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">How can I reduce Valkey's overall memory usage?</h3>
    <div class="faq-answer">
      A good practice is to consider memory consumption when mapping your logical data model to the physical data model within Valkey. These considerations include using specific data types, key patterns, and normalization.

      Beyond data modeling, there is more info in the [Memory Optimization page](memory-optimization.md).
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">What happens if Valkey runs out of memory?</h3>
    <div class="faq-answer">
      Valkey has built-in protections allowing the users to set a max limit on memory usage, using the `maxmemory` option in the configuration file to put a limit to the memory Valkey can use. If this limit is reached, Valkey will start to reply with an error to write commands (but will continue to accept read-only commands).

      You can also configure Valkey to evict keys when the max memory limit is reached. See the [eviction policy docs](lru-cache.md) for more information on this.
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">How can Valkey use multiple CPUs or cores?</h3>
    <div class="faq-answer">
      Enable I/O threading to offload client communication to threads. In Valkey 8, the I/O threading implementation has been rewritten and greatly improved. Reading commands from clients and writing replies back uses considerable CPU time. By offloading this work to separate threads, the main thread can focus on executing commands.

      You can also start multiple instances of Valkey in the same box and combine them into a [cluster](cluster-tutorial.md).
   </div>
  </div>
</div>

<div class="faq-section">
  <h2 id="technical">Technical</h2>

  <div class="faq-item">
    <h3 class="faq-question">Background saving fails with a fork() error on Linux?</h3>
    <div class="faq-answer">
      Short answer: `echo 1 > /proc/sys/vm/overcommit_memory` :)

      And now the long one:

      The Valkey background saving schema relies on the copy-on-write semantic of the `fork` system call in modern operating systems: Valkey forks (creates a child process) that is an exact copy of the parent. The child process dumps the DB on disk and finally exits. In theory the child should use as much memory as the parent being a copy, but actually thanks to the copy-on-write semantic implemented by most modern operating systems the parent and child process will _share_ the common memory pages. A page will be duplicated only when it changes in the child or in the parent. Since in theory all the pages may change while the child process is saving, Linux can't tell in advance how much memory the child will take, so if the `overcommit_memory` setting is set to zero the fork will fail unless there is as much free RAM as required to really duplicate all the parent memory pages. If you have a Valkey dataset of 3 GB and just 2 GB of free memory it will fail.

      Setting `overcommit_memory` to 1 tells Linux to relax and perform the fork in a more optimistic allocation fashion, and this is indeed what you want for Valkey.

      You can refer to the [proc(5)][proc5] man page for explanations of the available values.

      [proc5]: https://man7.org/linux/man-pages/man5/proc.5.html
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">Are Valkey on-disk snapshots atomic?</h3>
    <div class="faq-answer">
      Yes, the Valkey background saving process is always forked when the server is outside of the execution of a command, so every command reported to be atomic in RAM is also atomic from the point of view of the disk snapshot.
    </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">Why does my replica have a different number of keys than its primary instance?</h3>
    <div class="faq-answer">
      If you use keys with limited time to live (Valkey expires) this is normal behavior. This is what happens:

      * The primary generates an RDB file on the first synchronization with the replica.
      * The RDB file will not include keys already expired in the primary but which are still in memory.
      * These keys are still in the memory of the Valkey primary, even if logically expired. They'll be considered non-existent, and their memory will be reclaimed later, either incrementally or explicitly on access. While these keys are not logically part of the dataset, they are accounted for in the `INFO` output and in the `DBSIZE` command.
      * When the replica reads the RDB file generated by the primary, this set of keys will not be loaded.

      Because of this, it's common for users with many expired keys to see fewer keys in the replicas. However, logically, the primary and replica will have the same content.
   </div>
  </div>

</div>

<div class="faq-section">
  <h2 id="limitations">Limitations</h2>

  <div class="faq-item">
    <h3 class="faq-question">What is the maximum number of keys a single Valkey instance can hold? What is the maximum number of elements in a Hash, List, Set, and Sorted Set?</h3>
    <div class="faq-answer">
      Valkey can handle up to 2<sup>32</sup> keys, and was tested in practice to handle at least 250 million keys per instance.

      Every hash, list, set, and sorted set, can hold 2<sup>32</sup> elements.

      In other words your limit is likely the available memory in your system.
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">What are the main limitations of Valkey?</h3>
    <div class="faq-answer">
      The main limitations of Valkey include:

      * **Memory-based storage**: All data must fit in RAM, which limits the total dataset size to available memory.
      * **Single-threaded command execution**: While I/O threading is available, commands are executed sequentially in the main thread.
      * **No built-in authentication**: Authentication must be implemented at the application level or through network security.
      * **Limited query capabilities**: Unlike SQL databases, Valkey doesn't support complex queries or joins.
      * **No built-in backup**: Backup and recovery must be implemented using external tools or scripts.
   </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">Can Valkey handle transactions?</h3>
    <div class="faq-answer">
      Yes, Valkey supports transactions through the `MULTI`, `EXEC`, `DISCARD`, and `WATCH` commands. However, these are not ACID transactions in the traditional database sense. Valkey transactions provide atomicity (all commands in a transaction are executed or none are) but not isolation (other clients can see intermediate states).
    </div>
  </div>

  <div class="faq-item">
    <h3 class="faq-question">What happens when Valkey runs out of disk space?</h3>
    <div class="faq-answer">
      When Valkey runs out of disk space, it will stop accepting write commands and return errors. The server will continue to serve read commands but won't be able to persist data to disk. It's important to monitor disk space and implement proper alerting to prevent this situation.
    </div>
  </div>
</div>
