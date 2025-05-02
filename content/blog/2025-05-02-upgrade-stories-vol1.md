+++
title= "Upgrade Stories from the Community, Volume 1:" 
description = "Two new Valkey users describe what it's really like to upgrade" 
date= 2025-05-02 01:01:01 
authors= ["kyledvs", "nigel"] 
+++

### Two new Valkey users describe what it's really like to upgrade


Many potential Valkey users have told the project that they're interested in hearing more stories about companies that have decided to migrate to Valkey. This blog is the first in a series that will share our users' stories. Two organizations, Muse and 4th Whale Marketing, share a similar story: they both have Valkey in a critical place in their applications, they switched engines quickly with zero issues, and they saved money.

Valkey is a multi-vendor/vendor neutral project. With the support of the a large and diverse community, the project is innovating at a rapid pace. In September 2024, we released Valkey 8.0 which brought performance improvements. Six months later in March 2025, Valkey 8.1 added memory efficiency improvements, extended observability, and more performance improvements. Further, it has a permissive, open source license allowing for anyone to use, modify, and provide Valkey as a Service. This allows organizations to make changes that best fit their values, budgets, and technical constraints. Valkey provides choice and prevents lock-in by being offered across many vendors, Linux distributions, with no licensing costs. 

According to Muse (https://www.museml.com/), they are,  “the first intelligent creative assistant and inspiration studio for storytellers and world builders.” They use Valkey in several ways:

* Caching: “We utilize standard HTML and payload caching to offload redundant data retrieval and computation, improving performance and efficiency.”
* Pub/Sub Messaging – “Valkey’s topic-based subscriptions drive our event-driven workflows across multiple system layers and support real-time WebSocket client communication.”
* Lua Scripting – “We leverage Valkey’s single-threaded Lua execution for complex and multi-stage data retrievals, ensuring consistency while avoiding concurrency issues and race conditions.”
* Taxonomies & Tagging Strategies – “The ability to handle massive lists at low cost has allowed us to efficiently implement taxonomies and data mappings, making retrieval seamless.”

One of the key reasons Muse chose Valkey was that it is open source. Garth Henson, Director of Engineering at Muse says, “Redis’ licensing change prompted us to seek a truly open source alternative that aligns with our values.” They also mentioned the cost and performance as well as Valkey being a drop-in replacement as reasons they upgraded.

For them, the change was seamless. They learned about Valkey on a Thursday, began evaluating the next Monday and were fully migrated by Wednesday with zero downtime. That’s four working days from idea to production. They said that so far they’ve noticed benefits of cost efficiency, storage optimization, and performance stability since upgrading to Valkey.

4th Whale Marketing (https://www.4thwhale.com/) is a Montreal-based company specializing in digital affiliate marketing. Founded in 2004, their seasoned team combines many years of experience in digital marketing, optimization, content creation, design, and web development

They use Valkey, “to store data that changes regularly (every 10 seconds or less) and needs to be available very quickly and often with the latest update possible.” The impetus for the change was that their cloud provider made it easy and cost effective which resulted in 4th Whale saving $18k USD per year. It took them 20 minutes to upgrade one instance through tooling from their cloud provider. Once everything was tested and working as expected, they upgraded their other two instances. 

This story of upgrading to Valkey with minimal friction and seeing great benefits is not unique to these two organizations. One provider of Valkey as a Service has shared similar experiences from companies like Tubi and Nextdoor on their testimonials page. Similarly, a year in review for Valkey shows even more stories from organizations like Verizon, Fedora, and AlmaLinux. The move and savings these organizations experienced are only possible in a level playing field, competitive, vendor neutral environment. Users can deploy Valkey wherever, whenever. Vendors can build services on top of Valkey quickly and at a low cost. As a Linux Foundation project, Valkey has no motivation to lock users in because it is controlled by no single company and will never change its license.

Are you using Valkey? We'd love to include you in this series and list your company logo on this site. Please contact us by reaching out on Slack.
