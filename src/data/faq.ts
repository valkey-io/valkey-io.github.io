export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string; // HTML content
  categoryId: string;
}

export const faqCategories: FaqCategory[] = [
  {
    id: 'cat_1',
    name: 'General',
    slug: 'general',
  },
  {
    id: 'cat_2',
    name: 'Memory & Performance',
    slug: 'memory-performance',
  },
  {
    id: 'cat_3',
    name: 'Technical',
    slug: 'technical',
  },
  {
    id: 'cat_4',
    name: 'Limitations',
    slug: 'limitations',
  }
];

export const faqs: Faq[] = [
  // General
  {
    id: 'faq_1',
    question: 'How is Valkey different from other key-value stores?',
    answer: '<ul><li>Valkey has a different evolution path in the key-value DBs where values can contain more complex data types, with atomic operations defined on those data types. Valkey data types are closely related to fundamental data structures and are exposed to the programmer as such, without additional abstraction layers.</li><li>Valkey is an in-memory but persistent on disk database, so it represents a different trade off where very high write and read speed is achieved with the limitation of data sets that can\'t be larger than memory. Another advantage of in-memory databases is that the memory representation of complex data structures is much simpler to manipulate compared to the same data structures on disk, so Valkey can do a lot with little internal complexity. At the same time the two on-disk storage formats (RDB and AOF) don\'t need to be suitable for random access, so they are compact and always generated in an append-only fashion (Even the AOF log rotation is an append-only operation, since the new version is generated from the copy of data in memory). However this design also involves different challenges compared to traditional on-disk stores. Being the main data representation on memory, Valkey operations must be carefully handled to make sure there is always an updated version of the data set on disk.</li></ul>',
    categoryId: 'cat_1'
  },
  {
    id: 'faq_1_1',
    question: 'Can you use Valkey with a disk-based database?',
    answer: 'Yes, a common design pattern involves taking very write-heavy small data in Valkey (and data you need the Valkey data structures to model your problem in an efficient way), and big blobs of data into an SQL or eventually consistent on-disk database. Similarly sometimes Valkey is used in order to take in memory another copy of a subset of the same data stored in the on-disk database. This may look similar to caching, but actually is a more advanced model since normally the Valkey dataset is updated together with the on-disk DB dataset, and not refreshed on cache misses.',
    categoryId: 'cat_1'
  },
  {
    id: 'faq_1_2',
    question: 'Why did Linux Foundation start the Valkey project?',
    answer: 'Read about <a href="/topics/history">the history of Valkey.</a>',
    categoryId: 'cat_1'
  },

  // Memory & Performance
  {
    id: 'faq_2',
    question: 'What\'s the Valkey memory footprint?',
    answer: 'To give you a few examples:<ul><li>An empty instance uses ~ 3MB of memory.</li><li>1 Million small Keys -> String Value pairs use ~ 85MB of memory.</li><li>1 Million Keys -> Hash value, representing an object with 5 fields, use ~ 160 MB of memory.</li></ul><p>Testing your use case is trivial. Use the valkey-benchmark utility to generate random data sets then check the space used with the INFO memory command.</p>',
    categoryId: 'cat_2'
  },
  {
    id: 'faq_2_1',
    question: 'Why does Valkey keep its entire dataset in memory?',
    answer: 'In the past, developers experimented with Virtual Memory and other systems in order to allow larger than RAM datasets, but after all we are very happy if we can do one thing well: data served from memory, disk used for storage. So for now there are no plans to create an on disk backend for Valkey. Most of what Valkey is, after all, a direct result of its current design.</p><p>If your real problem is not the total RAM needed, but the fact that you need to split your data set into multiple Valkey instances, please read the <a href="/topics/cluster-tutorial/">partitioning page</a> in this documentation for more info.',
    categoryId: 'cat_2'
  },
  {
    id: 'faq_2_2',
    question: 'How can I reduce Valkey\'s overall memory usage?',
    answer: 'A good practice is to consider memory consumption when mapping your logical data model to the physical data model within Valkey. These considerations include using specific data types, key patterns, and normalization.</p><p>Beyond data modeling, there is more info in the <a href="/topics/memory-optimization/">Memory Optimization page</a>.',
    categoryId: 'cat_2'
  },
  {
    id: 'faq_2_3',
    question: 'What happens if Valkey runs out of memory?',
    answer: 'Valkey has built-in protections allowing the users to set a max limit on memory usage, using the maxmemory option in the configuration file to put a limit to the memory Valkey can use. If this limit is reached, Valkey will start to reply with an error to write commands (but will continue to accept read-only commands).</p><p>You can also configure Valkey to evict keys when the max memory limit is reached. See the <a href="/topics/lru-cache/">eviction policy docs</a> for more information on this.',
    categoryId: 'cat_2'
  },

  // Technical
  {
    id: 'faq_3',
    question: 'Background saving fails with a fork() error on Linux?',
    answer: 'The Valkey background saving schema relies on the copy-on-write semantic of the fork system call in modern operating systems: Valkey forks (creates a child process) that is an exact copy of the parent. The child process dumps the DB on disk and finally exits. In theory the child should use as much memory as the parent being a copy, but actually thanks to the copy-on-write semantic implemented by most modern operating systems the parent and child process will share the common memory pages. A page will be duplicated only when it changes in the child or in the parent. Since in theory all the pages may change while the child process is saving, Linux can\'t tell in advance how much memory the child will take, so if the overcommit_memory setting is set to zero the fork will fail unless there is as much free RAM as required to really duplicate all the parent memory pages. If you have a Valkey dataset of 3 GB and just 2 GB of free memory it will fail.</p><p>Setting overcommit_memory to 1 tells Linux to relax and perform the fork in a more optimistic allocation fashion, and this is indeed what you want for Valkey.</p><p>You can refer to the proc(5) man page for explanations of the available values.',
    categoryId: 'cat_3'
  },
  {
    id: 'faq_3_1',
    question: 'Are Valkey on-disk snapshots atomic?',
    answer: 'Yes, the Valkey background saving process is always forked when the server is outside of the execution of a command, so every command reported to be atomic in RAM is also atomic from the point of view of the disk snapshot.',
    categoryId: 'cat_3'
  },
  {
    id: 'faq_3_2',
    question: 'How can Valkey use multiple CPUs or cores?',
    answer: 'Enable I/O threading to offload client communication to threads. In Valkey 8, the I/O threading implementation has been rewritten and greatly improved. Reading commands from clients and writing replies back uses considerable CPU time. By offloading this work to separate threads, the main thread can focus on executing commands.</p><p>You can also start multiple instances of Valkey in the same box and combine them into a <a href="/topics/cluster-tutorial/">cluster.</a>',
    categoryId: 'cat_3'
  },

  // Limitations
  {
    id: 'faq_4',
    question: 'What is the maximum number of keys a single Valkey instance can hold? What is the maximum number of elements in a Hash, List, Set, and Sorted Set?',
    answer: 'Valkey can handle up to 2^32 keys, and was tested in practice to handle at least 250 million keys per instance.</p><p>Every hash, list, set, and sorted set, can hold 2^32 elements.</p><p>In other words your limit is likely the available memory in your system.',
    categoryId: 'cat_4'
  },
  {
    id: 'faq_4_1',
    question: 'Why does my replica have a different number of keys than its primary instance?',
    answer: 'If you use keys with limited time to live (Valkey expires) this is normal behavior. This is what happens:</p><ul><li>The primary generates an RDB file on the first synchronization with the replica.</li><li>The RDB file will not include keys already expired in the primary but which are still in memory.</li><li>These keys are still in the memory of the Valkey primary, even if logically expired. They\'ll be considered non-existent, and their memory will be reclaimed later, either incrementally or explicitly on access. While these keys are not logically part of the dataset, they are accounted for in the INFO output and in the DBSIZE command.</li><li>When the replica reads the RDB file generated by the primary, this set of keys will not be loaded.</li></ul><p>Because of this, it\'s common for users with many expired keys to see fewer keys in the replicas. However, logically, the primary and replica will have the same content.',
    categoryId: 'cat_4'
  }
];
