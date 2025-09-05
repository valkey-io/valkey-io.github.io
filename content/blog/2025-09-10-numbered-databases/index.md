+++
title= "Numbered “Databases” in Valkey 9.0"
description = "If you explore Valkey’s documentation you might run across a tantalizing feature called ‘numbered databases’ which allows you to separate the keyspace into (by default) 16 different databases. "
date= 2025-09-10 00:00:00
authors= [ "kyledvs"]

[extra]
featured = true
featured_image = "/blog/numbered-databases/images/move-db.drawio.png"
+++


If you explore Valkey’s documentation you might run across a tantalizing feature called ‘numbered databases’ which allows you to separate the keyspace into (by default) 16 different databases. This has been around for more than 15 years in the preceding project. But, also, if you’ve done more research on numbered databases in the past you might have heard a advice like “don’t use them,” “they don’t scale,” and “they’re a bad idea.” Well, the forthcoming Valkey 9.0 changes many things with numbered databases and you’ll see in this post that advice definitely needs some updating.

Today, a common way to conceptualize Valkey is that your keys represent a unique name for pointers to data in memory across a cluster of nodes. So, key `foo`  is unique and deterministically linked to a specific node and on that node there is a memory address where the value resides. However, this misses one key (🥁) part: the database number. The reality is that key names belong to a specific numbered database and *aren’t unique* on a given instance of Valkey. To put this another way, if you have 16 numbered databases, Valkey can have the key `foo` 16 times with each one pointing to different data.

Historically, when Valkey’s preceding project had the ability to cluster (before version 3.0.0), using multiple numbered database was fully supported. However, when clustering was implemented numbered databases weren’t included: a cluster had one database (DB 0) that spanned across the entire cluster. Why? I was personally involved with the community of the predecessor project and I think much of the discourse around number databases was lost to the sands of time, but there was a general feeling that users made wrong assumptions about numbered databases: then, and today, numbered databases do not provide any sort of multi-tenancy or resource isolation. To a degree, “database” is probably a bad name for this functionality: the  best way to think about numbered databases is more as a numbered *namespace* for your keys (hence the scare quotes around database in the title of this piece).

![one key, many databases](./images/numbered-db.drawio.png)

In a world where using numbered databases in your application locked you into never going beyond a single node, the early advice made sense, however Valkey 9.0 adds the ability to have numbered databases on a cluster, changing everything about that advice.

## Clustering and numbered databases

As mentioned earlier, the key name dictates where the key lives in the cluster and this doesn’t change for numbered databases. As a refresher, [Valkey clustering](https://valkey.io/topics/cluster-tutorial/) takes the key name as a string, runs that through a CRC-16 function, then does a modulo of 16,384 which determines the ‘slot’. Each of these slots belong to a node in the cluster. For a numbered database, each slot contains all the numbered databases, so, carrying forward the idea that you can have the same key name in each database on a single instance, in Valkey 9.0 you can have the same key multiple times in a given slot, each in their own database. In other words, numbered databases do not affect clustering: the key is still the determinate factor in calculating slots.

You can see this directly with [`CLUSTER KEYSLOT`](https://valkey.io/commands/cluster-keyslot/) and [`SELECT`](https://valkey.io/commands/select/). Take the following example:

```
> SELECT 0
OK
> SET somekey hi
OK
> CLUSTER KEYSLOT somekey
(integer) 11058
> SELECT 5
OK
> SET somekey hello
OK
> CLUSTER KEYSLOT somekey
(integer) 11058
```

Here the key `somekey` was set to two different values: ‘hi’ on database 0, and ‘hello’ on database 5, with `SELECT` altering the selected database. `CLUSTER KEYSLOT` was called twice: each one yielding the same slot number meaning this key will be assigned to the same node in the cluster, no matter which database is selected.

Keep in mind that numbered databases cary the same clustering properties as other commands: operations that needs to span the entire keyspace will to be run on each node: 

* [`FLUSHDB`](https://valkey.io/commands/flushdb/) will flush the keys in the current database *on the connected node*
* [`SCAN`](https://valkey.io/commands/scan/) will iteratively return keys in the current database *on the connected node.*
* [`DBSIZE`](https://valkey.io/commands/dbsize/) will return the number of keys in the current database *on the connected node.*

You get the picture: if something previously said it did something for the entire database, in cluster mode it really means for the connected node’s portion of the database.

## Where to use numbered databases

Numbered databases have many uses. The first thing that people often want to do is to run different applications on the same cluster. This *can* work out fine, but keep in mind that, even in Valkey 9, you’re only really namespacing - there is no  resource isolation between databases. So, a busy application on database 0 will affect the performance of an application on another database.

A similar use case would be running multiple instances of the *same* application on different databases. This might be a more compelling use case: multiple databases avoid any clashes in the key names and you’ll likely have a handle on resources required for each instance of an application when compared to different applications. However, same deal, there is no resource isolation.

In both of these cases, you might have previously solved the problem with key prefixing (e.g. `app0:foo` and `app1:foo`) but numbered databases make your keys smaller (which equates to memory savings, especially with many keys), allows you to do some management steps easier (clear out an application with `FLUSHDB`  on each node instead of an iterative delete by pattern on each node), and you don’t need to have key prefixing logic built into you application.

An entirely different use of numbered databases is related to the [`MOVE`](https://valkey.io/commands/move/) command. `MOVE` allows you to change a key from one database to another *without copying the data,* meaning it uses very little resources and it’s an `O(1)` operation. This allows a couple of things: 1) you can effectively make data inaccessible from a database whilst keeping it on the same cluster node, and 2) you can replace a complex key atomically.

Looking at the first use of `MOVE`: imagine you have some content, maybe a user submitted post, that is stored at the key “mycontent.” At some point this content gets flagged as needing to be reviewed. You might not want to *delete* this content but you also don’t want it accessible. In this case you take the content and `MOVE` it to a different database. Once it’s reviewed (or edited!) you can `MOVE` it back. Never does the data actually leave the node nor get copied. Whilst your use-case might not be the same as this, the pattern illustrates an operation useful in a variety of contexts.

![now you see me, now you don't](./images/move-db.drawio.png)

The second use of `MOVE` is similar to the first except it revolves around complex keys that contain many elements. Take, for example, a large sorted set. It’s not unusual for these keys to be quite large because the key contains thousands or millions of smaller elements. If you need to replace this key with one that contains different elements then you’d have to first `DEL` the original key, then `ZADD` thousands of elements. Doing this in a transaction would be expensive and monopolize the node, and without a transaction, it would reveal a (potentially undesirable) partial state. Instead, with multiple databases, you build up new a complex key on a different database (under no urgency) and do a much simpler `MULTI` / `EXEC` transaction of of `DEL` followed by `MOVE` to atomically make the new complex key available to the database being used to serve commands without the chance of a partial state.

![show me it when its done](./images/zadd-move.drawio.png)

Finally, multiple databases are a useful debugging tool. When you’re building an application it can be difficult to see what happens inside Valkey when you make a change. If you have multiple databases you can run your original code on one database and the changed version on a different database then you can more easily see changes in how data looks in Valkey by just swapping between databases. While this is likely the least obvious use case and certainly not one that is relevant for production workloads, just saves complexity around having multiple clusters with potentially different configurations or having to stop/start your database.

## Gotchas and future work

Aside from the aforementioned lack of resource isolation, numbered databases in clustered Valkey have a few places that you need to look out for today. First, right now numbered databases don’t have dedicated metrics, so it can be hard to gain insights into per-database resource usage. Second, the ACL system doesn’t address numbered databases, so you can’t meaningfully restrict access to databases. Finally, while numbered databases are well supported in client libraries there are rough edges:

* Some client libraries artificially restrict usage to a single database in cluster mode.
* Pooled clients may naively manage the selected database, so a client returned to the pool after running SELECT might retain the database number in subsequent usage. A similar situation is possible for multiplexed clients.

In general, watch out for three assumptions: 1) the selected database is always 0, 2) their is only one database in cluster mode, and 3) if there is multiple databases in use it isn’t in cluster mode. None of these are true in Valkey 9.0.

With this in mind, Valkey 9.0 gives you the ability to divvy up that keyspace into nice neat numbered databases and spread them out over a whatever cluster you have. So, get rid of that old, outdated advice and start using them, seeing how they scale, and what a good idea number databases actually are for Valkey 9.0.
