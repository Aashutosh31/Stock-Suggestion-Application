const tails = new Map<string, Promise<unknown>>();

/** Serializes async operations per key within this process (prevents trade races). */
export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  // Track a settled marker so the map does not grow unbounded.
  const marker = run.then(
    () => undefined,
    () => undefined,
  );
  tails.set(key, marker);
  marker.finally(() => {
    if (tails.get(key) === marker) tails.delete(key);
  });
  return run;
}
