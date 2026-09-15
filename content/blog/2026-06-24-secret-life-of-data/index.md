+++
title = "The secret life of data in Valkey"
date = 2026-07-21
description = "If you’ve used Valkey for very long you’re probably well aware of the different data types, however what lies under the surface of these types could be the missing piece of your cost optimization strategy."
authors = ["kyledvs"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-05.webp"
+++


If you’ve used Valkey for very long you’re probably aware of the different primary data types in the core: strings, hashes, lists, sets, sorted sets, and streams. Each data type has an accompanying set of commands that manipulate that data type. For example, you use [`HSET`](/commands/hset/) to set a field and value pair to a hash, but you don’t use, for example, HSET to add an element to a list. What if I told you that there is an entire hidden layer that you never see unless you use a specific `OBJECT` command and can’t control unless you start tinkering with the configuration? And that this could have a profound effect on your total usable storage: enough that careful configuring could mean significant savings in your infrastructure. Read on to find out how you can understand and tweak the _real_ underlying structures.  

## Engineering tradeoffs

Compact memory representation is highly important in Valkey: most users aren’t limited by performance but they are limited by the amount of memory available. When you’re representing data in RAM there often isn’t a clear winner for a technique that maximizes both performance and compactness at all data sizes. Like every engineering project, Valkey attempts to balance tradeoffs of performance and compactness.

In this case, the balance is achieved by an _encoding_. All data in Valkey has an encoding, and this abstracts the actual in-memory representation from how it’s accessed (i.e. the commands used). Take the example of these three HSETs (assume an empty database):

```bash
> HSET hash0 field "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
> HSET hash1 field "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
> HSET hash2 field "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

At first glance you might observe that each value is one character longer than the previous. However, what you probably don’t see is that despite the single character difference, the memory used changes dramatically. You can see it by running [`MEMORY USAGE`](/commands/memory-usage/) over each key:

| Key   | Length of value | `MEMORY USAGE` | Change from previous |
| ----- | --------------- | -------------- | ----------------------------- |
| `hash0` | 63 | 104 | n/a |
| `hash1` | 64 | 120 | +15.38% |
| `hash2` | 65 | 212 | +76.67% |

_Note:  Your numbers may vary slightly depending on platform and architecture_


So, between a value length of 64 and 65 bytes, what changed to account for over a 75% increase in memory usage?

Take a look at the results of the [`OBJECT ENCODING`](/commands/object-encoding/) command for the keys in question:

```bash
> OBJECT ENCODING hash0
"listpack"
> OBJECT ENCODING hash1
"listpack"
> OBJECT ENCODING hash2
"hashtable"
```

The 'hashtable' result might be expected, after all you’re using a hash command, but what’s a 'listpack'? 
A listpack is a memory-efficient data structure that stores elements sequentially in a single contiguous chunk of memory. When the data stored is not very large, it saves memory by minimizing the overhead of pointers.  Don't worry about the intricacies of 'listpack' encoding though, the point is understanding how you interact with data is abstracted from the actual way it’s stored: an encoding (see [the code](https://github.com/valkey-io/valkey/blob/unstable/src/listpack.c) for a deep dive on listpacks, if you're really interested). 

Let’s explore something else:

```bash
> LPUSH list1 foo
(integer) 1
> OBJECT ENCODING list1
"listpack"
> SADD set1 "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
(integer) 1
> OBJECT ENCODING set1
"hashtable"
```


So, we have a list key using the same encoding as a hash and a set encoded as a hashtable. [Dogs and cats living together](https://www.youtube.com/watch?v=-9NMt42il4Q): what is going on? Conventional wisdom is that Valkey stores data using the classical data structures like hash tables, linked lists, and sets based on the commands you use. 

Turns out: no.

While Valkey presents a _data model_ based on classical data structures, it makes optimization decisions under the hood. This allows you to use the appropriate commands for your data type without needing to worry about how that data is stored in memory. Valkey automatically manages the mapping between the data model and the encoding.

## Taking back control

Except for strings, which use hard-coded logic, encodings for other data types are dictated by one or more configuration thresholds: values at or below a threshold use one encoding, while values exceeding it use another. For example, consider the default configuration for the hash data type in [Valkey 9.1](https://github.com/valkey-io/valkey/releases/tag/9.1.0):

```bash
hash-max-listpack-entries 512
hash-max-listpack-value 64
```

This means that a hash is encoded as a `listpack` if all its values are at most 64 bytes long (`hash-max-listpack-value`) and it contains fewer than 512 field-value pairs (`hash-max-listpack-entries`). If either threshold is exceeded, Valkey uses a `hashtable` encoding. In the original example, the value in `hash2` was 65 bytes long, triggering a transition to the `hashtable` encoding, which is significantly less compact and accounts for the 76.67% increase in memory usage.

There are encoding configurations for:

- Hashes (`hash-max-listpack-entries`, `hash-max-listpack-value`)
- Lists (`list-max-listpack-size`)
- Sets (`set-max-intset-entries`, `set-max-listpack-entries`, `set-max-listpack-value`)
- Sorted Sets (`zset-max-listpack-entries`, `zset-max-listpack-value`)

Streams also use encodings, but they do not have configuration thresholds because they use a single encoding. Module types also use encodings, but their behavior depends on the specific module's logic and configuration.

### Should you change these settings?

Maybe. It depends on what you’re optimizing for and what your data looks like. Valkey's default encoding configurations are suitable for many use cases, but if your strategy is to cost-optimize or maximize infrastructure efficiency, it's worth evaluating these settings against your specific data patterns and usage.

For the most basic evaluation, you can sample keys using `OBJECT ENCODING` to identify spots where the data is using the more voluminous encoding, then understand what is triggering it and make a call on the configuration. Of course, there are no-brainer situations: let’s say you store data in hashes and they tend to have values in length of 65 bytes, right above the threshold, and you have lower throughput needs. Upping the configuration value for `hash-max-listpack-value` to match a realistic length for your data could deliver huge savings either by lowering the infrastructure requirements or [letting you cache more with the same cluster](https://www.youtube.com/watch?v=cd4-UnU8lWY). 

Contextualizing an extreme example: having a 100gb cluster (5 nodes, 20gb each) packed with 95% of the keys reaching 1 over the `hash-max-listpack-value`. 

|          | Cluster Size | GB Over Threshold | Memory Usage per Key    | Primary Node Size | # of Primaries |
| -------- | ------------ | ----------------- | ------------------------------- | ----------------- | -------------- |
| Original | 100 GB       | 95 GB             |  212 B                            | 20 GB             | 5              |
| New      | 58.8 GB      | 0                 |  120 B <br /> (56.6% of original) | 20 GB             | 3              |

So, you can take away two full primaries and whatever associated replicas. As previously mentioned, this is an extreme example, it's unlikely that you have 95% of your data falling outside this threshold. Let's say that you have 60% of your keys that reach above configuration threshold _and_ you can scale back your infrastructure to a smaller-sized machine or instance that has only 16gb of RAM.

|          | Cluster Size | GB Above Threshold | Memory Usage per Key    | Primary Node Size | # of Primaries |
| -------- | ------------ | ------------------ | ------------------------------- | ----------------- | -------------- |
| Original | 100 GB       | 60 GB              |  212 B                            | 20 GB             | 5              |
| New      | 74 GB        | 0                  |  120 B <br /> (56.6% of original) | 14.8 GB           | 5              |```

The actual savings depend on the price difference between the new and old infrastructure. In both cloud and on-premises environments, pricing often has distinct breakpoints based on hardware specifications. This optimization can help you drop below a higher pricing tier if you were previously just cresting over it. Alternatively, you can use the reclaimed space to cache previously uncached data, reduce evictions, or allow longer TTLs.

> **Wait! How do both a 65 and 64 length value result in a key size of 120?** <br />
> The eagle-eyed amongst you might have noticed that the original example of `hash1` having a size of 64 bytes and a memory footprint of 120 then in this example we're showing keys that have a value length of 65 that also have 120 bytes memory footprint. 
> How is that possible?
> The overhead for hashes with listpack encoding and various sized values isn't entirely linear, it's a stair step. Using the same key pattern and field name, a value length of 49 to 63 was 104 bytes and lengths 64 to 79 was 120 bytes.
> This explains why, in the original example, a length of 64 increased 15.38% over a length of 63 and yet the encoding was still the same.

All this comes back to understanding that these configurations aren't a silver bullet and throwing wildly higher or lower values at the encoding configuration could result in suboptimal performance or efficiency. YMMV: knowing your data types, sizes, and usage patterns, and (now) how encoding works in Valkey you have the tools to hone your configuration appropriately.

## Tell your story

Did you save RAM or maximize your throughput by tweaking a configuration in Valkey? [Share the knowledge by opening an issue to propose a blog post](https://github.com/valkey-io/valkey-io.github.io/issues/new?template=blog_post_template.md) or submitting a presentation abstract for the upcoming [ValkeyConf](https://events.linuxfoundation.org/valkeyconf/).
