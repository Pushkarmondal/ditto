import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface EmbedParams {
  model: string;
  text: string;
}

export async function embedding({ model, text }: EmbedParams) {
  const start = Date.now();

  const response = await ai.models.embedContent({
    model,
    contents: normalize(text),
  });

  const latencyMs = Date.now() - start;

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length === 0) {
    throw new Error("Embedding generation failed");
  }

  return {
    embedding,
    embedding_dimension: embedding.length,
    provider_latency_ms: latencyMs,
  };
}
