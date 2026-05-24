---
title: "History"
description: How the Valkey project started
---

Valkey is a fork of the open-source Redis (REmote DIctionary Server) database
created in 2009 by the Italian hacker Salvatore “antirez” Sanfilippo. He
announced it on [Hacker News][hn] on Feb 25, 2009. [GitHub][gh] and
[Instagram][insta] were among the early adopters.

[hn]: https://news.ycombinator.com/item?id=494649
[gh]: https://github.blog/2009-11-03-introducing-resque/
[insta]: https://instagram-engineering.com/storing-hundreds-of-millions-of-simple-key-value-pairs-in-redis-1091ae80f74c

Early works of Salvatore Sanfilippo
-----------------------------------

At the time, Salvatore “antirez” was already known for inventing the [Idle
scan][idle-scan] port scanning technique, the [Hping][hping] TCP/IP packet
generator and analyzer, the [Jim] TCL interpreter and the [LLOOGG][lloogg]
real-time log analyzer. To improve it, he created an in-memory database called
called [LLOOGG Memory DB][lmdb], which was a proof-of-concept of what later
became Redis and Valkey.

[idle-scan]: https://en.wikipedia.org/wiki/Idle_scan
[hping]: https://en.wikipedia.org/wiki/Hping
[jim]: https://jim.tcl-lang.org/index.html/doc/www/www/about/
[lloogg]: https://github.com/antirez/lloogg/blob/master/README.md
[lmdb]: https://gist.github.com/antirez/6ca04dd191bdb82aad9fb241013e88a8

Early contributions and sponsorships
------------------------------------

During 2009, Engine Yard contributed blocking POP (BLPOP) and part of the
Virtual Memory implementation (later deleted), Hitmeister contributed part of
the Cluster implementation and Citrusbyte contributed part of Virtual Memory
implementation. In 2010, Slicehost (acquired by Rackspace) provided Virtual
Machines for testing in a virtualized environment and Linode provided virtual
machines for testing in a virtualized environment. Also thanks to the following
people or organizations that donated to the Project: Emil Vladev, [Brad
Jasper](https://bradjasper.com/) and [Mrkris](http://mrkris.com/). The
[Shuttleworth Foundation](https://en.wikipedia.org/wiki/Shuttleworth_Foundation)
donated 5000 USD to the project in form of a flash grant.

Pieter Noordhuis and Matt Stancliff provided a significant amount of code and
ideas to the core and client libraries.

The time with VMware
--------------------

In March, 2010, Sanfilippo was hired by [VMware](https://vmware.com) to work on
Redis and Redis Tools. In his blog post [VMware: the new Redis
home][antirez-vmware], he writes:

[antirez-vmware]: https://web.archive.org/web/20241017012850/http://oldblog.antirez.com/post/vmware-the-new-redis-home.html

> Not only Redis will remain a totally open source project, but Redis Tools will
> be open sourced also (and this was an idea I got from VMware itself!).
>
> This is why I'm truly excited about joining VMware: together we'll build a
> better, free Redis, bringing Redis development to another level.

VMware, and later Pivotal (a VMware spin-off), provided a 24 GB RAM workstation
for Salvatore to run the Redis CI test and other long running tests. Later,
Salvatore equipped the server with an SSD drive in order to test in the same
hardware with rotating and flash drives. VMware sponsored the project until May
2013, with the work of Salvatore Sanfilippo and Pieter Noordhuis. From May 2013
to June 2015, Salvatore's work was sponsored by Pivotal.

The Redis Labs era
------------------

In 2011, a company called Garantia Data was founded and started providing
database services based on Redis. In 2013, Garantia Data was changing its name
to RedisDB, but [decided to withdraw the change][redisdb] after complaints by
Sanfilippo:

[redisdb]: https://www.forbes.com/sites/benkepes/2013/11/04/was-garantia-is-now-redisdb-either-way-nosql-is-hot/

> If this is true, it is not a good thing as the current informal rule was: use
> "Redis" in company names that are selling Redis services, but in a way that
> makes it distinguishable from Redis as a project. There are many examples like
> OpenRedis, RedisToGo, and so forth. However "RedisDB" is different as it is
> more like "We are Redis", (I even own the "redis-db.com" domain name since
> 2009! you can WHOIS it to check). So in my opinion calling the company
> "RedisDB" is wrong, especially since I and Garantia Data from time to time
> have friendly conversations as we are both part of the "Redis ecosystem", but
> I did not received any prior question about this issue.

The following year, 2014, Garantia Data [changed its name to Redis Labs][redislabs].

[redislabs]: https://techcrunch.com/2014/01/29/database-provider-garantia-data-makes-another-name-change-this-time-to-redis-labs/

In 2015, Salvatore left Pivotal for Redis Labs. He writes in his blog post
[Thanks Pivotal, Hello Redis Labs](https://web.archive.org/web/20241123010805/http://antirez.com/news/91):

> Redis Labs was willing to continue what VMware and Pivotal started. I'll be
> able to work as I do currently, spending all my time in the open source side
> of the project, while Redis Labs continues to provide Redis users with an
> hassles-free Redis experience of managed instances and products.

In 2018, Redis Labs changed the license of some of its modules from AGPL to a
source-available license. The license prevents competing cloud providers from
offering these modules to customers and does therefore not fulfill the criteria
for an open source license.

This was interpreted by some as if Redis is no longer open source. Sanfilippo
clarified on his blog [Redis will remain BSD licensed][antirez-remain-bsd].

Yiftach Shoolman, CTO and co-founder of Redis Labs, also clarified in in the
company's blog that [Redis' License is BSD and will remain
BSD][will-remain-bsd]. He repeated this promise in [a comment on Hacker
News][hn-always-bsd], writing “let me assure you that Redis remains and always
will remain, open source, BSD license”.

[antirez-remain-bsd]: https://web.archive.org/web/20241111062719/http://antirez.com/news/120
[will-remain-bsd]: https://redis.io/blog/redis-license-bsd-will-remain-bsd/
[hn-always-bsd]: https://news.ycombinator.com/item?id=17819392

In 2020, Salvatore Sanfilippo announced in his blog post [The end of the Redis
adventure](https://web.archive.org/web/20241123005834/http://antirez.com/news/133) that he was stepping back as the Redis
maintainer, handing over the maintenance to Yossi Gottlieb and Oran Agra at
Redis Labs. The two created a “core team” to maintain the project and invited
Itamar Haber from Redis Labs, Zhao Zhao from Alibaba and Madelyn Olson from
Amazon. The members were selected “based on demonstrated, long-term personal
involvement and contributions”. This was described in the projects
[Governance][governance-2020] page which was the inspiration for the current
[Valkey governance][valkey-governance].

[governance-2020]: https://web.archive.org/web/20200709170526/https://redis.io/topics/governance
[valkey-governance]: https://github.com/valkey-io/valkey/blob/unstable/GOVERNANCE.md

In 2021, the Redis Labs changed its name to Redis Ltd. or just Redis. In this
article, we're using the name Redis Ltd. when referring to the company to avoid
confusion. By this time, Redis Ltd. had acquired the trademark rights to the
name Redis and the logo from Sanfilippo.

The end of open source Redis
----------------------------

In 2024, Redis Ltd. changed the license of Redis from the open source BSD
license to dual source-available licenses. This was announced in a blog post
[Redis Adopts Dual Source-Available Licensing][redis-source-avail] and the
license change was [committed to the repository][change-license-pr] the same day.

[redis-source-avail]: https://redis.io/blog/redis-adopts-dual-source-available-licensing/
[change-license-pr]: https://github.com/redis/redis/pull/13157

Neither of the licenses, Redis Source Available License (RSALv2) nor the Server
Side Public License (SSPLv1), are open source licenses, as neither meet the
criteria of an open source license.

RSALv2 forbids the use of the software in database products, to prevent their
competitors from providing database products and services. Such a restriction is
not in line with [The Open Source Definition][osd], criterion #6 “The license
must not restrict anyone from making use of the program in a specific field of
endeavor” by the Open Source Initiative, nor “the freedom to run the program as
you wish, for any purpose (freedom 0)” in the Free Software Foundation's
definition of Free Software. The SSPL has similar restrictions, explained in the
[SSPL article on Wikipedia][sspl].

[osd]: https://opensource.org/osd
[sspl]: https://en.wikipedia.org/wiki/Server_Side_Public_License

The birth of Valkey
-------------------

Many contributors, including companies providing hosted Redis-derived or
Redis-compatible database services, just like Redis Ltd. does, have been using
and contributing to Redis just as long as Redis Ltd. has existed. It was
therefore and easy decision for many of them to continue the open source
development as usual under the BSD license.

As Redis Ltd. owns the trademark rights to the name Redis, the open source
project needed to continue under a different name. A group of six active
contributors (one from each of Alibaba, Amazon, Ericsson, Google, Huawei and
Tencent) with the support from several other companies launched Valkey as a
Linux Foundation project. It was announced in a [press release][lf-press-1] only
eight days after Redis' license change. Three weeks later, a [second press
release][lf-press-2] announced seven more companies joining and the first
release, Valkey 7.2.5.

[lf-press-1]: https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community
[lf-press-2]: https://www.linuxfoundation.org/press/valkey-community-announces-release-candidate-amid-growing-support-for-open-source-data-store
