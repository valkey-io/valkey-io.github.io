+++
title = "Percona Live Session Recap: Supercharging LLM Inference with Valkey KV Caching"
date = 2026-06-11
description = "Supercharging LLM Inference - KV Caching with Valkey"
authors = ["crystalpham"]
+++

At Percona Live 2026, Chaitanya Nuthalapati (Sr. Technical Product Manager at AWS) presented a technical session on optimizing Large Language Model (LLM) inference inside agentic workflows. The session highlighted the mechanics of Key-Value (KV) caching and detailed how an external, multi-tier caching layer using Valkey addresses the memory and compute bottlenecks of scaling multi-turn AI conversations.

Below is a technical recap of the core topics, architecture, and decision frameworks discussed during the presentation.

<iframe
  width="100%"
  height="400"
  src="https://www.youtube.com/embed/vgX-I53PGqU"
  title="Supercharging LLM Inference KV Caching with Valkey"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>

---

# The Bottleneck in Scaling Agentic AI

Deploying agentic AI applications at scale introduces strict compute and memory constraints. Unlike traditional web applications that benefit from linear scaling economies, LLM inference costs scale directly with the volume of concurrent users and context length.

Two primary symptoms define this scaling problem:

Escalating Compute Costs: Multi-turn agentic workflows frequently pass long system prompts, tool definitions via Model Context Protocol (MCP), skill descriptions, and historical context. Re-processing this static or historical text on every single request wastes substantial GPU cycles.

High Time-to-First-Token (TTFT): If context recomputation pushes TTFT past one second, user engagement drops, and applications break the user's flow of thought.

---

# Breaking Down LLM Inference: Prefill vs. Decode

To understand where the bottleneck occurs, the session broke inference down into two distinct operational phases inside the transformer layers:

Prefill Phase (Compute-Bound): Occurs before the first token is generated. The engine takes all input embedding tokens and projects them into Query ($Q$), Key ($K$), and Value ($V$) tensors. This phase is compute-heavy and utilizes maximum GPU capacity.

Decode Phase (Memory-Bound): Generates subsequent tokens sequentially. For each new token, the engine only calculates the $Q, K, V$ vectors for that specific token, but it must reference the historical KV tensors of all prior tokens. This phase outputs the token stream and is highly dependent on memory bandwidth.

As multi-turn conversations progress, context windows grow until they approach the model's limit often triggering context compaction cycles around the 85% capacity mark (common in models like Claude or Codex) which further spikes latency.

---

# The Solution: Multi-Tier KV Caching

Instead of recomputing the KV tensors for identical system prompts or historical conversation turns during every prefill phase, systems can store these arrays in a cache layer. When a recurring prefix or past turn matches, the engine fetches the precomputed KV tensors from memory, processing only the newly appended tokens.

Implementing a production-grade KV cache requires updates across three areas of the inference stack:

Application Framework Layer: Utilizing tools like LangChain or LlamaIndex to handle context augmentation and session tracking.

Routing & Scheduling Layer: Implementing cache-aware routing rather than naive round-robin scheduling. The router should direct incoming queries to the exact GPU instance that already holds the calculated tensors for that session. This can be achieved through consistent hashing of the User ID and Session ID.

Inference Engine Layer: Integrating execution engines like vLLM alongside dedicated caching modules (lm-cache or llm-d) to manage serialization, eviction, and multi-tier memory transfers.

---

# The Caching Hierarchy (L0 to L2)

```
[ L0: GPU Memory ]   --> Fastest access, near the model. Severely space-constrained.
         |
[ L1: Host CPU Memory ] --> Larger local capacity (RAM). Bound to a single node.
         |
[ L2: Valkey Shared Tier ] --> Distributed network cache. Cross-worker reuse & persistence.
```

---

L0 (GPU Memory): Located directly on the accelerator card. It offers the lowest latency (sub-millisecond) with zero network overhead. However, it has the smallest capacity. Large models (such as Qwen3 at 200GB+) consume the bulk of GPU VRAM, leaving only 100MB to 10GB for cache storage. Benchmarks show that at around 32 concurrent users, L0 VRAM overflows, causing TTFT to spike back to baseline limits.

L1 (Host CPU Memory): Local system RAM. It expands capacity up to multiple terabytes per node, successfully lowering latency for moderately concurrent workloads (up to 64 users). Its limitations are that it remains tied to a single worker instance and features slower data transfer speeds than VRAM.

L2 (External Distributed Cache via Valkey): A shared cache tier connected over the network using valkey-glide. When local L0 and L1 capacities are exhausted under high concurrency (e.g., 128+ users), the system overflows cached KV tensors to Valkey.

---

# Performance Impact under Load

While network retrieval and serialization from an L2 cache add minor overhead (ranging from single-digit milliseconds up to a few hundred milliseconds depending on context size and quantization methods), it mitigates the massive multi-second latency spikes caused by complete GPU prefill recomputations. Furthermore, an L2 tier enables cross-worker KV reuse and ensures cache states survive individual worker node restarts.

Testing on datasets like LLM-Benchmark (ShareGPT conversational logs) and AI-Perf (agent benchmarks) demonstrated that combining local caching with an L2 Valkey tier maintains stable, flat TTFT lines even as queries-per-second scale past typical hardware exhaustion thresholds.

---

# The Decision Framework: When to Deploy an L2 Tier

The session concluded with a structured framework determining when to add Valkey as an L2 shared cache tier versus relying solely on local memory:

---

## Use Valkey for L2 KV Caching When:

Local Memory Exhaustion: The size of your active working set (model weights plus active KV tensors) consistently exceeds your total local L0 GPU and L1 CPU memory capacity.

High Prefix Repetition: Your workload involves highly repetitive prompts. Examples include complex multi-agent setups where multiple sub-agents share a core system configuration, or highly iterative multi-turn user interfaces.

Cross-Worker or State Persistence Needs: You require the ability to preserve cache states across worker pool restarts or share precomputed prefixes across horizontally scaled GPU nodes.

Positive TCO Crossover: The time and network cost required to serialize, transfer, and deserialize KV blocks over the wire is strictly lower than the time and financial cost of running a full GPU prefill computation.

---

## Avoid an L2 Caching Tier When:

Low Local Cache Miss Rates: Your local GPU/CPU memory is entirely sufficient to sustain your maximum concurrent user sessions without overflowing.

Low Prefix/Context Reuse: Prompts are short, unique, or non-repeating, resulting in a low read-to-write ratio that fails to justify cache orchestration costs.
```