# ditto

> Semantic cache gateway for LLM APIs. Same question, zero cost.

---

## The Problem

Every AI startup is making the same mistake — paying full price for the same LLM call, over and over.

"Summarize this document" and "Give me a summary of this" are the same question.  
Your app treats them as two separate $0.02 API calls.  
At scale, that's thousands of dollars a month, wasted.

---

## What ditto does

ditto sits between your app and the LLM provider.

```
Your App  →  ditto  →  OpenAI / Claude / Gemini
                ↑
            Redis Cache
```

Before every LLM call, ditto:

1. Converts the prompt into a vector embedding
2. Searches for a semantically similar past request
3. If found (similarity > 0.92) → returns the cached response in ~50ms, cost $0
4. If not → calls the LLM, stores the result, returns the response

No code changes on your end. Just swap your base URL.

```
# Before
https://api.openai.com

# After  
https://your-ditto-instance.com
```

That's it.

---

## Why it works

Most caches work on exact matches. ditto works on *meaning*.

| Query A | Query B | Exact Cache | ditto |
|---|---|---|---|
| "Summarize this" | "Give me a summary" | ❌ Miss | ✅ Hit |
| "Reset my password" | "How do I reset pass?" | ❌ Miss | ✅ Hit |
| "What is React?" | "Explain React to me" | ❌ Miss | ✅ Hit |

---

## Results

- **30–50% reduction** in LLM API spend  
- **~50ms** response time on cache hits vs ~2s from LLM  
- **Zero** changes to your existing codebase  

---

## Stack

- **Node.js + Fastify/Express** — gateway server  
- **Redis Stack** — exact match cache + vector similarity search  
- **OpenAI Embeddings / transformers.js** — prompt vectorization  
- **Docker** — runs anywhere  

---

## Metrics built-in

```
GET /metrics
```

```json
{
  "total_requests": 10482,
  "cache_hit_rate": "43%",
  "tokens_saved": 1820034,
  "dollars_saved": "$200.18",
  "avg_latency_hit": "48ms",
  "avg_latency_miss": "1.8s"
}
```

---

## Quick Start

```bash
git clone https://github.com/yourhandle/ditto
cd ditto
cp .env.example .env        # add your OpenAI key/some other API_KEY(I used GEMINI_API here).
docker compose up
```

Your proxy is live at `http://localhost:3000`.

---

## When to use ditto

✅ Customer-facing chatbots (high prompt repetition)  
✅ FAQ / support automation  
✅ Document summarization pipelines  
✅ Any app where users ask similar things  

❌ Real-time data queries (stock prices, live scores)  
❌ Highly personalized, user-specific completions  

---

## Future Improvements

### 1. Scalable Storage at Billions of Output Tokens

**The Problem**

ditto currently stores full LLM responses in Redis alongside their vector embeddings. At small scale, this is fine. But when you're dealing with billions of output tokens across millions of cache entries, the numbers get uncomfortable fast:

- A single LLM response can be 500–4,000 tokens (~2–16 KB of text)
- Each embedding vector is 1,536 float32 dimensions → ~6 KB per entry
- At 10 million cached entries: **~22 GB just for vectors**, plus response payloads on top

Redis is an in-memory store. Holding that much data in RAM gets expensive and fragile.

**Planned Improvements**

- **Tiered storage architecture** — Keep only the hot/frequent entries in Redis. Evict older or rarely-hit entries to object storage (S3, GCS, R2) and lazy-load them back on a miss-but-near-hit.
- **Response compression** — Compress cached response payloads (gzip/zstd) before writing to Redis. LLM responses compress exceptionally well (60–80% reduction) due to their repetitive, natural-language structure.
- **Smart TTL & eviction policies** — Not all cached responses age equally. Implement frequency-weighted TTL: a response hit 500 times gets a longer lease than one hit once. Pair with LFU (Least Frequently Used) eviction.
- **Sharded Redis Cluster** — Distribute the vector index across multiple Redis nodes using consistent hashing on embedding space regions, so no single node becomes the bottleneck.
- **Embedding quantization** — Reduce vector storage cost by quantizing float32 embeddings to int8 (~4× smaller) with negligible similarity accuracy loss.
- **Deduplication at the chunk level** — For document summarization use cases, split and deduplicate at the paragraph/chunk level rather than caching entire responses, dramatically reducing storage per unique "concept."

---

### 2. User Response Isolation (Preventing Cross-User Cache Contamination)

**The Problem**

Right now, ditto's cache is **global** — a response cached for one user's query is a candidate for any other user's semantically similar query. This creates two serious issues:

**Privacy leak:** User A asks *"Summarize my medical report"* and gets a response back with their personal details. That response is now sitting in the cache. User B asks something semantically close — ditto might serve them User A's private medical summary.

**Context mismatch:** Even without PII, responses are often personalized by context — account state, locale, session history. A cached answer that was correct for User A may be factually wrong for User B.

**Planned Improvements**

- **Namespace-scoped cache partitions** — Prefix every cache key and vector index with a `tenantId` or `userId`. Similarity search is performed only within a user's own namespace, making cross-user hits structurally impossible.
  ```
  # Current key space
  embed:{hash}

  # Namespaced key space
  embed:{tenantId}:{hash}
  ```
- **PII & sensitive content detection before caching** — Before writing any response to the cache, run a lightweight classifier (or regex heuristics) to detect PII (emails, account numbers, names, health data). If detected, skip caching entirely for that response and serve it as a pure pass-through.
- **Per-request cache opt-out header** — Allow clients to signal that a request must never be cached or served from cache:
  ```
  X-Ditto-Cache: bypass
  X-Ditto-Cache: no-store
  ```
- **Context fingerprinting** — Incorporate a hash of stable user-context metadata (locale, user role, subscription tier) into the embedding lookup. Two users asking the same question but in different contexts will no longer match each other's cached responses.
- **Cache entry ACLs** — Each cache entry carries an owner tag. Even if a cross-namespace lookup were attempted, an ACL layer would block the read unless the requesting identity matches the owner.
- **Response audit log** — For compliance-sensitive deployments, maintain an append-only log of which cached entry was served to which user and when — enabling full traceability and the ability to purge a specific user's cached data on request (GDPR right-to-erasure).

---
