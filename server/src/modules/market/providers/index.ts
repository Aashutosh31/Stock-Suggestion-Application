import { env } from "../../../config/env.js";
import { DemoMarketDataProvider, demoProvider } from "./demo.provider.js";
import { YahooMarketDataProvider } from "./yahoo.provider.js";
import type { MarketDataProvider } from "../types.js";

const yahooProvider = new YahooMarketDataProvider();

const registry: Record<string, MarketDataProvider> = {
  demo: demoProvider,
  yahoo: yahooProvider,
};

export function getActiveProvider(): MarketDataProvider {
  return registry[env.MARKET_DATA_PROVIDER] ?? demoProvider;
}

export function getProviderById(id: string): MarketDataProvider | undefined {
  return registry[id];
}

export function listProviders(): { id: string; label: string; demo: boolean; active: boolean }[] {
  const active = getActiveProvider().id;
  return Object.values(registry).map((p) => ({
    id: p.id,
    label: p.label,
    demo: p.demo,
    active: p.id === active,
  }));
}

export { DemoMarketDataProvider, YahooMarketDataProvider };
