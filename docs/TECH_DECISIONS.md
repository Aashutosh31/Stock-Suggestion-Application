# Technical Decisions

A short record of the choices that shaped the project and their trade-offs.

## 1. Monorepo with npm workspaces

Two packages (`@nivesh/server`, `@nivesh/client`) share one lockfile and one set of root scripts.
**Why:** atomic changes across the API contract and UI, simple `npm run dev`, no extra tooling.
**Trade-off:** no per-package versioning — acceptable for a single deployable product.

## 2. TypeScript strict everywhere, no `any` escape hatches

Shared discipline of strict types on both sides. The API response shapes are mirrored in
`client/src/lib/types.ts`. **Trade-off:** some duplication of types across the boundary; kept in
check by keeping the surface small and stable.

### Gotchas hit and resolved

- **TypeScript 7 removed `baseUrl`** (`TS5102`). The client uses only
  `paths: { "@/*": ["./src/*"] }`; the `@` alias is provided by Vite at build time.
- **Vite 8 (Rolldown) requires `manualChunks` to be a function**, not an object — the object form
  throws `TypeError: manualChunks is not a function`. Chunking is therefore done with a function
  splitting `charts` / `react` / `vendor`.

## 3. Cookie-based auth (not bearer + localStorage)

HttpOnly access/refresh cookies eliminate token theft via XSS and simplify the client (no token
storage). **Trade-off:** needs CSRF defence — addressed with `SameSite=Strict` in production plus
an origin guard and a readable double-submit CSRF cookie. Separate JWT secrets and hashed,
rotating refresh sessions limit blast radius.

## 4. Explainable, deterministic scoring — no black boxes

The suggestion engine is a weighted, renormalised scoring model with per-component transparency.
**Why:** financial "recommendations" must be inspectable and reproducible; a live AI model would
be neither, and could hallucinate numbers. The optional AI layer can only *narrate already
computed values*, and is off by default. **Trade-off:** less "magical" than an LLM, deliberately
so.

## 5. Pluggable market-data providers, demo-first

A provider interface with a deterministic **`demo`** implementation lets the whole product run
with zero credentials and gives stable data for tests/screenshots; **`yahoo`** offers real
(delayed, unofficial) data behind the same interface. **Why:** the app must be honest about data
provenance and usable offline. **Trade-off:** `yahoo` is best-effort and can return `null`
fundamentals; the scorer renormalises and the UI surfaces missing data instead of inventing it.

## 6. Server-state vs. client-state split

- **TanStack Query** owns everything fetched from the API (caching, retries, invalidation,
  background refetch).
- **Zustand** owns the only two genuinely client-local concerns: the session user and persisted
  UI (theme, sidebar).

**Why:** mixing the two is the usual source of cache bugs. Keeping a hard line keeps pages thin —
they read from query hooks and never fetch ad hoc. A dedicated `queryKeys.ts` prevents key drift.

## 7. Express 5 + Zod validation at the edge

Every route validates params/query/body with Zod and returns a uniform envelope
(`{ success, data }` / `{ success:false, error }`). **Why:** consistent, typed error handling and
no unvalidated input reaching services; Zod schemas double as runtime documentation.

## 8. Single in-process TTL cache + single-flight

Market reads are cached with TTLs and coalesced via a single-flight lock. **Why:** avoids
hammering providers and keeps latency predictable without adding Redis. **Trade-off:** per-process
cache — fine for a single instance; scale out would need a shared cache.

## 9. Testing strategy

- **Unit tests** for the pure cores: indicators, scoring, market calendar, formatters.
- **Integration tests** spin up the real Express app against **`mongodb-memory-server`** and drive
  it with **Supertest** — no external services, fast and hermetic (66 backend tests).
- **Frontend tests** with Vitest + Testing Library (5 tests around formatting utilities).

**Why:** test logic and the HTTP contract, not framework internals.

## 10. Linting with oxlint (not typescript-eslint)

`typescript-eslint 8` hard-rejects **TypeScript 7** (`typescript >=4.8.4 <6.1.0`), and the
project is on TS 7. **`oxlint`** lints TS/TSX (plus React/React-hooks rules) natively without
depending on the TypeScript compiler API. A few stylistic rules are intentionally disabled
(`no-array-index-key` for static skeletons, `react/purity` for a "today" label,
`no-underscore-dangle` for Mongo's `_id`) — each disabled with a clear rationale rather than by
accident. Prettier handles formatting separately.

## 11. Tailwind CSS 4 + daisyUI custom themes

Design tokens live in CSS (`nivesh` dark default, `nivesh-light`) and are consumed through
`@theme inline`, with semantic classes (`bg-surface`, `text-muted`, up/down/warn). **Why:** a
cohesive, themeable terminal look with zero runtime CSS-in-JS and easy light/dark switching.

## 12. Charts: lightweight-charts (v5) + Recharts

- **lightweight-charts 5** for the price chart (fast canvas candlesticks + volume + overlays).
- **Recharts** for analytical visuals (allocation donut, score radar, component bars, multi-line).

**Why:** use the best tool per job. Note v5 is ESM-only and uses `chart.addSeries(CandlestickSeries,
opts)` / `createSeriesMarkers` rather than v4's `addCandlestickSeries`.

## 13. Accessibility & UX

Keyboard-operable command palette (⌘K), focus-managed Radix dialogs/menus, labelled form fields,
`RouteFallback` skeletons, explicit empty/error states, and a persistent "Demo data" / disclaimer
surface so users always know what they are looking at.

## 14. Honesty over hype

Simulated data is labelled. Scores ship with a disclaimer. Providers report health. Missing
metrics are shown as missing (never zero-filled into a misleading score). These constraints are
features, not caveats.
