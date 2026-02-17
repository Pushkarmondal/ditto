import { Router } from "express"
import { generateContent } from "../gemini/client"

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
        const result = await generateContent({model, prompts})
        return res.json({
            success: true,
            cached: false,
            ...result,
        })
    } catch (error) {
        console.error("LLM Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate content",
        });
    }
})

export default router