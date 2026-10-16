# Market Data & Scoring Engine

Two things are kept deliberately separate and honest:

1. **Market data** — quotes, candles, fundamentals, news — obtained through a pluggable
   provider.
2. **Derived analysis** — indicators, metrics and scores — computed deterministically from that
   data.

Nothing in the system fabricates a live price. The default provider is *simulated* and every
response it drives is labelled as demo data.

## Providers

The provider abstraction lives in `server/src/modules/market/providers/`. A provider exposes a
common interface (quotes, history, search, profile, fundamentals, news, indices, health) and
declares its capabilities.

Select a provider with `MARKET_DATA_PROVIDER`:

### `demo` (default)

- Deterministic simulated market data seeded from each symbol — the **same** symbol always
  produces the same series, so tests and screenshots are stable.
- Works with **zero credentials**; ideal for local development, demos and CI.
- Explicitly marked as simulated; the client shows a **Demo data** badge.

### `yahoo` (live/delayed, unofficial)

- Uses Yahoo Finance public endpoints (`chart`, `search`, `quoteSummary`).
- **Unofficial and best-effort** — no SLA, may be rate-limited or change without notice.
- Quotes may be **delayed**; fundamentals via `quoteSummary` can return `null` for some symbols.
  Treat missing values as missing (the scorer renormalises over what is available).
- Not intended for production trading use.

Both providers are wrapped by a shared layer that applies:

| Setting | Purpose |
| ------- | ------- |
| `MARKET_DATA_TIMEOUT_MS` | Per-request timeout |
| `MARKET_DATA_RETRIES` | Retry attempts on transient failures |
| `QUOTE_CACHE_TTL_SECONDS` | Quote cache TTL |
| `HISTORY_CACHE_TTL_SECONDS` | Candle history cache TTL |
| `SEARCH_CACHE_TTL_SECONDS` | Search cache TTL |
| `FUNDAMENTALS_CACHE_TTL_SECONDS` | Fundamentals cache TTL |

A single-flight lock coalesces concurrent identical requests, and `GET /market/provider/health`
reports the active provider's health and latency.

## Market calendar

Timezone is fixed to **`Asia/Kolkata`** (`marketCalendar.ts`): Indian equity hours (09:15–15:30
IST) on trading days (weekends excluded). `GET /market/status` returns the current state and the
**next** open/close, so the UI can show an accurate market-status pill. Quotes carry a `stale`
flag when no live data is available (e.g. market closed).

## Universe

A curated universe of **108 instruments** across major Indian sectors (`universe.ts`), plus five
benchmark indices:

`NIFTY50`, `NIFTYBANK`, `SENSEX`, `NIFTYIT`, `NIFTYMIDCAP`.

Each instrument carries symbol, name, exchange (NSE/BSE), sector, industry and index membership.

## Indicators (`indicators.ts`)

Computed from candles, all pure functions:

- `sma(values, period)`, `ema(values, period)`
- `rsi(values, period=14)`
- `macd(values, fast=12, slow=26, signal=9)`
- `bollinger(values, period=20, mult=2)`
- `percentChange`, `returnsOverLookback`, `annualizedVolatility`, `maxDrawdown`
- `computeTechnicalSnapshot(candles)` — bundles SMA/RSI/trend, volume ratio, returns, volatility
  and drawdown, plus flags such as `aboveSma50`, `aboveSma200`, `goldenCross`.

## Metrics (`metrics.ts`)

`toMetrics(row)` flattens a quote + technical snapshot + fundamentals into a single
`InstrumentMetrics` record used by the screener and the scorer. `metricAvailability()` reports
what fraction of the tracked fields are present.

## Scoring engine (`suggestions/scoring.ts`)

### Default weights (sum to 1.0, transparent and tunable)

| Component | Weight | Resembles |
| --------- | -----: | --------- |
| momentum | 0.20 | Recent price momentum / returns |
| technical | 0.15 | Trend, RSI, moving-average position |
| valuation | 0.15 | P/E, P/B relative band |
| quality | 0.15 | ROE / ROCE / leverage |
| growth | 0.10 | Revenue & earnings growth |
| liquidity | 0.05 | Volume and volume ratio |
| risk | 0.10 | Volatility & drawdown (inverted) |
| relative | 0.10 | Performance vs. peers / benchmark |

### How a score is produced

1. Each raw metric is mapped to `0..100` over a **documented band** (`scale(value, worst,
   best)`), clamped, and inverted where "lower is better" (e.g. debt/equity, volatility).
2. A component with no usable input contributes **nothing** — it is not scored as zero.
3. The overall score is the weighted mean **renormalised over the weights that were available**:

   ```
   score = Σ(component_i × weight_i) / Σ(weight_i, over available components)
   ```

   so a stock with partial data is neither inflated nor unfairly penalised.
4. The response includes every **component** (key, raw value, scaled score, weight,
   contribution), the final `score`, a **data-completeness** percentage and a plain-language
   `disclaimer`.

Users can supply a **custom weight profile** via `POST /suggestions` (Auth). Weights are
validated `0..1`; unavailable components are still renormalised.

## News

`GET /market/news` and `GET /stocks/:symbol/news` return provider news items with source and
timestamp. In `demo` mode these are clearly-labelled sample headlines.

## Optional AI layer

`AI_EXPLAIN_ENABLED` (default **false**) gates a natural-language summary of
**already-computed** metrics. When enabled and `GROQ_API_KEY` is present, the request is sent to
**Groq's** OpenAI-compatible API using the open-weights **`openai/gpt-oss-120b`** model
(`GROQ_MODEL`). The model may only narrate verified numbers — it can never introduce new prices
or scores. When disabled, the deterministic breakdown is returned as-is.

## Limitations (documented honestly)

- `yahoo` is unofficial/delayed and its fundamentals are best-effort (`null` values possible).
- Indices and history depend on provider coverage; the demo provider always returns data.
- The universe is a curated subset, not the full exchange.
- Scores are analytical rankings, **not** buy/sell recommendations, and carry no performance
  guarantee.
