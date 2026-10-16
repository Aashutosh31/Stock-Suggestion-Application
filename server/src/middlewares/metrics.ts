interface MetricBucket {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
}

const buckets = new Map<string, MetricBucket>();
const startedAt = Date.now();
let totalRequests = 0;

function keyFor(method: string, path: string, status: number): string {
  const statusClass = `${Math.floor(status / 100)}xx`;
  return `${method} ${path} ${statusClass}`;
}

/** Lightweight in-process request metrics (no external dependencies). */
export function metricsMiddleware() {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    const start = process.hrtime.bigint();
    totalRequests++;
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
      const path = (req.route?.path as string | undefined) ?? req.baseUrl ?? req.path;
      const key = keyFor(req.method, path, res.statusCode);
      const bucket = buckets.get(key) ?? { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
      bucket.count++;
      bucket.totalMs += ms;
      bucket.maxMs = Math.max(bucket.maxMs, ms);
      if (res.statusCode >= 500) bucket.errors++;
      buckets.set(key, bucket);
    });
    next();
  };
}

export function metricsSnapshot() {
  const routes = [...buckets.entries()].map(([key, b]) => ({
    route: key,
    count: b.count,
    errors: b.errors,
    avgMs: Math.round((b.totalMs / b.count) * 100) / 100,
    maxMs: Math.round(b.maxMs * 100) / 100,
  }));
  return {
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    totalRequests,
    routes: routes.sort((a, b) => b.count - a.count).slice(0, 50),
  };
}
