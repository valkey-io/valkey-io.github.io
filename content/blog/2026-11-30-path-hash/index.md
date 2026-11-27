+++
title = "Inside, around, and through Path Hash"
date = 2026-11-30
description = "Before 9.2's Path Hash it had years since the last new core data type, but what does it actually do?"
authors = ["kyledvs"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-05.webp"
+++

Valkey 9.2 introduced the Path Hash data type into the core.
Before 9.2, the last new data type added to the core was Streams and that was introduced over nine years ago.
While we’ve certainly seen new data types come from add-on modules and the core introducing new commands to existing data types, Path Hash is built-in for everyone using Valkey 9.2.
With the significance out of the way, what does Path Hash actually do and how can you use it?

## A general purpose data type

The path hash name says quite a bit.
It’s a compound data type where a single key holds a collection of binary-safe identifiers, called paths, with each path containing a series of _fields_ and _values_, much like the hash data type.

As you might suspect, since we have the hash data type already, the secret sauce to this data type lies in the path portion.
The path is both a specific identifier for a particular series of field/value pairs but can easily and efficiently address paths with a common prefix.

To make this more concrete, let’s think about an example of animals.

```shell
> ECHO "Start with an empty key"
"Start with an empty key"
> DEL animals
0
> PHSET animals pets FIELDS 1 responsible person
OK
> PHGETALL animals pets
1) "responsible"
2) "person"
```

The `PHSET` command created the key `animals` with a single field called `responsible` and a value of "person" and a path of "pets".
Using PHGETALL we can see those fields and values (interleaved) back.
So far: boring.
However, if you add more data, things get less boring.

```shell
> PHSET animals pets-cats FIELDS 1 legs 4
OK
> PHSET animals pets-cats-domestic FIELDS 1 temperament affectionate
OK
> PHSET animals pets-cats-exotic FIELDS 1 temperament unpredictable
OK
> PHPREFIXES animals pets-cats-domestic WITHVALUES
1) 1) "pets"
   2) 1) "responsible"
      2) "person"
2) 1) "pets-cats"
   2) 1) "legs"
      2) "4"
3) 1) "pets-cats-domestic"
   2) 1) "temperament"
      2) "affectionate"
```

The example above shows three more paths to `animals` with `PHSET` then the command `PHPREFIXES` on the same key with a query argument set to `pets-cats-domestic` and the flag `WITHVALUES` added.
The results show the path, fields and value for pets, pets-cats and pets-cats-domestic, but not pets-cats-exotic.
At first glance you might assume that the `-` are somehow relevant or that there is something else special is going on here, but the prefix is an exact match and the `-` 's are treated by Valkey as just another byte.
Moreover, paths do not even need to exist to find matching prefixes:

```shell
> PHEXISTS animals pets-cats-domestic
(integer) 1
> PHEXISTS animals pets-cats-domestic-sphynx
(integer) 0
> PHPREFIXES animals pets-cats-domestic-sphynx
1) "pets"
2) "pets-cats"
3) "pets-cats-domestic"
```

First you can see that `PHEXIST` shows that `pets-cats-domestic` is in animals but that `pets-cats-domestic-sphynx` is not, however, when searching for `pets-cats-domestic-sphynx` it shows paths that have some common prefix with animals `pets-cats-domestic-sphynx` (and, this time, without the values).
This, dear reader, is the secret sauce of Path Hash.
You’d be challenged to do anything like this with existing data types in Valkey.

Path Hash has a few other interesting party tricks.
First, you can find the longest match under an arbitrary path.
Take this example:

```shell
> PHLONGEST animals pets-cats-domestic-sphynx-mr-bigglesworth
"pets-cats-domestic"
```

This returns only the longest match to the path without returning values or intermediary matches.

## Internals

At the top of this post, I mentioned Streams.
These two data types are not only connected by their sequence of introduction to the core, but they are related as data structures.
The Streams data type was designed around the use case of stream processing: producers creating messages, coded as a series of field/value pairs at a time/sequence-based ID, and consumers processing those messages somehow.
However, under-the-hood, streams are encoded as a [radix tree](https://en.wikipedia.org/wiki/Radix_tree): each message is a node with pointers to the field/value pairs.
Radix trees are sometimes alternately called a compact prefix tree.
In the streams data type, the prefix is leveraged over time-based IDs, allowing for relatively efficient bounding of retrieval of sequence of IDs: so, for example, “give me all the messages that occurred between two timestamps” is an `O(N)` operation with `XRANGE`.

Path hash is also based on the radix tree data structure and indeed even shares some of the same code ('rax').
However, instead of a time/sequence-based ID, the radix tree stores the path alongside the pointer to the fields/values.
Instead of using the prefix for addressing a range of messages as in Streams, Path Hash uses the path to get the ancestors of a longer path.
Additionally, a good portion of the complexity of the Streams data type comes from the metadata (for things like acknowledgement, claiming, consumer groups, etc.); conversely, the Path Hash doesn’t require this so it’s not included.
Because of all this, streams and Path Hash are encoded differently (i.e. `OBJECT ENCODING` yields ‘pathhash’ and ‘stream’ respectively).

## Paterns, data modelling, and use-cases

Path hash was initially designed to address a problem in **KV caching** use-cases (KV caching is somewhat confusingly named since “KV” is an initialism for ‘key-value’ which is the entire category which Valkey belongs to).
When used in this context, ‘KV caching’ refers to a type of memoization used in LLM inference where tokens already computed are stored in the cache to prevent re-calculation for subsequent tokens.
LLMs generate text by using previous sequences of tokens to generate the next token, but they do this on every single new token.
So, without caching, each new token requires expensive re-computation all the previous tokens in the sequence of generated output.
[HuggingFace has an approachable writeup on KV caching](https://huggingface.co/blog/not-lain/kv-caching) that does goes into more depth on the subject.

With Path Hash, tokens are stored at a path and the subsequent token is stored in a descendant path.
So, you can quickly retrieve the tokens with PHPREFIXES by just having the very last one.
Since this is something that occurs during LLM inference with binary data, it’s a little challenging to show how it looks in a blog post but consider this high-level example:

* You are generating a 50 token response.
* Say, each token takes 10ms to compute.
* You can store or retrieve the pre-computed token from Valkey at 1ms
* Without any sort of KV Caching, it would take 9.5 seconds to generate the 50 token response.
    * The first token would be re-computed 50x (500ms or 5.2% of the total compute time), second token would be re-computed 49x  (490ms or 5.1% of the total compute time), and so on.
    * The last three tokens would only be computed 3x, 2x, and 1x respectively and these are consequently a trivial percent of the total compute time.
* You can store the tokens ergonomically and efficiently using `PHSET` with each token in order being represented as a prefix of the subsequent token (so, `t1`, `t2`, and so standing on in for real values, the second `PHSET my-response t1-t2 FIELDS ...`).
Then you can retrieve the value with `PHPREFIXES my-response t1-t2-t3-t4...` to skip over the computation stage for all the stored values.
Because this is a standard key in Valkey, you can also add a TTL to dispose of data as needed.
* By caching the first 10 tokens, you can take the response time down by about 47% from 9.5 seconds to less than 5 seconds.
And, the longer the generated response the higher the impact of using Path Hash.

As mentioned above, however, Path Hash isn’t a single-purpose data structure.
So, like other structures in Valkey (strings, sets, lists, sorted sets, etc.), it will find lots of use cases when it’s in the hand of talented application developers, reaching far beyond the imagination of the originator the data type.
Below are more possibilites.

### Way finding
Imagine plotting a route between two locations with multiple branching possibilities.
While classical algorithms (like Dijkstra's) solve the static problem well, but adding in constantly changing external data like route conditions piles on complexity and latency that could benefit from caching.
If you use Path Hash, re-calculating routes or alternate paths the data needs to be stored only once and retrieved from multiple branching prefixes.
Here we have a route with each road as well as traffic and/or toll information.

```shell
> PHSET frau-farbissina-route a9 FIELDS 2 traffic 10 toll 1.35
OK
> PHSET frau-farbissina-route a9-e45 FIELDS 1 traffic 5
OK
> PHSET frau-farbissina-route a9-e45-a7 FIELDS 2 traffic 4 toll 0.85
OK
> PHSET frau-farbissina-route a9-e45-a7-b3 FIELDS 1 traffic 1
OK
> PHPREFIXES frau-farbissina-route a9-e45-a7-b3 WITHVALUES
1) 1) "a9"
   2) 1) "traffic"
      2) "10"
      3) "toll"
      4) "1.35"
2) 1) "a9-e45"
   2) 1) "traffic"
      2) "5"
3) 1) "a9-e45-a7"
   2) 1) "traffic"
      2) "4"
      3) "toll"
      4) "0.85"
4) 1) "a9-e45-a7-b3"
   2) 1) "traffic"
      2) "1"
```

That’s all fine and good, but let’s say while travelling on the `e45`, the `a7`, the traffic gets worse and the traffic report API value goes from a value of `4` to `50`.

```shell
> PHSET frau-farbissina-route a9-e45-a7 FIELDS 1 traffic 50
OK
> PHPREFIXES frau-farbissina-route a9-e45-a7-b3 WITHVALUES
1) 1) "a9"
   2) 1) "traffic"
      2) "10"
      3) "toll"
      4) "1.35"
2) 1) "a9-e45"
   2) 1) "traffic"
      2) "5"
3) 1) "a9-e45-a7"
   2) 1) "traffic"
      2) "50"
      3) "toll"
      4) "0.85"
4) 1) "a9-e45-a7-b3"
   2) 1) "traffic"
      2) "1"
```

You can do an alternate plan avoiding the a7 by going an alternate route via another two roads: `a27` and the `a4`.
Note how the prefixes do not to need to arrive in order.

```shell
> PHSET frau-farbissina-route a9-e45-a27-e4 FIELDS 1 traffic 7
OK
> PHSET frau-farbissina-route a9-e45-a27 FIELDS 1 traffic 3
OK
> PHPREFIXES frau-farbissina-route a9-e45-a27-e4 WITHVALUES
1) 1) "a9"
   2) 1) "traffic"
      2) "10"
      3) "toll"
      4) "1.35"
2) 1) "a9-e45"
   2) 1) "traffic"
      2) "5"
3) 1) "a9-e45-a27"
   2) 1) "traffic"
      2) "3"
4) 1) "a9-e45-a27-e4"
   2) 1) "traffic"
      2) "7"
```

A new route that inherited the first couple of sets of fields without any extra work from the developer.
While way finding itself might not have direct utility to you, there are all sorts of similar problems in routing that can benefit from the properties of path hash.

### Hierarchical resource authorization

A common situation is that resource authorizations are descended from a common place.
So, for example, all the employees who report through the CFO have access to a common set of resources but those in payroll vs investor relations each have their own specific items.
In this case, each users gets their structure as a path:

```shell
> PHSET authorization cfo FIELDS 1 internal-finance-docs 1
OK
> PHSET authorization cfo-payroll FIELDS 1 pay-cheque-ledger 1
OK
> PHSET authorization cfo-payroll-sally-smith FIELDS 1 sally-smith-personal 1
OK
> PHSET authorization cfo-investor-relations FIELDS 1 merger-docs 1
OK
> PHPREFIXES authorization cfo-payroll-sally-smith WITHVALUES
1) 1) "cfo"
   2) 1) "internal-finance-docs"
      2) "1"
2) 1) "cfo-payroll"
   2) 1) "pay-cheque-ledger"
      2) "1"
3) 1) "cfo-payroll-sally-smith"
   2) 1) "sally-smith-personal"
      2) "1"
> PHPREFIXES authorization cfo-investorrelations-vanessa-kensington WITHVALUES
1) 1) "cfo"
   2) 1) "internal-finance-docs"
      2) "1"
2) 1) "cfo-investorrelations"
   2) 1) "merger-docs"
      2) "1"
```

If you notice that there is no explicit path for `cfo-investorrelations-vanessa-kensington` and yet the prefixing allows the path to inherit non-explicit access to resources `internal-finance-docs` and `merger-docs`. Neat!

This is just one way you can leverage a path-as-hierarchy: imagine a team in a game where every player on the team gets a penalty or advantage along side individual player advantages or penalties: this and may more are the same basic hierarchical modelling problem solved with Path Hash.

### Threaded discussions

In a situation where you have a series of messages, sometimes you want to have a reply that only replies to one message, not the entire series.
While a level or two deep is easy to model, a reply-to-a-reply-to-a-reply (ad infinitum) is complicated.

First, a topic is under one key with the topic and message-count as fields.
Then, add the first message under the topic.

```shell
> PHMSET my-topic metadata FIELDS 2 topic "Plans" message-count 1
OK
> PHSET my-topic m-001 FIELDS 2 user austin message "lorem ipsum"
OK
```

When an additional message is added, you’ll need to increase the `message-count` by 1 and add the new message.

```shell
> PHSET my-topic metadata FIELDS 1 message-count 2
OK
> PHSET my-topic m-002 FIELDS 2 user dr-evil message "dolor-sit-amet"
OK
```

Getting the list of first level replies would look like this:

```shell
> PHMGET my-topic m-001 FIELDS 2 message user m-002 FIELDS 2 message user
1) "lorem ipsum"
2) "austin"
3) "dolor-sit-amet"
4) "dr-evil"
```

Let’s say the second message (`m-002`) gets a reply and that reply gets another reply.

```shell
> PHSET my-topic m-002 FIELDS 1 reply-count 1
OK
> PHSET my-topic m-002-001 FIELDS 2 user austin message "sed do eiusmod tempor"
OK
> ECHO "another reply"
"another reply"
```

Now, if you wanted to render a reply thread, it would look like:

```shell
> PHPREFIXES my-topic m-002-001-001 WITHVALUES
1) 1) "m-002"
   2) 1) "user"
      2) "dr-evil"
      3) "message"
      4) "dolor-sit-amet"
      5) "reply-count"
      6) "1"
2) 1) "m-002-001"
   2) 1) "user"
      2) "austin"
      3) "message"
      4) "sed do eiusmod tempor"
      5) "reply-count"
      6) "1"
3) 1) "m-002-001-001"
   2) 1) "user"
      2) "mr-bigglesworth"
      3) "message"
      4) "meow"
```

What’s nice about this modelling is that everything stays under one key, so it scales and shards nicely.
Keep in mind, however, that since path hash currently lacks anything like `INCR` or `HINCRBY`, it would require a Lua script to atomically increment any values like `reply-count`.

## The _path_ forward

This post only touches on the possibilities of the new data type.
Be sure to read the documentation and understand the full API.
As with any brand-new feature, it’s possible that the data type or its API is missing aspects that make it the right choice for your specific use-case: if you find something that is missing (or working in an unexpected way) be sure to create an issue: Valkey is open source so contributions, in the form of feedback, issues, or code, are valued.
