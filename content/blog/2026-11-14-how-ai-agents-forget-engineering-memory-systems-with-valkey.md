+++
title = "How AI Agents Forget: Engineering Memory Systems with Valkey"
date = 2026-11-14
description = "An AI agent can remember an instruction in one turn and contradict it in the next. Building reliable memory requires retrieval, policy, provenance, and deliberate forgetting, not simply more conversation history."
authors = ["sanika6969"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-01.webp"
+++

Five minutes after an operator tells an incident agent, "Do not restart the primary database," the agent suggests restarting it.

The model has not suddenly lost a capability. The instruction has fallen outside the state available to its next decision.

That was the failure I used to open my talk at ValkeyConf 2026 in Prague.

My argument was straightforward: **continuity is a state management problem, not a prompt feature.**

A longer transcript cannot determine which facts are trustworthy, which actions failed, or when instructions stop applying.

A memory system must make those decisions explicitly.

## Context is working memory, not the memory system

The model's context window holds the system prompt, recent turns, tool outputs, and any retrieved memories for a single inference. It is bounded and reconstructed on later calls.

Durable memory lives outside that window, where an agent can address, update, retrieve, and retire it.

I separated memory into four classes because each needs different retention and retrieval rules.

![Four agent memory classes with examples and retention rules](/assets/media/pictures/agent-memory-taxonomy.svg)

**Working memory** holds the active plan, scratch state, and locks. It usually lives for seconds to hours.

**Episodic memory** records what happened, including tool calls, outcomes, and decisions. It can remain useful for hours to weeks.

**Semantic memory** captures facts, entities, and user preferences. These can last for days or longer, until corrected or retired.

**Procedural memory** holds policies, workflows, and learned rules. It should be versioned rather than silently overwritten.

The distinction changes what the agent should remember. A failed deployment is an event. "Do not restart the primary database" is a live constraint. An operating procedure is a different, versioned kind of memory.

## Separate memory policy from the Valkey memory plane

Storage answers where a memory lives. The **memory control plane** answers whether to write it, how to represent it, when to retrieve it, and when to forget it.

Without that policy, even a fast store can become a source of stale context.

The **Valkey memory plane** supplies composable data structures for these decisions:

* **Hashes and Valkey JSON** hold compact working state and structured facts. JSON support comes from the [Valkey JSON module](https://valkey.io/topics/valkey-json/).
* **Streams** preserve ordered events and evidence for replay and audit, rather than forcing everything into a transcript.
* **Valkey Search** finds candidate memories using vector similarity and structured filters. Its [query syntax](https://valkey.io/topics/search-query/) supports filtered vector retrieval.
* **Sorted Sets** can hold recency, priority, or top results ordering maintained by the application.
* **Time to live (TTL)** and [`EXPIRE`](https://valkey.io/commands/expire/) give short lived state a defined lifetime.

These are building blocks, not an automatic policy. Vector search is one retrieval mechanism, not the architecture.

![Agent, control plane, and Valkey memory plane connected through pre-turn reads and post-turn writes](/assets/media/pictures/valkey-agent-memory-architecture.svg)

## Put retrieval and write back on the agent's hot path

The architecture from my talk follows one rule: **read before reasoning; write after acting**.

Before an inference, the orchestrator resolves identity and scope, asks the control plane for relevant memories, and injects selected context into the language model.

The model then reasons, invokes tools when needed, and receives their results. After the action, the control plane extracts possible new memories, validates and deduplicates them, classifies their retention, and writes or expires them in Valkey.

Not every message belongs in long term memory. A temporary tool result may need a short TTL. A confirmed constraint needs an owner, provenance, and an expiry rule.

The write path is therefore **turn, extract, deduplicate, classify, and write**, not "save every sentence."

Retrieval is equally selective. In the reference pipeline, identity, tenant, user, and task scope determine which memories are eligible. Search retrieves candidates, ranks them, and fits the best results into a context budget.

The talk expressed ranking conceptually as:

**score(memory) = α × similarity + β × recency + γ × importance + δ × scope**

The coefficients describe a policy, not measured or universal weights.

Scope must also act as an access boundary. A high similarity score must never admit another tenant's memory. Freshness and validity checks can reject expired or superseded facts before they reach the model.

![Identity and scope checks, memory search, ranking, and top results context injection](/assets/media/pictures/agent-memory-retrieval-pipeline.svg)

## Incident #8421: hand off the state, not forty turns

Consider the presentation's incident scenario.

At **14:02**, checkout p99 latency exceeds two seconds.

At **14:05**, a rollback to **v218 fails**.

At **14:09**, the team records a constraint: **do not restart the primary database**.

At **14:14**, the working hypothesis becomes a connection storm after deployment.

At **14:23**, a site reliability engineer (SRE) joins the handoff and asks, "What should we try next?"

![Incident 8421 timeline and the three selected memories used during the engineer handoff](/assets/media/pictures/incident-8421-memory-handoff.svg)

The useful response starts from three incident scoped memories: the failed rollback, the no restart constraint, and the current hypothesis.

It does not require replaying a forty turn transcript or asking the new engineer to repeat what the team already tried.

The system preserves evidence for the next decision while excluding unrelated conversation. That is the difference between starting over and picking up where the team left off.

## Correct memory needs evidence and a way to forget

The memory record in my talk included an identifier, kind, content, source, observation time, confidence, scope, expiry rule, and version or supersession link.

Those fields answer: Who said this? When? For which incident? Is it still true? What replaced it?

**Correction must be a first class write path.**

Expiry, supersession, and scope are correctness controls, not just storage cleanup. Temporary tool outputs expire. A corrected hypothesis supersedes an older one. An incident scoped constraint stops influencing unrelated incidents.

Designing these rules also exposes failure modes that can otherwise hide in plausible model output:

* **Stale facts:** Old preferences or assumptions win unless timestamps, TTLs, and supersession are enforced.
* **Memory poisoning:** Untrusted tool output becomes future authority unless provenance, confidence, and write gates exist.
* **Cross tenant leakage:** A relevant memory reaches the wrong user unless namespaces, access control lists, and retrieval filters enforce scope.
* **Concurrent writes:** Parallel agents overwrite newer state unless versions, compare and update checks, and an event log protect ordering.
* **Unbounded growth:** Retaining everything requires retention budgets and compaction rules.

Observability should cover memory, not only the language model. My talk suggested tracking **retrieval usefulness, stale retrieval, write amplification, correction rate, and memory latency**.

A bad answer should be traceable through the query, retrieved candidates, ranking, injected context, and final decision.

## What I would design before shipping

I would start with five rules: separate working from long term memory, retrieve selectively, make forgetting intentional, store provenance alongside facts, and observe reads, writes, misses, and corrections.

Then test a handoff like Incident #8421. Can the agent recover the failed action, respect the live constraint, and avoid reviving a superseded hypothesis?

An agent does not need perfect recall. It needs the **right memory, at the right time**, with enough evidence to know when that memory should no longer be trusted.

If you are building one, begin by defining the memory policy. Then map each requirement to the appropriate [Valkey data structure](https://valkey.io/topics/data-types/) and test the complete read, act, and write loop.