import crypto from "crypto";
import { redis } from "../infra/redis";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24;

export interface CacheParams {
  model: string;
  prompts: string;
  temperature?: number;
  systemPrompt?: string;
}

function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function generateCacheKey({ model, prompts, temperature = 0, systemPrompt = "" }: CacheParams): string {
  const normalizedPrompt = normalize(prompts);
  const normalizedSystem = normalize(systemPrompt);

  const rawKey = JSON.stringify({
    model,
    prompts: normalizedPrompt,
    temperature,
    systemPrompt: normalizedSystem,
  });

  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

  return `llm:exact:${hash}`;
}

export async function getExactCache(key: string) {
    const cached = await redis.get(key);
    if(!cached) {
        return null;
    }
    try {
        return JSON.parse(cached);
    } catch (error) {
        return null;
    }
}

export async function setExactCache(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL_SECONDS) {
    await redis.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
        NX: true,
    });
}