import { Router } from "express";
import { generateContent } from "../gemini/client";
import {
  generateCacheKey,
  getExactCache,
  setExactCache,
} from "../services/cache.service";
import { getMetrics, recordRequest } from "../services/metrics.service";
import { embedding } from "../services/embedding.service";
import { queryNearest } from "../repositories/semantic.repository";

const router = Router();

router.get("/health", (req, res) => {
  res.send("OK");
});

router.post("/chat", async (req, res) => {
  try {
    const { model, prompts } = req.body;
    const SIMILARITY_THRESHOLD = 0.92;
    if (!model || !prompts) {
      return res.status(400).json({
        error: "model and prompts are required",
      });
    }
    const start = Date.now();
    const checkCache = generateCacheKey({ model, prompts });
    const cacheKey = await getExactCache(checkCache);
    if (cacheKey) {
      const totalLatency = Date.now() - start;
      recordRequest(totalLatency, true);
      return res.json({
        success: true,
        cached: true,
        ...cacheKey,
        total_latency_ms: totalLatency,
      });
    }

    const embeddingResult = await embedding({
      model: "gemini-embedding-001",
      text: prompts,
    });

    // const nearest = await queryNearest({
    //     embedding: embeddingResult.embedding,
    //     model,
    // });

    // const semanticResponse = nearest?.metadata?.response as Record<string,any> | undefined;
    // if (!semanticResponse) {
    //     throw new Error("Semantic metadata missing response");
    // }
    // console.log("Nearest match:", JSON.stringify(nearest, null, 2));
    // if(nearest && nearest.score && nearest.score > SIMILARITY_THRESHOLD) {
    //     const totalLatency = Date.now() - start;
    //     recordRequest(totalLatency, true);
    //     return res.json({
    //         ...semanticResponse,
    //         cached: true,
    //         type: "semantic_cache",
    //         similarity_score: nearest.score,
    //         total_latency_ms: totalLatency,
    //     })
    // }

    const nearest = await queryNearest({
      embedding: embeddingResult.embedding,
      model,
    });

    if (nearest && nearest.score && nearest.score > SIMILARITY_THRESHOLD) {
      console.log("Nearest match:", JSON.stringify(nearest, null, 2));

      const metadata = nearest.metadata as any;

      if (!metadata?.response) {
        console.warn("Semantic hit but no response metadata");
      } else {
        const totalLatency = Date.now() - start;
        recordRequest(totalLatency, true);

        return res.json({
          ...metadata.response,
          cached: true,
          type: "semantic_cache",
          similarity_score: nearest.score,
          total_latency_ms: totalLatency,
        });
      }
    }

    const result = await generateContent({ model, prompts });
    await setExactCache(checkCache, result);

    const totalLatency = Date.now() - start;
    recordRequest(totalLatency, false);
    return res.json({
      success: true,
      cached: false,
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

export default router;
