
interface Metrics {
  totalRequests: number;
  exactHits: number;
  exactMisses: number;
  totalLatencyMs: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  exactHits: 0,
  exactMisses: 0,
  totalLatencyMs: 0,
};

export function recordRequest(latency: number, cacheHit: boolean) {
  metrics.totalRequests++;
  metrics.totalLatencyMs += latency;

  if (cacheHit) {
    metrics.exactHits++;
  } else {
    metrics.exactMisses++;
  }
}

export function getMetrics() {
  const hitRate =
    metrics.totalRequests === 0
      ? 0
      : (metrics.exactHits / metrics.totalRequests) * 100;

  const avgLatency =
    metrics.totalRequests === 0
      ? 0
      : metrics.totalLatencyMs / metrics.totalRequests;

  return {
    ...metrics,
    hitRate: `${hitRate.toFixed(2)}%`,
    avgLatencyMs: avgLatency.toFixed(2),
  };
}
