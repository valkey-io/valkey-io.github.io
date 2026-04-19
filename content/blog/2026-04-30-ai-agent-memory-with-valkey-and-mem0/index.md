+++
title= "Reduce Token Cost for LLMs: AI Agent Memory with Valkey and Mem0"
description = "Cut 90% of token costs and deliver sub-2s responses by retrieving only the memories that matter."
date= 2026-04-30 01:00:00
authors= ["cnuthalapati", "allenss", "mbhagdev"]
[taxonomies]
blog_type = ["Technical Deep Dive"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-08.webp"
+++

Large language models (LLMs) are stateless. They retain nothing between calls. Every response requires the application to pass in whatever context the model needs, whether that is the current conversation history or facts from prior sessions. Without memory, responses are less personalized and less relevant, users often have to repeat themselves, and token costs rise as raw history accumulates. 

Adding an application-managed persistent agentic memory layer helps extract the facts that matter, store them, and retrieve them on demand to improve responses while reducing token costs. This post walks through how agent memory works and provides practical guidance, including an implementation using Valkey and Mem0 (an open-source memory framework), when to use local versus external memory, infrastructure requirements for a memory store, and best practices.

## Types of Agent Memory
Agent memory provides functionality across three scopes: **session memory** for understanding the current conversation, **state memory** for continuing an in-progress task, and **long-term memory** for carrying durable facts and preferences across sessions.

**Session memory** captures what the agent needs from the current conversation to interpret the next turn correctly. It is typically managed through message history, trimming, or compaction. This supports use cases such as resolving implicit references, where the user says "I liked the second one better" and the agent retains enough of the prior conversation to map those references to the right items. It also supports conversation-scoped constraints, such as "Keep this under $200" and the agent respects that constraint in the thread. You can use Valkey with frameworks such as the [Strands Valkey Session Manager](https://strandsagents.com/docs/community/session-managers/strands-valkey-session-manager/) to persist conversation history and agent state across distributed environments.

**State memory** keeps track of task execution so the agent can continue correctly from one step to the next. It records things like information collected, steps completed, and pending tasks. The state is often temporary, but in production systems it is commonly saved so work can resume after an interruption. For example, it ensures workflow continuity for tasks such as filing taxes or executing a rollback step, so retries or users leaving mid-execution do not repeat the same work. It also supports multi-agent collaboration, where state acts as shared memory so one agent can work with another on the same workflow without each one having to reconstruct progress. State also supports human-in-the-loop flows, where the agent pauses for a human to provide input before continuing to the next step. You can use Valkey with frameworks such as [LangGraph checkpoints](https://pypi.org/project/langgraph-checkpoint-aws/) for workflow-state persistence and resume primitives for this scope.

**Long-term memory** includes persistent memory that the agent can reuse long after the current conversation ends. In practice, long-term memory often includes three forms: semantic memory for facts and preferences, episodic memory for past interactions and outcomes, and procedural memory for instructions or learned rules about how the agent should behave. Long-term memory helps the agent carry context across sessions, such as preferred languages, shopping choices, or shipping details so the user does not have to repeat them. You can use Valkey with frameworks such as [Mem0](https://mem0.ai) for memory operations including extraction, deduplication, consolidation, and scoped retrieval by user, agent, or session. For a full setup and step-by-step implementation walkthrough, follow the [Mem0 blog](https://mem0.ai/blog/build-persistent-memory-for-agentic-ai-applications-with-mem0-open-source-amazon-elasticache-for-valkey-and-amazon-neptune-analytics). 

## When to use local vs external memory

For some use cases, the memory types discussed above can be stored locally as well. For example, a local markdown file such as [CLAUDE.md](https://code.claude.com/docs/en/memory) or [Cursor Rules](https://cursor.com/docs/context/rules) hold stable, human-curated project context like coding conventions, build commands, and architecture notes. CLAUDE.md files contain persistent instructions that are read at the start of each session, and Cursor Rules similarly are static context the agent sees at the start of each conversation. Local files remain the right choice for stable, human-curated guidance such as coding standards, build commands, and architectural conventions, which are best loaded as startup context rather than managed as evolving runtime memory. 

External memory is the better fit for dynamic, mutable, queryable memory that the agent picks up during execution and needs to carry forward across prompts, sessions, or agents. For example, consider a retail assistant that should remember a returning shopper's delivery preferences, or a support agent that needs the context of a prior case before responding. In these cases, the relevant fact is learned during an interaction, belongs to a specific user, task, or agent, and must be available on the next visit or to the next step in the workflow. External memory fills that gap by persisting learned state, scoping it by identity such as `user_id`, `agent_id`, and `run_id`, and making it retrievable on demand across sessions or services. External memory also makes compliance practical by supporting centralized access control, auditing, and managed deletion for regimes like GDPR, HIPAA, or SOC2, which scattered local files cannot.

Long-running and always-on agents highlight the need for durable memory. These systems operate across many context windows, and often multiple sessions or collaborating agents, so the active prompt alone cannot serve as the system's memory. They need a way for agents to resume, hand off work, and continue learning over time. In practice, this is where an external memory layer backed by a low-latency store like Valkey becomes useful, persisting runtime state outside the prompt and making it retrievable on demand across long-running workflows.


## Memory Layers: Under the hood

This section uses Mem0 as an example to show what happens under the hood when the application writes and retrieves memory with Valkey. Each memory is stored in Valkey as a hash-backed document with attributes for the memory content, scope, timestamps, metadata, and embedding. The sections below walk through how the application creates an index, stores memories, and retrieves memories against this index.

### Index Creation
Mem0 creates a Valkey Search index over those documents so the application can combine scope and attribute filtering with vector similarity search. The schema looks like this:

```text
FT.CREATE {collection_name} ON HASH SCHEMA
    memory_id hash agent_id run_id user_id memory metadata TAG
    created_at updated_at NUMERIC
    embedding VECTOR {HNSW|FLAT} ...
```

The `memory` attribute stores the extracted fact in natural language, and the `embedding` attribute stores its vector representation. Scope attributes such as `user_id`, `agent_id`, and `run_id` let the system narrow retrieval to the right user, agent, or session before running vector search. Timestamp and metadata attributes support filtering, updates, and lifecycle management.

### Memory Storage
Writing memories is a single call with conversation messages and identity attributes, and Mem0 handles extraction, deduplication, embedding, and storage.

```python
messages = [ {"role": "user", "content": "I prefer to work with Python"},
             {"role": "assistant", "content": "Saved your language preference for Python."}]

memory.add(messages, user_id="user_123", agent_id="assistant", run_id="session_456")
```
Under the hood, the write path has three stages. First, the application sends the latest user message and assistant response to Mem0's memory-ingestion pipeline, which makes an LLM call to identify facts, preferences, or decisions that may be worth storing.
Second, for each new candidate memory, Mem0 searches existing memories stored in Valkey for similarities and determines whether to add, update, delete, or ignore the new memory. Finally, the memory is written to Valkey.

### Memory Retrieval

Memory retrieval starts when the application issues a natural-language query within a chosen scope. Under the hood, the read path has three stages. 

```python
results = memory.search(
    query="What deployment preferences has this user shared?",
    user_id="user_123", run_id="123", agent_id="shopping_assistant",
    limit=5)
```
First, the query is converted into a vector. Second, the application executes a hybrid search on Valkey by combining scope filters such as `user_id`, `agent_id`, or `run_id` as tag filters along with the query embedding to return the most semantically similar memories within that scope. Finally, the top memories are returned with scores and metadata so the application can inject them into the next prompt. This lets the system retrieve only the small working set relevant to the current step instead of replaying the full conversation history on every turn.

## Storage Layer Considerations

Unlike retrieval-augmented generation (RAG), which reads from a mostly static corpus, agent memory is a live, mutation-heavy workload. A single interaction can produce several candidate memories, each triggering its own scoped lookup and an add, update, delete, or no-op decision. In practice, that means multiple small reads, searches, and writes per turn. The storage layer has to support the four requirements below so the agent can continuously learn, update, and reuse context.

### 1. Scoped ownership and isolation
Agent memory must preserve who a memory belongs to and where it applies. In practice, that means scoping by identifiers such as `user_id`, `agent_id`, and `run_id`. These attributes are declared as TAG type in the Mem0 index schema, so the system can combine ownership filtering with semantic search in a single query. Alternatively, scoping can be represented using key and hash operations through namespaces such as ("memories", "{user_id}") or ("users", "{user_id}", "profile"), which provide fast retrieval and strict isolation, as seen in [LangGraph's store](https://docs.langchain.com/oss/python/langchain/long-term-memory).

### 2. Frequent & fast mutation with read-after-write visibility

A single interaction can trigger multiple small memory operations, including similarity checks, updates, deletions, and inserts. The storage layer therefore needs to handle frequent small mutations at low latency, both during live memory formation and as stored memories are continuously revised over time. If writes are slow, retrieval or the next memory-creation pass may run before newly learned information is committed, which can lead to missed conflict resolution or duplicate memories. The risk is amplified in systems where multiple turns race to read and update the same state, such as collaborating agents or operational memory like checkpoints and cross-session work logs that require exact state.

Valkey is a strong fit for this pattern because memory updates become searchable in real time on the write path. In Valkey Search, the client that issued the mutation is blocked until the index updates complete, providing read-after-write visibility once the write returns. Multithreading strengthens this model under load: background worker threads process index updates, multiple parallel connections can saturate the indexing pipeline, and scaling to more vCPUs increases both ingest and query throughput. 

### 3. Fast selective retrieval under concurrent reads and writes

The purpose of agent memory is to avoid loading the full conversation history or user profile into the prompt on every turn. Instead, the application stores facts externally and retrieves only the subset that is relevant to the current task. That means the storage layer needs to support selective retrieval under tight latency budgets, often combining scope filters such as user, agent, or session with search and ranking over the memory corpus. Further, the storage layer must sustain high concurrent read and write traffic without letting foreground retrieval slow down, because memory reads still sit on the live execution path for many agent turns. To add some numbers, Mem0's [long-term memory architecture write-up](https://mem0.ai/blog/long-term-memory-ai-agents) suggests the operating point modern memory systems should target: support for up to 10K memories per user and sub-50 ms retrieval to retrieve 20 memories at the scale of multi-million 1536-dimensional embeddings. 

Valkey Search combines scope filters and vector retrieval in a single query and chooses the least expensive hybrid execution strategy based on filter selectivity. It runs on a multi-threaded, in-memory index that scales query and ingest throughput linearly with more vCPUs, so memory maintenance and live retrieval run concurrently without pushing reads off the inference path. Valkey achieves latencies as low as microseconds and recall up to 99% on indexes containing multi-million indexed documents.

### 4. Mature caching and data life controls

Memory systems should provide TTL controls to automatically expire memories to ensure freshness, and precise deletion controls for conflict resolution, privacy, and compliance. Valkey provides mature data life controls such as per-document expiration with EXPIRE and TTL, removal of expiration with PERSIST, and support for non-blocking deletion with UNLINK. Valkey also supports hash-field expiration and introspection with commands such as HEXPIRE and HTTL, making it easier to apply different retention windows within a single memory document. Together, these primitives let teams mix short-lived session memory, durable long-term memory, and precise cleanup without building a separate lifecycle subsystem in the application.


### Valkey vs Other Open Source Solutions


| Requirement                                     | Valkey Search                                                                                                                                                     | Postgres + pgvector                                                                                                                                                                  | OpenSearch                                                                                                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Selective scoped retrieval on the live turn** | **Best fit:** one query can combine scope filters with vector retrieval. Valkey Search automatically chooses the least expensive hybrid-query execution strategy based on filter selectivity. ([Valkey blog][1])                | **Supported**, filtering is applied after the index scan with ANN indexes, so selective filters can reduce scoped recall unless you raise search effort or use iterative scans. ([pgvector docs][2]) | **Strong fit:** OpenSearch provides efficient filtered k-NN, but behavior still depends on filtering mode and engine, so recall/latency tradeoffs are more configuration-sensitive. ([OpenSearch docs][3])            |
| **Resume, handoff, long-running work**          | **Strong fit:** writes are acknowledged only after index updates complete, so the next search on the same primary sees the committed state, providing read after write. ([Valkey docs][4])           | **Strong fit:** after the writer commits, `READ COMMITTED` ensures each subsequent statement sees rows committed before the query began, providing read-after-commit. ([Postgres docs][5])                                                                    | **Supported:** read-after-write is available via `refresh=true` or `wait_for`, but the default is `false`, so writes are not searchable until the next refresh interval. ([OpenSearch docs][6])                                               |
| **High-throughput concurrent reads and writes** | **Strong fit:** Valkey Search is multi-threaded for indexing and query work, and Valkey 8 improves I/O threading for high-QPS workloads. ([Valkey blog][1]) | **Strong fit:** Postgres lets many clients read and write at the same time without blocking each other. However, every connection consumes a separate OS process, which becomes expensive at high concurrency, whereas Valkey serves many clients from a single process. ([Postgres docs][5])                    | **Supported:** OpenSearch supports bulk indexing for high-throughput writes, but under concurrent workloads, faster search visibility comes with a cost: `refresh=true` adds indexing overhead, while `wait_for` adds write latency. ([OpenSearch docs][7]) |
| **Expiry, deletion, retention**                 | **Best fit:** built-in TTL, async delete, and attribute-level expiry make session expiry and targeted cleanup straightforward. ([Valkey docs][8])                          | **Supported:** PostgreSQL does not provide a built-in document TTL or EXPIRE-style primitive; lifecycle management is typically implemented with scheduled jobs such as `pg_cron`, while precise row-level cleanup is possible with `DELETE`. ([Postgres docs][9])                                                                                              | **Supported:** OpenSearch can auto-delete entire indexes on a schedule but has no built-in way to expire individual documents on a timer, so per-memory TTLs need to be implemented in the application. ([OpenSearch docs][10])                                     |

## Production Patterns

**Anonymous-to-Authenticated Migration:** Many applications start with an anonymous session. When the user logs in, the agent needs to migrate session memories from the anonymous identifier to the authenticated user ID. With hash-backed documents in Valkey, this is a straightforward document-by-document update, and because indexed attributes are updated with each write, the migrated memories become searchable under the new user ID immediately after the update completes:

```python
# After user authenticates, migrate anonymous memories
anonymous_memories = memory.get_all(user_id="anon_session_abc")
for mem in anonymous_memories:
    memory.update(mem["id"], data={"user_id": "authenticated_user_123"})
```

**Concurrency and Consistency:** In distributed agent systems, memory bugs often come from overlapping writes or stale reads. Two agent turns may try to update the same memory at nearly the same time, causing lost updates, or one agent may read older state while another has already written a correction. Common mitigations are to serialize memory mutations per user or scope with a short-lived lock and, for high-impact attributes, version writes so downstream agents can require a minimum memory version before acting. Valkey provides the primitives for both patterns through SET NX PX for lightweight locks and INCR for atomic version counters, while the coordination policy lives in the application.

**Observability & Auditing:** Mem0 memory events and history help explain memory-driven LLM behavior, including why a fact was added, updated, deleted, or later retrieved, while Valkey provides storage- and index-level signals. If you need a Valkey-side audit stream for memory mutations, enable notify-keyspace-events and subscribe to keyspace or keyevent Pub/Sub channels; use MONITOR only for short-lived debugging. Track memory_search_latency_p99, memory_write_latency_p99, memory count per user or scope, memory mutation rates by outcome (add, update, delete, noop), retrieval score distributions, and Valkey FT.INFO and INFO for index and server health.

**Memory Index Health:** For indexes using the HNSW underlying vector index structure, frequent deletes or overwrites can leave the index less efficient over time, which can increase memory usage and degrade recall. In practice, monitor index health with FT.INFO and plan periodic rebuilds during low-traffic windows.

## Conclusion

Agent memory turns stateless LLM calls into persistent, context-aware interactions. The core mechanics are consistent across frameworks: extract facts from conversations, embed for semantic retrieval, and scope access by user, agent, and session. The storage layer underneath determines how these operations perform at scale, particularly under the fan-out, write visibility, and lifecycle management patterns that distinguish agent memory from single-query RAG. This post walked through how memory works with Mem0 and Valkey, covering the schema design, write and read pipelines, scoped retrieval patterns, and lifecycle controls. The same architectural patterns apply regardless of which memory framework or storage backend you choose. 

Start with the configuration above by following this [blog](https://mem0.ai/blog/build-persistent-memory-for-agentic-ai-applications-with-mem0-open-source-amazon-elasticache-for-valkey-and-amazon-neptune-analytics), point it at your Valkey cluster, and iterate on your scoping and retention policies as your agent's memory needs evolve.

## Resources

* [Valkey Search documentation](https://valkey.io/docs/topics/valkeysearch/)
* [Mem0 Valkey configuration reference](https://docs.mem0.ai/components/vectordbs/dbs/valkey)
* [Build persistent memory for agentic AI with Mem0, ElastiCache for Valkey, and Neptune Analytics](https://mem0.ai/blog/build-persistent-memory-for-agentic-ai-applications-with-mem0-open-source-amazon-elasticache-for-valkey-and-amazon-neptune-analytics)
* [Valkey GitHub repository](https://github.com/valkey-io/valkey)
* [Mem0 GitHub repository](https://github.com/mem0ai/mem0)



[1]: https://valkey.io/blog/valkey-search-1_2/ "Introducing Full-Text Search and Aggregations to Valkey"
[2]: https://github.com/pgvector/pgvector/blob/master/README.md "pgvector/README.md at master"
[3]: https://docs.opensearch.org/2.10/search-plugins/knn/filter-search-knn/ "k-NN search with filters - OpenSearch Documentation"
[4]: https://valkey.io/topics/search/ "Documentation: Valkey Search - Overview"
[5]: https://www.postgresql.org/docs/current/sql-set-transaction.html "Documentation: 18: SET TRANSACTION"
[6]: https://docs.opensearch.org/latest/api-reference/document-apis/update-document/ "Update Document API"
[7]: https://docs.opensearch.org/1.0/opensearch/rest-api/document-apis/bulk/ "Bulk - OpenSearch documentation"
[8]: https://valkey.io/commands/expire/ "Valkey Command · EXPIRE"
[9]: https://www.postgresql.org/docs/current/sql-delete.html "Documentation: 18: DELETE"
[10]: https://docs.opensearch.org/latest/im-plugin/ism/api/ "ISM API"
