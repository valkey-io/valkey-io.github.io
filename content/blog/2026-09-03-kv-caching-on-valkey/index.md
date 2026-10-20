+++
title = "KV caching on Valkey: 2× faster responses and 25% more requests"
date = 2026-10-20
description = "Your GPUs spend part of every request re-reading context they already processed. We moved the KV cache to Valkey, and the same two GPU nodes served 25% more requests with replies streaming twice as fast."
authors = ["omerrubi", "cnuthalapati", "jaduffy"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-03.webp"
+++

Open-weight large language models (LLMs) now approach frontier quality at a fraction of the per-token cost.
You can self-host open-weight LLMs on GPUs for better cost economics, accuracy, control, or data privacy.
Unlike traditional applications that benefit from scaling economies, LLM inference costs scale directly with your application, and the biggest line item is the GPU bill.

A surprising share of that bill is spent on work the model has already done: reprocessing prompt instructions, tool definitions, and conversation history on every call.
Key-value (KV) caching eliminates that redundant work.
This post introduces the fundamentals of KV caching and how it helps you use GPU resources well.
You will learn how to set up a KV cache with Valkey to serve about 25% more requests on the same GPUs and stream responses about 2× faster.
Serving more requests per GPU lowers your cost per request, and faster responses keep users engaged instead of waiting.

We presented this work at Percona Live 2026, in a session on improving LLM inference inside agentic workflows.
You can watch the recording, [Supercharging LLM Inference: KV Caching with Valkey](https://www.youtube.com/watch?v=vgX-I53PGqU).

## The problem: your GPUs keep re-processing old context

Context provided to LLMs in agentic applications contains tool definitions, Model Context Protocol (MCP) servers, skills, prompt instructions, and ever-growing conversation history.
A coding assistant carries repository files and prior edits, a support chatbot carries the whole conversation history, and a retrieval-augmented generation (RAG) assistant carries retrieved documents.
The inference engine must process the entire context on every turn, meaning each new request in a conversation, before producing a single word of a reply.
For a simplified analogy, imagine re-reading a whole book from page one every time someone asks about the next page.

![Context growth across turns in an agentic application](context_in_agentic_applications.png)

The inference engine takes all input tokens and projects them into Key (K), Value (V), and Query (Q) tensors.
This phase, called prefill, is compute-heavy, consumes the most GPU time, and grows super-linearly with context length.
On a 70B-class model it can take several seconds of GPU time before the first new word appears, which breaks the user's flow of thought and leads to lower engagement and abandonment.

KV caching lets inference engines store and reuse the intermediate KV tensors for repeated context, which removes that redundant work.
Think of it as a checkpoint of the model's reading.
Save it, and the next turn resumes from the checkpoint instead of re-reading from page one.
KV caching cuts both cost and latency by letting the model skip recomputing context it has already processed, which frees GPU capacity and shortens prefill.
Every response is still generated fresh, so answers stay accurate.

![Prefill and decode timelines, with and without KV caching](prefill_and_kv_cache_hit_no_annotation.png)

The figure above puts every request on one shared time scale.
Without a cache, request 2 recomputes the whole conversation before it prefills the genuinely new tokens, so its first token lands last.
With a cache, request 2 loads the stored KV and prefills only the new tokens, so its first token arrives far earlier on the same scale.
The first request still pays a full prefill either way, because it is the one that populates the cache.

## Valkey as a KV cache

KV caching is already available in your serving stack, inside inference engines such as vLLM, SGLang, and TensorRT-LLM.
You can build a KV cache on your existing stack using GPU memory (the L0 tier) and the CPU host's memory (the L1 tier).
The catch is how much of that capacity is available to serve real traffic, and two problems limit it.

First, the capacity of both tiers is insufficient, because KV states are big.
A single long-running conversation of 20K to 30K tokens on Llama-3.1-70B carries 6.5 to 10 GB of KV data.
Contexts today keep growing.
Paste one document into a chat and that single conversation can jump into the hundreds of thousands of tokens, displacing a dozen or more others from the cache.
Even a generous half-terabyte of storage holds only 50 to 75 long conversations.
The gap between turns makes this worse, because a person can resume a multi-turn conversation, such as a coding or customer support session, after a break.
By the time a conversation returns, enough others have passed through the cache that it has often been evicted, so it gets recomputed from scratch at full price.

Second, the L0 and L1 tier KV cache is host-limited.
Real fleets load-balance, autoscale, and restart, so a returning user often lands on a server that never saw their conversation.
The checkpoint exists, but on the wrong machine.
Eviction is about unique contexts over time, not just concurrent users.
Could the nodes just share caches peer-to-peer?
It helps less than you would hope, because every node has the same finite RAM, so pooling raises the hit rate only marginally, and capacity stays welded to your GPU count.
Worse, serving cache traffic for peers burns the CPU, bandwidth, and network you bought for inference.

A dedicated L2 tier cache with Valkey provides capacity that scales independently of your GPU hosts and is shared across every GPU server.
Valkey gives you a distributed, scalable external cache that keeps sessions evicted from local tiers, so a returning conversation is loaded, not recomputed.
Any GPU node can load any conversation's KV, so load balancing, scale-out, and restarts stop costing you recomputes.
The L2 cache sits on the live path of the application and directly affects the first token, so how fast the cache serves a checkpoint shapes how long every user stares at a blank screen.
A returning 20K-token conversation on Llama-3.1-70B means fetching ~6.6 GB of KV in hundreds of milliseconds, in parallel.
That takes sub-millisecond operations and read bandwidth that grows as you add shards, which is exactly what a Valkey cluster provides.
Object and file storage have their place, but not on the first-token path.

We benchmarked Valkey to quantify the impact.
With the same two GPU nodes plus a three-shard Valkey cluster, the fleet **served about 25% more requests and produced about 28% more output tokens**, with replies streaming **about 2× faster**.
First tokens arrived in **0.13 s instead of 8.5 s** for conversations under about 16K tokens of context, while the fleet still had capacity headroom.
The three-shard Valkey cluster cost about **15% on top of the GPU bill**, so you pay 15% more to serve 25% more requests.

## Should you add a shared L2?

You will benefit from a shared L2 KV cache if any of the following describes your workload.

- Your users return to conversations that grow, such as a support or website chatbot where the history piles up turn after turn.
- Your assistant carries large repeated context, such as a coding assistant re-sending repository files, or an internal knowledge-base RAG assistant re-sending retrieved documents and a big shared system prompt.
- Your GPUs are busy re-reading instead of generating, and long first-token waits under load are the telltale sign.

**Where it will not help.**

- If your whole working set fits in GPU and CPU memory, for example on a single server or when each user always lands on the same server, you do not need an L2 yet. Little is evicted, so there is little to reload unless your users show a pattern of resuming sessions after long intervals.
- A cache cannot create GPU capacity. In our run at 8 requests per second on two nodes, conversations past about 16K tokens needed more prefill for their new tokens than the GPUs could deliver, so first-token latency stopped improving. Throughput and streaming speed still improved across the whole run. Where that limit falls depends on your request rate, context length, model size and GPU count, and moving it takes more GPU nodes.
- Low-reuse workloads gain less. One-shot requests with nothing returning, meaning no growing history and no shared prefix, evict little worth reloading.

## Follow along: set up a KV cache

To try KV caching yourself, follow the [KV caching cookbook](https://github.com/valkey-io/valkey-developer-resources/tree/main/cookbooks/kv-caching), which walks you through setting up vLLM and LMCache with a Valkey cache end to end.
If you already run vLLM with LMCache, adding the shared cache is a configuration change.

## Performance and results

We recreated what a busy production fleet looks like.
**100 concurrent conversations that keep growing** (12K to 28K tokens of context) arrived at 8 requests per second across **two GPU nodes** (8 H100 each) serving **Llama-3.1-70B** with vLLM plus LMCache.
The only difference between the two arms was whether a shared L2 was attached, a right-sized three-shard **Valkey 9** cluster in the same availability zone.
We changed two settings from the defaults: the eviction policy, for the reason explained under best practices below, and a 20 GB cap on each server's host-memory tier, to recreate the eviction pressure of a larger fleet.
The traffic is synthetic but shaped like production multi-turn chat, so every turn appends to the history and nothing is truncated.

![Benchmark architecture: two GPU nodes sharing a three-shard Valkey cluster as the L2 KV cache tier](architecture_slide9.png)

The architecture is two vLLM nodes, each with its own GPU and host memory tiers, both pointed at one Valkey cluster over the same-AZ network.
A cache-aware router sits in front of the two nodes and directs each request toward the node most likely to hold its prefix.

Four numbers tell the story, and each is something your users or your finance team would notice.
**Requests served** is how much traffic the same fleet handles.
**Time to first token** is how long a user stares at a blank screen.
**Reply streaming speed** is how quickly words appear once a reply starts.
**Recompute share** is how much of the GPUs' prompt work went to re-reading old context.

| What you would notice | Without L2 (L0 and L1 only) | With Valkey L2 |
| --- | --- | --- |
| Requests served in 20 min, same 2 nodes | 3,692 | **4,631 (+25%)** |
| Output tokens produced | baseline | **+28%** |
| Reply streaming speed | 11.9 tok/s | **24.8 tok/s (about 2.1×)** |
| First token, while the fleet has headroom (context under 16K) | 8.5 s | **0.13 s** |
| Recompute share of prompt tokens | about 10% of prompt tokens | **about 1%** |

That last row, recompute dropping from about 10% to about 1%, is what unlocks the rest.
The win is outsized because eviction hits hard.
A single returning conversation re-reads thousands of tokens on the GPU, which blocks every other request on that node for seconds.
The shared cache removes those blockages, and the whole fleet breathes.

## Best practices

**Size the cache to your KV working set.**
The KV footprint per token is `layers × KV heads × head_dim × bytes per element × 2`.
For [Llama-3.1-70B](https://huggingface.co/meta-llama/Llama-3.1-70B) in bf16 that is 80 × 8 × 128 × 2 B × 2, or about **0.33 MB per token**, and [8-bit floating point (FP8) KV](https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache.html) halves it by using 1 byte per element instead of 2.
Multiply by context length and by the number of conversations concurrently inside your reuse window, then add about 30% headroom.
In our run, 100 conversations growing to about 28K tokens peaked near 900 GB, which matched the 880 GB we measured, so we provisioned about 1.3 times that.
Check the flip side first, because if the whole working set already fits in GPU and host memory you do not need an L2 yet.

**Scale shards for read bandwidth.**
Provision shards for aggregate read throughput, because a returning conversation pulls its whole KV history before the first new token, and a 20K-token chat is about 6.6 GB at 0.33 MB per token.
Each 16xlarge memory-optimized shard in our test added about 30 Gbps of network bandwidth and about 450 GB of memory.
Our three-shard cluster sustained **about 7.4 GB/s** of reads, peaking near 9.4 GB/s, against a ceiling near 11.25 GB/s, with zero throttled commands.
When your peaks approach the ceiling, add a shard.

**Pick the instance family, the placement, and the transport.**
Prefer a **memory-optimized instance family**, because the L2 exists precisely because local memory is not enough, so RAM is the resource you are buying.
When we compared a memory-optimized family against a network-optimized one, the extra RAM per node won end to end, because fewer evictions and a higher hit rate beat faster per-fetch transfers.
Keep the cache in the **same availability zone** as the GPU fleet, because the L2 sits on the first-token path, so same-zone placement trims round-trip latency on every fetch.
Crossing zones adds latency and, on most clouds, a per-GB transfer charge in each direction.
The connector supports **Transport Layer Security (TLS)** (`tls_enable: true`).
KV chunks derive from user conversations, so turn TLS on when your security or compliance requirements call for encrypting them in transit, and budget for the CPU on both ends and the added per-fetch latency of encrypting multi-megabyte transfers.

**Size the cache to your reuse window, and set an eviction policy.**
Valkey's default `noeviction` policy rejects writes once memory is full, and LMCache's key TTL is **off by default**.
Size the cache to hold the conversations you expect to come back, and pick an [eviction policy](https://valkey.io/topics/lru-cache/) that fits your workload.

**Route cache-aware.**
Pair the shared L2 with cache-aware routing so a returning conversation lands on the node that already holds its KV.
We run the open-source [vLLM Router](https://github.com/vllm-project/router) with `--policy cache_aware`.
It routes by prefix with no session ID required, and when a node runs hot it re-routes traffic away, which spreads load better than strict affinity and stays cheap, because the shared L2 loads the KV on the new node instead of recomputing it.
The same property helps when you scale the fleet, because a node you add or replace warms up from the L2 rather than recomputing every conversation.

**Tune four connector knobs, because the rest of the defaults are fine.**

| Setting | Value | Why |
| --- | --- | --- |
| `chunk_size` | `256` | A value of 512 nearly doubled recompute in our tuning sweep, because KV is reused only in whole chunks, so coarser chunks lose more tokens at conversation boundaries. It is bounded above too, so keep the per-stored-value size (`chunk × KV-bytes/token ÷ tensor-parallel degree (TP)`) well under about 33 MB. Past glibc's mmap threshold, every retrieve page-faults its whole buffer and runs about 3 times slower |
| `valkey_num_workers` | `16` | Values of 16, 32, and 64 swept flat, and too small a pool starves under load |
| `remote_serde` | `naive` | The working serializer on 70B. To shrink KV, set the vLLM flag `--kv-cache-dtype fp8` instead, which halves the bytes per cached token at the same hit rate |
| `valkey_enable_ttl` and `valkey_ttl_sec` | `true` and `86400` | Gives every key an expiry, in LMCache 0.5.1 and later. Set the TTL to comfortably outlast your conversation reuse window |

## Conclusion

A returning conversation should be loaded, not recomputed.
GPU and host memory tiers always have a ceiling and evict under real traffic, so a shared Valkey L2 catches what spills over that ceiling and serves it to any node in the fleet.
Measured on Llama-3.1-70B, the same two GPU nodes produced 28% more output tokens with replies streaming about 2× faster.
For you, that means a lower cost per request and faster responses your users notice.
Getting there takes a handful of steps with vLLM, LMCache and Valkey.

**Get involved.**
If you are interested in open-weight LLMs, inference, or caching, contribute on the [Valkey](https://github.com/valkey-io/valkey) and [LMCache](https://github.com/LMCache/LMCache) repos.
Making Valkey a first-class KV cache means work to improve the LMCache connector, handle large KV objects, and improve the network transport.
