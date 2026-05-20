+++
title = "Caching up with the Community: A Conversation with Daniela Miao on Valkey and Momento"
date = 2026-05-26
description = "This segment features Daniela Miao, Co-founder and CTO of Momento, discussing her journey into open source, the technical advantages of building on Valkey, and how high-scale infrastructure supports some of the world's largest live events." 
authors =  ["dmiao","crystalpham"]
+++

This segment features [Daniela Miao](https://www.linkedin.com/in/danielamiao/), Co-founder and CTO of [Momento](https://www.gomomento.com/), discussing her journey into open source, the technical advantages of building on Valkey, and how high-scale infrastructure supports some of the world's largest live events.

## Tell us a little bit about yourself, what Momento does, and your journey through open source and infrastructure.
I’m the Co-founder and CTO of Momento, where I oversee a low-latency distributed caching service built on Valkey. My background is in distributed systems, which started during my time at AWS on the DynamoDB team. That experience sparked my passion for developer products and mission-critical infrastructure.

After AWS, I joined LightStep, a startup that co-created OpenTelemetry. Seeing OpenTelemetry grow into a successful, vendor-neutral community inspired me to stay deeply involved in open source. Today at Momento, my co-founder Khawaja and I are applying the lessons we learned from managing massive distributed systems to the world of serverless caching.

## What Valkey offerings does Momento provide, and when do you recommend using Valkey specifically?
We provide two primary tiers for users:
* **Serverless Caching (SaaS)**: Our flagship service is completely hands-off. Developers don’t need to choose instance types or manage provisioning. It’s built on Valkey, but we handle all the internals.
* **Managed Valkey (VPC)**: For enterprises that need stricter governance, we offer a version that deploys directly into the customer’s VPC. This gives teams full control over instance types, memory, and specific Valkey configurations.

I recommend Valkey for any project that needs an ultra-fast, high-scale cache. It’s incredibly memory efficient, our internal data shows that upgrading to newer Valkey versions can significantly reduce memory usage for the same data, which means more throughput on the same hardware.

## What challenges does Valkey solve for your customers, and are there specific use cases where it excels?
Valkey really shines in “bursty” traffic scenarios, situations with huge spikes compared to average load. One example is our work with Fox during the 2025 Super Bowl, where there were 16 million concurrent viewers and the audience doubled in just five minutes during halftime. Valkey delivered the predictability we needed at that scale. If a system behaves predictably at a large scale, you can trust it to handle millions of users.

We see similar patterns in FinTech. When markets open, users expect immediate access to trade history and balances. Valkey’s ultra-low-latency path is designed exactly for these high-pressure, real-time environments.

## What features or enhancements would you like to see in the future of Valkey?
I’m especially excited about native AI support. One area I’m focused on is using Valkey for KV cache, where session history is stored on the GPU during inference.

For LLMs to respond quickly, chat history needs to be cached efficiently, otherwise users hit the dreaded “spinner of death.” AI workloads also tend to involve much larger objects, sometimes gigabytes in size, so I’d love to see Valkey evolve to handle larger data structures while maintaining its performance.

## How can new users get started with the Valkey community or get in touch with Momento to help with performance features?
The Valkey community is incredibly welcoming and active, especially in Slack. There are dedicated channels for feature requests, benchmarking, and Kubernetes integration through the Valkey Operator.

I encourage both contributors and users interested in design discussions to get involved. We’re committed to keeping Valkey vendor-neutral; it’s not just one company’s project, but something shaped by a diverse group of contributors. My advice is simple: if you want to participate, just submit a PR.

## Do you have any “spicy” hot takes regarding the industry?
One of my hot takes is that the AI stack isn’t fundamentally different from the traditional database stack. A lot of developers feel like LLMs are a completely new paradigm, but the architecture is actually very similar to distributed systems. A request comes in, it gets routed to the right “storage” (the model), and data needs to be retrieved as fast as possible. I think we’ll see infrastructure and AI engineering converge more and more over time.

## Any final thoughts for the community?
I really enjoy engaging with the community, whether it’s long-time contributors or people just getting started. At Momento, we aim to support everyone, from developers who want to scale from zero to a million users without worrying about infrastructure, to platform teams that need deep control.

At the end of the day, Valkey shows that diverse collaboration across companies and individuals leads to a stronger ecosystem. I’m excited to keep building that future together.

## Get involved
If you have questions, feedback, or just want to learn more, join our Slack community. It’s full of knowledgeable and helpful contributors who are happy to support questions, ideas, and discussions.

Other ways to connect:
* Connect with us on [LinkedIn](https://www.linkedin.com/company/valkey/), [X](https://x.com/valkey_io), [BlueSky](https://bsky.app/profile/valkeyio.bsky.social)
* Subscribe to our [newsletter](https://valkey.io/#:~:text=Subscribe%20for%20updates%2C%20event%20info%2C%20and%20the%20latest%20Valkey%20news)
* Watch videos on [YouTube](https://www.youtube.com/@valkeyproject)