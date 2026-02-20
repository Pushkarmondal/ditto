interface Metrics {
  totalRequests: number;
  exactHits: number;
  semanticHits: number;
  llmCalls: number;
  totalTokensSaved: number;
  totalLatencyHit: number;
  totalLatencyMiss: number;
  hitCount: number;
  missCount: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  exactHits: 0,
  semanticHits: 0,
  llmCalls: 0,
  totalTokensSaved: 0,
  totalLatencyHit: 0,
  totalLatencyMiss: 0,
  hitCount: 0,
  missCount: 0,
};

export function calculateGeminiCost({
  inputText,
  outputText,
}: {
  inputText: string;
  outputText: string;
}) {
  const INPUT_RATE = 0.000125;   // per 1K chars
  const OUTPUT_RATE = 0.000375;  // per 1K chars

  const inputCost = (inputText.length / 1000) * INPUT_RATE;
  const outputCost = (outputText.length / 1000) * OUTPUT_RATE;

  return inputCost + outputCost;
}

export function recordRequest({
  type,
  latencyMs,
  tokenUsed = 0,
  tokenSaved = 0,
}: {
  type: "exact" | "sementic" | "llm";
  latencyMs: number;
  tokenUsed?: number;
  tokenSaved?: number;
}) {
  metrics.totalRequests++;

  if (type === "exact") {
    metrics.exactHits++;
    metrics.hitCount++;
    metrics.totalLatencyHit += latencyMs;
    metrics.totalTokensSaved += tokenSaved;
  }

  if (type === "sementic") {
    metrics.semanticHits++;
    metrics.hitCount++;
    metrics.totalLatencyHit += latencyMs;
    metrics.totalTokensSaved += tokenSaved;
  }

  if (type === "llm") {
    metrics.llmCalls++;
    metrics.missCount++;
    metrics.totalLatencyMiss += latencyMs;
  }
}
