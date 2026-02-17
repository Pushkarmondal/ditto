import { Router } from "express"
import { generateContent } from "../gemini/client"
import { generateCacheKey, getExactCache, setExactCache } from "../services/cache.service"
import { getMetrics, recordRequest } from "../services/metrics.service"

const router = Router()

router.get("/health", (req, res) => {
    res.send("OK")
})

router.post("/chat", async(req, res) => {
    try {
        const {model, prompts} = req.body;
        if (!model || !prompts) {
            return res.status(400).json({
                error: "model and prompts are required",
            });
        }
        const start = Date.now();
        const checkCache = generateCacheKey({model, prompts})
        const cacheKey = await getExactCache(checkCache)
        if (cacheKey) {
            const totalLatency = Date.now() - start;
            recordRequest(totalLatency, true);
            return res.json({
                success: true,
                cached: true,
                ...cacheKey,
                total_latency_ms: totalLatency,
            })
        }
        const result = await generateContent({model, prompts})
        await setExactCache(checkCache, result);

        const totalLatency = Date.now() - start;
        recordRequest(totalLatency, false);
        return res.json({
            success: true,
            cached: false,
            ...result,
            total_latency_ms: totalLatency,
        })
    } catch (error) {
        console.error("LLM Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate content",
        });
    }
})

router.get("/metrics", (req, res) => {
    const metrics = getMetrics();
    res.json(metrics);
})

export default router