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
  "dollars_saved": "$3,742.18",
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
