import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

function cleanOutput(text: string) {
  return text
    .replace(/\*\*/g, "")       
    .replace(/\n+/g, " ")       
    .trim();
}

export interface generateParams {
    model: string,
    prompts: string
}

export async function generateContent({model, prompts }: generateParams) {
  try {
    const start = Date.now();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompts,
    });
    const latency = Date.now() - start;
    const latencySeconds = latency / 1000;
    return {text: cleanOutput(response.text || ""), latencySeconds};
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {text: "", latency: 0};
  }
}
