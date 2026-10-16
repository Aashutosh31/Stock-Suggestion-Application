import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Quote } from "@/lib/types";

const CHUNK = 50;

export function useBulkQuotes(symbols: string[]) {
  const key = [...symbols].sort().join(",");
  return useQuery({
    queryKey: ["market", "bulk-quotes", key],
    queryFn: async () => {
      const chunks: string[][] = [];
      for (let i = 0; i < symbols.length; i += CHUNK) chunks.push(symbols.slice(i, i + CHUNK));
      const results = await Promise.all(
        chunks.map((chunk) =>
          api.get<{ quotes: Quote[] }>("/market/quotes", { query: { symbols: chunk.join(",") } }).then((d) => d.quotes),
        ),
      );
      return results.flat();
    },
    enabled: symbols.length > 0,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
