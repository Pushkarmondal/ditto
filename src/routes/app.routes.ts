import { Router } from "express";
import { generateContent } from "../gemini/client";
import {
  generateCacheKey,
  getExactCache,
  setExactCache,
} from "../services/cache.service";
import { getMetrics, recordRequest } from "../services/metrics.service";
import { embedding } from "../services/embedding.service";
import {
  queryNearest,
  upsertSemanticEntry,
} from "../repositories/semantic.repository";
import { index } from "../infra/pinecone";
import { calculateGeminiCost } from "../services/metrics";

const router = Router();

router.get("/health", (req, res) => {
  res.send("OK");
});

// router.post("/chat", async (req, res) => {
//   try {
//     const { model, prompts } = req.body;
//     const SIMILARITY_THRESHOLD = 0.92;
//     if (!model || !prompts) {
//       return res.status(400).json({
//         error: "model and prompts are required",
//       });
//     }
//     const start = Date.now();
//     const checkCache = generateCacheKey({ model, prompts });
//     const cacheKey = await getExactCache(checkCache);
//     if (cacheKey) {
//       const totalLatency = Date.now() - start;
//       recordRequest(totalLatency, true);
//       return res.json({
//         success: true,
//         cached: true,
//         ...cacheKey,
//         total_latency_ms: totalLatency,
//       });
//     }

//     const embeddingResult = await embedding({
//       model: "gemini-embedding-001",
//       text: prompts,
//     });
//     console.log("Embedding length:", embeddingResult.embedding.length);

//     // const nearest = await queryNearest({
//     //     embedding: embeddingResult.embedding,
//     //     model,
//     // });

//     // const semanticResponse = nearest?.metadata?.response as Record<string,any> | undefined;
//     // if (!semanticResponse) {
//     //     throw new Error("Semantic metadata missing response");
//     // }
//     // console.log("Nearest match:", JSON.stringify(nearest, null, 2));
//     // if(nearest && nearest.score && nearest.score > SIMILARITY_THRESHOLD) {
//     //     const totalLatency = Date.now() - start;
//     //     recordRequest(totalLatency, true);
//     //     return res.json({
//     //         ...semanticResponse,
//     //         cached: true,
//     //         type: "semantic_cache",
//     //         similarity_score: nearest.score,
//     //         total_latency_ms: totalLatency,
//     //     })
//     // }

//     const nearest = await queryNearest({
//       embedding: embeddingResult.embedding,
//       model,
//     });

//     if (nearest && nearest.score && nearest.score > SIMILARITY_THRESHOLD) {
//       console.log("Nearest match:", JSON.stringify(nearest, null, 2));
//       console.log("Similarity:", nearest?.score);
//       const metadata = nearest.metadata as any;
//       const response =
//         typeof metadata?.response === "string"
//           ? JSON.parse(metadata.response)
//           : metadata?.response;

//       if (!response) {
//         console.warn("Semantic hit but no response metadata");
//       } else {
//         return res.json({
//           ...response,
//           cached: true,
//           type: "semantic_cache",
//           similarity_score: nearest.score,
//           total_latency_ms: Date.now() - start,
//         });
//       }
//     }

//     const result = await generateContent({ model, prompts });
//     await setExactCache(checkCache, result);

//     await upsertSemanticEntry({
//       id: crypto.randomUUID(),
//       embedding: embeddingResult.embedding,
//       metadata: {
//         model,
//         prompt: prompts, // ✅ fix variable name
//         response: JSON.stringify(result), // ✅ serialize nested object
//         response_text: result.text ?? "",
//         response_latency_ms: result.latencyMs ?? 0,
//         created_at: Date.now(),
//       },
//     });
//     console.log("Nearest:", nearest);
//     console.log("Score:", nearest?.score);
//     const stats = await index.describeIndexStats();
//     console.log("Index stats:", stats);

//     const totalLatency = Date.now() - start;
//     recordRequest(totalLatency, false);
//     return res.json({
//       success: true,
//       cached: false,
//       ...result,
//       total_latency_ms: totalLatency,
//     });
//   } catch (error) {
//     console.error("LLM Error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to generate content",
//     });
//   }
// });

// router.post("/chat", async (req, res) => {
//   try {
//     const { model, prompts } = req.body;
//     const SIMILARITY_THRESHOLD = 0.85;

//     if (!model || !prompts) {
//       return res.status(400).json({
//         error: "model and prompts are required",
//       });
//     }

//     const start = Date.now();

//     // 1. Exact cache check (Redis)
//     const checkCache = generateCacheKey({ model, prompts });
//     const cacheKey = await getExactCache(checkCache);
//     if (cacheKey) {
//       const totalLatency = Date.now() - start;
//       recordRequest({ latencyMs: totalLatency, type: "exact", costSaved });
//       return res.json({
//         success: true,
//         cached: true,
//         type: "exact_cache",
//         ...cacheKey,
//         total_latency_ms: totalLatency,
//       });
//     }

//     // 2. Generate embedding
//     const embeddingResult = await embedding({
//       model: "gemini-embedding-001",
//       text: prompts,
//     });
//     // console.log("Embedding length:", embeddingResult.embedding.length);

//     // 3. Semantic cache check (Pinecone)
//     const nearest = await queryNearest({
//       embedding: embeddingResult.embedding,
//       model,
//     });

//     // console.log("Nearest:", JSON.stringify(nearest, null, 2));
//     // console.log("Score:", nearest?.score);

//     if (nearest && nearest.score && nearest.score > SIMILARITY_THRESHOLD) {
//       const metadata = nearest.metadata as any;
//       const response =
//         typeof metadata?.response === "string"
//           ? JSON.parse(metadata.response)
//           : metadata?.response;

//       if (response) {
//         const totalLatency = Date.now() - start;
//         recordRequest({ latencyMs: totalLatency, type: "semantic", costSaved });
//         return res.json({
//           cached: true,
//           type: "semantic_cache",
//           similarity_score: nearest.score,
//           total_latency_ms: totalLatency,
//           ...response,
//         });
//       } else {
//         console.warn("Semantic hit but no response in metadata");
//       }
//     }

//     // 4. Cache miss — call LLM
//     const result = await generateContent({ model, prompts });

//     const llmCost = calculateGeminiCost({
//       inputText: prompts,
//       outputText: result.text ?? "",
//     });

//     // 5. Store in Redis (exact cache)
//     await setExactCache(checkCache, result);

//     // 6. Store in Pinecone (semantic cache)
//     await upsertSemanticEntry({
//       id: crypto.randomUUID(),
//       embedding: embeddingResult.embedding,
//       metadata: {
//         model,
//         prompt: prompts,
//         response: JSON.stringify(result),
//         response_text: result.text ?? "",
//         response_latency_ms: result.latencyMs ?? 0,
//         created_at: Date.now(),
//       },
//     });

//     const stats = await index.describeIndexStats();
//     // console.log("Index stats:", stats);

//     const totalLatency = Date.now() - start;
//     recordRequest({ latencyMs: totalLatency, type: "llm", llmCost });

//     return res.json({
//       success: true,
//       cached: false,
//       type: "llm",
//       ...result,
//       total_latency_ms: totalLatency,
//     });
//   } catch (error) {
//     console.error("LLM Error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to generate content",
//     });
//   }
// });

router.post("/chat", async (req, res) => {
  try {
    const { model, prompts } = req.body;
    const SIMILARITY_THRESHOLD = 0.85;

    if (!model || !prompts) {
      return res.status(400).json({
        error: "model and prompts are required",
      });
    }

    const start = Date.now();

    // 1️⃣ Exact cache (Redis)
    const checkCache = generateCacheKey({ model, prompts });
    const cacheKey = await getExactCache(checkCache);

    if (cacheKey) {
      const totalLatency = Date.now() - start;

      const costSaved = calculateGeminiCost({
        inputText: prompts,
        outputText: cacheKey.text ?? "",
      });

      recordRequest({
        type: "exact",
        latencyMs: totalLatency,
        costSaved,
      });

      return res.json({
        success: true,
        cached: true,
        type: "exact_cache",
        ...cacheKey,
        total_latency_ms: totalLatency,
      });
    }

    // 2️⃣ Generate embedding
    const embeddingResult = await embedding({
      model: "gemini-embedding-001",
      text: prompts,
    });

    // 3️⃣ Semantic cache (Pinecone)
    const nearest = await queryNearest({
      embedding: embeddingResult.embedding,
      model,
    });

    if (nearest && nearest.score && nearest.score > SIMILARITY_THRESHOLD) {
      const metadata = nearest.metadata as any;

      const response =
        typeof metadata?.response === "string"
          ? JSON.parse(metadata.response)
          : metadata?.response;

      if (response) {
        const totalLatency = Date.now() - start;

        const costSaved = calculateGeminiCost({
          inputText: prompts,
          outputText: response.text ?? "",
        });

        recordRequest({
          type: "semantic",
          latencyMs: totalLatency,
          costSaved,
        });

        return res.json({
          cached: true,
          type: "semantic_cache",
          similarity_score: nearest.score,
          total_latency_ms: totalLatency,
          ...response,
        });
      }
    }

    // 4️⃣ LLM fallback
    const result = await generateContent({ model, prompts });

    const totalLatency = Date.now() - start;

    const llmCost = calculateGeminiCost({
      inputText: prompts,
      outputText: result.text ?? "",
    });

    recordRequest({
      type: "llm",
      latencyMs: totalLatency,
      llmCost,
    });

    // 5️⃣ Store in Redis
    await setExactCache(checkCache, result);

    // 6️⃣ Store in Pinecone
    await upsertSemanticEntry({
      id: crypto.randomUUID(),
      embedding: embeddingResult.embedding,
      metadata: {
        model,
        prompt: prompts,
        response: JSON.stringify(result),
        response_text: result.text ?? "",
        response_latency_ms: result.latencyMs ?? 0,
        created_at: Date.now(),
      },
    });

    return res.json({
      success: true,
      cached: false,
      type: "llm",
      ...result,
      total_latency_ms: totalLatency,
    });

  } catch (error) {
    console.error("LLM Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate content",
    });
  }
});

router.post("/embedding", async (req, res) => {
  const result = await embedding({
    model: "gemini-embedding-001",
    text: "Explain how AI works",
  });

  console.log("Dimension:", result.embedding_dimension);

  return res.json({
    success: true,
    embedding: result.embedding,
    embedding_dimension: result.embedding_dimension,
    provider_latency_ms: result.provider_latency_ms,
  });
});

router.get("/metrics", (req, res) => {
  const metrics = getMetrics();
  res.json(metrics);
});

router.get("/getmetrics", async(req, res) => {
  try {
    // const hitRate = ((getMetrics().exact_hits + getMetrics().semantic_hits) / (getMetrics().total_requests)) * 100;
    res.json({
      ...getMetrics()
    });
  } catch (error) {
    res.status(500).json({
      message: "Can't get metrics for process!"
    })
  }
})

export default router;
