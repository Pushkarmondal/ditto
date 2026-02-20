
// interface Metrics {
//   totalRequests: number;
//   exactHits: number;
//   exactMisses: number;
//   totalLatencyMs: number;
// }

// const metrics: Metrics = {
//   totalRequests: 0,
//   exactHits: 0,
//   exactMisses: 0,
//   totalLatencyMs: 0,
// };

// export function recordRequest(latency: number, cacheHit: boolean) {
//   metrics.totalRequests++;
//   metrics.totalLatencyMs += latency;

//   if (cacheHit) {
//     metrics.exactHits++;
//   } else {
//     metrics.exactMisses++;
//   }
// }

// export function getMetrics() {
//   const hitRate =
//     metrics.totalRequests === 0
//       ? 0
//       : (metrics.exactHits / metrics.totalRequests) * 100;

//   const avgLatency =
//     metrics.totalRequests === 0
//       ? 0
//       : metrics.totalLatencyMs / metrics.totalRequests;

//   return {
//     ...metrics,
//     hitRate: `${hitRate.toFixed(2)}%`,
//     avgLatencyMs: avgLatency.toFixed(2),
//   };
// }


interface Metrics {
  totalRequests: number;

  exactHits: number;
  semanticHits: number;
  llmCalls: number;

  totalLatencyHitMs: number;
  totalLatencyMissMs: number;

  totalCostSaved: number;
  totalLLMCost: number;
}

const metrics: Metrics = {
  totalRequests: 0,

  exactHits: 0,
  semanticHits: 0,
  llmCalls: 0,

  totalLatencyHitMs: 0,
  totalLatencyMissMs: 0,

  totalCostSaved: 0,
  totalLLMCost: 0,
};

export function recordRequest({
  type,
  latencyMs,
  costSaved = 0,
  llmCost = 0,
}: {
  type: "exact" | "semantic" | "llm";
  latencyMs: number;
  costSaved?: number;
  llmCost?: number;
}) {
  metrics.totalRequests++;

  if (type === "exact") {
    metrics.exactHits++;
    metrics.totalLatencyHitMs += latencyMs;
    metrics.totalCostSaved += costSaved;
  }

  if (type === "semantic") {
    metrics.semanticHits++;
    metrics.totalLatencyHitMs += latencyMs;
    metrics.totalCostSaved += costSaved;
  }

  if (type === "llm") {
    metrics.llmCalls++;
    metrics.totalLatencyMissMs += latencyMs;
    metrics.totalLLMCost += llmCost;
  }
}

export function getMetrics() {
  const totalHits = metrics.exactHits + metrics.semanticHits;

  const hitRate =
    metrics.totalRequests === 0
      ? 0
      : (totalHits / metrics.totalRequests) * 100;

  const avgLatencyHit =
    totalHits === 0
      ? 0
      : metrics.totalLatencyHitMs / totalHits;

  const avgLatencyMiss =
    metrics.llmCalls === 0
      ? 0
      : metrics.totalLatencyMissMs / metrics.llmCalls;

  return {
    total_requests: metrics.totalRequests,

    exact_hits: metrics.exactHits,
    semantic_hits: metrics.semanticHits,
    llm_calls: metrics.llmCalls,

    cache_hit_rate: `${hitRate.toFixed(2)}%`,

    avg_latency_hit: `${Math.round(avgLatencyHit)}ms`,
    avg_latency_miss: `${(avgLatencyMiss / 1000).toFixed(2)}s`,

    dollars_saved: `$${metrics.totalCostSaved.toFixed(4)}`,
    llm_spend: `$${metrics.totalLLMCost.toFixed(4)}`,
  };
}