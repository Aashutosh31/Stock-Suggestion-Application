import { AppError } from "./errors.js";

export interface FetchJsonOptions {
  timeoutMs: number;
  retries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });
}

/**
 * Bounded fetch-with-retry for external providers. Honors a hard timeout per
 * attempt and applies exponential backoff with jitter. Never leaks the raw
 * upstream body to callers — converts failures into AppError.upstream().
 */
export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const retries = options.retries ?? 0;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onAbort);
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; NiveshTerminal/1.0; +https://github.com/) research-client",
          accept: "application/json,text/plain,*/*",
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
          lastError = AppError.upstream(`Upstream responded ${res.status}`);
          await sleep(Math.min(2000, 250 * 2 ** attempt) + Math.random() * 150, options.signal);
          continue;
        }
        throw AppError.upstream(`Upstream responded ${res.status}`, { status: res.status });
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (err instanceof AppError && err.statusCode !== 502) throw err;
      const isAbort = err instanceof Error && (err.name === "AbortError" || err.message === "aborted");
      if (attempt < retries && !options.signal?.aborted) {
        await sleep(Math.min(2000, 250 * 2 ** attempt) + Math.random() * 150, options.signal);
        continue;
      }
      throw AppError.upstream(
        isAbort ? "Upstream request timed out" : "Upstream request failed",
        { cause: err instanceof Error ? err.message : String(err) },
      );
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    }
  }
  throw AppError.upstream("Upstream request failed", {
    cause: lastError instanceof Error ? lastError.message : String(lastError),
  });
}
