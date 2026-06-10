+++
title = "The secret life of data in Valkey"
date = 2026-06-10
description = "If you’ve used Valkey for very long you’re probably aware of the different primary core data types: string, hashes, lists, sets, sorted sets, and streams. What if that was all a lie."
authors = ["kyledvs"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-05.webp"
+++


If you’ve used Valkey for very long you’re probably aware of the different primary core data types: string, hashes, lists, sets, sorted sets, and streams. Each data type has an accompanying set of commands that manipulate that data type. For example, you use [`HSET`](/commands/hset/) to set a field and value pair to a hash, but you don’t use, for example, [`LPUSH`](/commands/lpush/) to add an element to a list. What if I told you that there is an entire hidden layer that you never see unless you use a specific `OBJECT` command and can’t control unless you start tinkering with the configuration? And that this could have a profound effect on your total usable storage: enough that misconfiguration could mean that you’re wasting much of your infrastructure?

## Engineering tradeoffs

Compact memory representation is highly important in Valkey: most users aren’t limited by performance but they are limited by the amount of memory available. When you’re representing data in RAM there often isn’t a clear winner for a technique that maximizes both performance and compactness at all data sizes. Like every engineering project, Valkey attempts to balance tradeoffs of performance and compactness.

In this case, the balance is achieved by an _encoding_. All data in Valkey has an encoding and this abstracts the actual in-memory representation from how it’s accessed (i.e. the commands used). Take the example of these three HSETs (assume an empty database):

```bash
> HSET hash0 field "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
> HSET hash1 field "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
> HSET hash2 field "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Casually, you might observe that each value is one character longer than the previous. However, what you probably don’t see is that despite the single character difference, the memory used changes dramatically. You can see it by running [`MEMORY USAGE`](/commands/memory-usage/) over each key:

| Key   | Length of value | `MEMORY USAGE` | Size difference than previous |
| ----- | --------------- | -------------- | ----------------------------- |
| `hash0` | 63 | 104 | n/a |
| `hash1` | 64 | 120 | +15.38% |
| `hash2` | 65 | 212 | +76.67% |

_Note:  Your numbers may vary slightly depending on platform and architecture_


So, between a value length of 64 and 65 what changed to account for over a 75% increase in memory usage? 

Take a look at the results of the [`OBJECT ENCODING`](/commands/object-encoding/) command for the keys in question:

```bash
> OBJECT ENCODING hash0
"listpack"
> OBJECT ENCODING hash1
"listpack"
> OBJECT ENCODING hash2
"hashtable"
```

The 'hashtable' result might be expected, after all you’re using a hash command, but what’s a 'listpack'? Describing the intricacies of the 'listpack' encoding isn’t the point of this post (see [the code](https://github.com/valkey-io/valkey/blob/unstable/src/listpack.c)), but rather understanding how you interact with data is abstracted from the actual way it’s stored, an encoding. Let’s explore something else:

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

In Valkey, the _data model_ is that of classical data structures but under-the-hood Valkey is making choices for you so you only need to worry about using the right commands for the data type and not caring about the underlying encoding. Instead, Valkey sorts out the difference between the data model and the encoding.

## Taking back control

With the exception of strings, which use hard-coded logic, encodings for each type are dictated by one or more configuration thresholds: anything at or below a threshold uses one encoding and anything above uses a different one. Take a look at the default configuration for the hash data type in Valkey 9.1:

```bash
hash-max-listpack-entries 512
hash-max-listpack-value 64
```

This means that any hash with all values less than or equal to 64 in length (`hash-max-listpack-value`) and have less than 512 field-value pairs (`hash-max-listpack-entries`) will be encoded as a 'listpack', everything else as a 'hashtable'. In the original example, key `hash2` had a length of 65, triggering an encoding of 'hashtable', which is much less compact accounting for the 76.67% increase in size. 

There are encoding configurations for:

- Hashes (`hash-max-listpack-entries`, `hash-max-listpack-value`)
- Lists (`list-max-listpack-size`)
- Sets (`set-max-intset-entries`, `set-max-listpack-entries`, `set-max-listpack-value`)
- Sorted Sets (`zset-max-listpack-entries`, `zset-max-listpack-value`)

Streams still use an encoding but there isn’t a threshold because there is only one encoding option. Module types also use encodings but it would vary depending on the logic and/or configuration of the module in question.

### Should you change these settings?

Maybe. It depends on what you’re optimizing for and what your data looks like. 

There are no-brainer situations: let’s say you store data in hashes and they tend to have values in length of 65 bytes, right above the threshold, and you have lower throughput needs. Upping the configuration value for `hash-max-listpack-value` to match a realistic length for your data could deliver a huge savings either by lowering the infrastructure requirements or [letting you cache more with the same cluster](https://www.youtube.com/watch?v=cd4-UnU8lWY). 

Contextualizing an extreme example: having a 100gb cluster (5 nodes, 20gb each) packed with 95% of the keys reaching 1 over the `hash-max-listpack-value`. 

|          | Cluster size | gb wrong-sized  | Wrong-sized key size            | Primary size | # of Primaries |
| -------- | ------------ | --------------- | ------------------------------- | ------------ | -------------- |
| Original | 100gb        | 95gb            |  212                            | 20gb        | 5              |
| New      | 58.58gb      | 0               |  120 <br /> (56.6% of original) | 2gb         | 3              |

So, you can take away two full primaries and whatever associated replicas. As previously mentioned, this is an extreme example, it's probably unlikely that you have 95% of your data falling outside this threshold. Let's say that you have 60% of your keys that reach above the wrong-sized configuration _and_ you can scale back your infrastructure to a smaller-sized machine or instance that has only 16gb of RAM.

|          | Cluster size | gb wrong-sized  | Wrong-sized key size            | Primary size | # of Primaries |
| -------- | ------------ | --------------- | ------------------------------- | ------------ | -------------- |
| Original | 100gb        | 60gb            |  212                            | 20gb         | 5              |
| New      | 74gb         | 0               |  120 <br /> (56.6% of original) | 14.8gb       | 5              |

The actual savings here depends on the difference in price for the new vs the old infrastructure, but typically in the cloud or on-prem, there are always break points in price at different specs and this sort of optimization can help you get your cost down when you needs just crest over the top of a breakpoint. Of course, in either case, you can always use the new-found space for heretofore uncache data, reduce eviction, or allowing longer TTLs.

> **Wait! How do both a 65 and 64 length value result in a key size of 120?** <br />
> The eagle-eyed amongst you might have noticed that the original example of `hash1` having a size of 64 and a memory footprint of 120 then in this example we're showing keys that have a value length of 65 that also have 120 bytes memory footprint. 
> How is that possible?
> The overhead for hashes with listpack encoding and various sized values isn't entirely linear, it's a stair step. Using the same key pattern and field name, a value length of 49 to 63 was 104 bytes and lengths 64 to 79 was 120 bytes.
> This explains why, in the original example, a length of 64 increased 15.38% over a length of 63 and yet the encoding was still the same.


All this comes back to understanding that these configurations aren't a silver bullet and throwing wildly higher or lower values at the encoding configuration could result in suboptimal performance or efficiency. YMMV.

## Tell your story

Did you save a bunch of RAM or opsmaxxing your throughput by tweaking a configuration in Valkey? [Share the knowledge by submitting an issue to write a blog](https://github.com/valkey-io/valkey-io.github.io/issues/new?template=blog_post_template.md) or write an abstract for the upcoming ValkeyConf.
