# Architecture

Nivesh Terminal is a two-package npm workspace: a stateless Express API and a single-page React
client. The server owns all business logic, data access and market-data integration; the client
is a thin, cache-driven presentation layer.

```
┌─────────────────────────┐        HTTPS (cookies)        ┌──────────────────────────┐
│  Browser — React SPA    │  ───────────────────────────► │  Express 5 API           │
│  React Router + Query   │  ◄─────────────────────────── │  Routes → Services       │
│  Zustand (auth/theme)   │        JSON / CSV             │  Mongoose models         │
└─────────────────────────┘                               └───────────┬──────────────┘
                                                                       │
                                              ┌────────────────────────┼───────────────────────┐
                                              │                        │                       │
                                        ┌─────▼─────┐          ┌───────▼────────┐       ┌──────▼──────┐
                                        │  MongoDB  │          │ Market provider │       │  Mail / AI  │
                                        │  (Mongoose)│         │ demo | yahoo    │       │ (optional)  │
                                        └───────────┘          └────────────────┘       └─────────────┘
```

## Backend

### Bootstrap

- `src/config/env.ts` — Zod-validated environment. **Fails fast** on missing required values and
  refuses to boot in production on unsafe defaults (placeholder secrets, equal JWT secrets,
  `COOKIE_SECURE=false`). Never prints secrets.
- `src/config/db.ts` — Mongoose connection with readiness flag (`isDatabaseReady()`); the
  `/health` endpoint reports `ok`/`degraded` from it.
- `src/config/logger.ts` — Pino logger (`pino-http` request logging; `/health` and
  `/market/status` are excluded from auto-logging).
- `src/app.ts` — composition root: Helmet → CORS (origin allowlist) → compression →
  `express.json`/`urlencoded` (64 kb) → cookie-parser → metrics → pino-http → `/health` →
  `originGuard` → `API_PREFIX` + rate limiter + `apiRouter` → notFound/error handlers.
- `src/server.ts` — connects the DB, starts the HTTP listener, handles graceful shutdown.

### Middleware (`src/middlewares/`)

| File | Responsibility |
| ---- | -------------- |
| `auth.ts` | `requireAuth` / `optionalAuth` — verifies the access-token cookie, attaches `req.user` |
| `validate.ts` | Zod request validation (body/query/params) with typed errors |
| `originGuard.ts` | CSRF defence for unsafe methods via origin/referer allowlist |
| `rateLimit.ts` | Global API limiter + a stricter login limiter |
| `errorHandler.ts` | Central error mapper → consistent JSON; `notFoundHandler` |
| `metrics.ts` | Lightweight in-process request metrics (exposed via admin) |

### Modules (`src/modules/`)

Each feature module keeps its HTTP surface, business logic and persistence co-located:

| Module | Provides |
| ------ | -------- |
| `auth` | register / login / refresh / logout / demo / me; password change, forgot, reset; email verification; cookie + token helpers; session model |
| `users` | profile, preferences, data export, account deletion |
| `market` | provider abstraction, universe, market calendar, indicators, metrics, quotes/indices/news/search |
| `stocks` | per-symbol profile, history, indicators, fundamentals, news, recent views, compare, universe |
| `screener` | filtering, presets, saved screens, CSV export |
| `suggestions` | scoring engine, weights profile, ranked suggestions |
| `watchlists` | lists, items, ordering |
| `portfolio` | portfolios, holdings, allocation, transactions (CRUD) |
| `paper` | paper account, config, orders, trades, reset |
| `alerts` | price/indicator alerts + evaluation, and notifications |
| `research` | research notes, recently viewed |
| `admin` | health, metrics, diagnostics (token-gated) |

### Request lifecycle

`request → helmet/cors → body+cookies → rate limit → originGuard → route → validate → auth →
service → mongoose → JSON error mapper` (errors are always a JSON envelope; nothing leaks
internals in production).

### Utilities (`src/utils/`)

`errors.ts` (`AppError` + subclasses), `http.ts` (async handler + response helpers),
`cache.ts` (TTL cache used by market providers), `fetchJson.ts` (timeout + retry),
`lock.ts` (single-flight), `rng.ts` (deterministic RNG for the demo provider),
`params.ts` (parsing/coercion helpers).

## Frontend

### Entry & routing

`src/main.tsx` mounts `QueryClientProvider` + `StrictMode` + `BrowserRouter` + the sonner
`Toaster`. `src/App.tsx` declares lazy-loaded routes wrapped in `Suspense`:

- Public: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- Protected (inside `AppShell`): `/`, `/market`, `/suggestions`, `/screener`, `/compare`,
  `/stocks/:symbol`, `/watchlists`, `/portfolio`, `/paper`, `/news`, `/notes`, `/tools`,
  `/alerts`, `/saved-screens`, `/settings`, `/admin`

`RouteGuards` provides `ProtectedRoute` / `PublicOnlyRoute`; unauthenticated access redirects to
login, authenticated users skip the auth pages.

### Layers

- `lib/api.ts` — the only network client. Cookie-based (`credentials: "include"`), silent
  single-flight refresh-once on `401`, typed `ApiError`, and a `download()` helper for CSV.
- `lib/queryKeys.ts` + `hooks/queries.ts` — the entire server-state layer (TanStack Query) with
  stable cache keys, so pages never fetch ad hoc.
- `stores/` — Zustand for the two genuinely client-only concerns: `authStore` (session user) and
  `uiStore` (theme + sidebar, persisted).
- `components/ui` — Radix + Tailwind primitives (button, card, dialog, command palette, …).
- `components/charts` — `PriceChart` (lightweight-charts 5, candlesticks + volume + overlays),
  `Sparkline`, `AllocationDonut`, `ScoreCharts` (radar + component bars), `MultiLineChart`.
- `components/layout` — `AppShell` (sidebar + topbar + mobile drawer), `TickerTape`,
  `CommandPalette` (⌘K), `NotificationsMenu`, `UserMenu`, `MarketStatusPill`.
- `pages/` — one file per route; feature logic lives here, presentation in `components`.

### Design system

`src/styles/index.css` defines Tailwind CSS 4 with a custom daisyUI theme pair — `nivesh` (dark,
default) and `nivesh-light` — plus semantic tokens (`--nv-bg`, `--nv-surface`, `--nv-*`,
up/down/warn colours) consumed via `@theme inline`. Numbers use tabular figures for aligned
columns.

## Data flow (example: a suggestion)

1. Client calls `GET /api/v1/suggestions` (optionally with a weight profile).
2. `suggestions.service` builds metrics per instrument via the `market` module (provider +
   indicators), then runs `scoring.ts`.
3. Each component is scaled `0..100` over a documented band; missing components are excluded and
   the total is **renormalised over available weights**, so a partial-data stock is never
   silently under-scored. The response includes per-component scores, contributions and a
   data-completeness percentage.
4. The client renders the ranked list and the score breakdown; the AI layer (if ever enabled) may
   only *summarise already-computed values*.
