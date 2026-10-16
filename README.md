# Nivesh Terminal

A production-minded **stock research and suggestion platform for Indian equities (NSE/BSE)**.
It combines a deterministic, fully explainable scoring engine with live market data plumbing,
portfolio & paper-trading tooling, screeners, alerts and research notes — in a fast, accessible
React terminal UI.

> **Not investment advice.** Every suggestion, score and metric is a transparent, reproducible
> calculation over market data, presented for research only. The default data provider is
> **simulated** and clearly labelled as demo data.

---

## Project scope — a skills showcase

This is a **portfolio / skills-demonstration project**, and it ships in *showcase mode* by design:

- **Market data:** the deterministic simulated **`demo`** provider — no paid or unofficial feeds,
  no credentials required.
- **Email (SMTP):** **disabled** (`MAIL_ENABLED=false`). Email verification and **password reset
  are intentionally off** in this mode; the shared demo account has a fixed password, so every
  feature can be explored without a mail provider.
- **AI explanations:** disabled (`AI_EXPLAIN_ENABLED=false`).
- **Admin console / custom domains:** not configured — not required for the showcase.

Each of these is a config flip or a small drop-in if the app is ever run as a real product (see
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/MARKET_DATA.md](docs/MARKET_DATA.md)).

---

## Market data — showcase mode → bring your own

Every feature in this repo is **fully built and works end-to-end**. To showcase the product
without depending on a paid data license, it ships with a **deterministic simulated provider
(`demo`)** — quotes, candles, fundamentals and news are generated deterministically and are
clearly labelled "demo" in the UI. The `demo` data is **not live market data**.

**You're good to go with your own data.** Clone the repo and, if you have a paid or otherwise
reliable market-data source available, you only need to change the provider — the rest of the
app (screener, scoring, portfolios, paper trading, alerts, charts, news) needs no changes.
A live/delayed drop-in is already included:

```bash
MARKET_DATA_PROVIDER=yahoo   # live/delayed, unofficial — see docs/MARKET_DATA.md
```

For a licensed feed, implement the small provider interface in
`server/src/modules/market/providers/` (`quotes`, `history`, `search`, `fundamentals`, `news`,
`health`) and register it. Everything downstream consumes the same interface.

---

## Highlights

- **Explainable suggestions** — a weighted scoring engine (momentum, technical, valuation,
  quality, growth, liquidity, risk, relative) with per-component breakdowns, weight
  renormalisation over available fields, and a tunable weight profile.
- **Market data abstraction** — pluggable providers (`demo` simulated, `yahoo` live/delayed),
  with caching, timeouts, retries and health reporting. No credentials required to run.
- **Full research workflow** — screener with presets + advanced filters + CSV export, stock
  detail with charts & indicators, compare, watchlists, portfolios, paper trading, alerts,
  news, notes and saved screens.
- **Secure by default** — JWT access/refresh in HttpOnly cookies, CSRF origin guard, Helmet,
  rate limiting, Zod-validated input, bcrypt password hashing, prod fail-fast config checks.
- **Quality gates** — TypeScript strict throughout, 66 backend + 5 frontend tests, lint,
  typecheck and a production build that all pass.

## Tech stack

| Layer     | Technology |
| --------- | ---------- |
| Frontend  | React 19, Vite 8 (Rolldown), TypeScript 7, React Router 7, TanStack Query 5, Zustand, Tailwind CSS 4 + daisyUI, Radix UI, Recharts, lightweight-charts 5, sonner |
| Backend   | Node.js 20+, Express 5, TypeScript 7, Mongoose 9 / MongoDB 7, Zod 4, Pino, Helmet, express-rate-limit |
| Testing   | Vitest 5, Supertest, mongodb-memory-server, Testing Library |
| Tooling   | oxlint, Prettier, npm workspaces |

## Quick start

```bash
# 1. Install dependencies (npm workspaces)
npm install

# 2. Start MongoDB
docker compose up -d

# 3. Configure the backend
cp server/.env.example server/.env
#   …edit server/.env and set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
#   (generate with: openssl rand -base64 48)

# 4. Seed clearly-labelled demo data
npm run seed

# 5. Run both apps
npm run dev      # API on http://localhost:4000, web on http://localhost:5173
```

Open <http://localhost:5173> and sign in with the shared demo account:

| Email               | Password                     |
| ------------------- | ---------------------------- |
| `demo@nivesh.local` | `demo-access-nivesh-terminal` |

Or click **Explore demo** on the login screen (calls `POST /auth/demo`).

> The backend refuses to start in production if secrets are still placeholders, the two JWT
> secrets match, or `COOKIE_SECURE=false`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

Run from the repository root:

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Run API + web dev servers together |
| `npm run dev:server` / `npm run dev:client` | Run one side |
| `npm run build` | Type-check + build both workspaces |
| `npm run start` | Start the compiled backend (`server/dist`) |
| `npm test` | Run backend then frontend test suites |
| `npm run typecheck` | `tsc --noEmit` for both workspaces |
| `npm run lint` | oxlint for both workspaces |
| `npm run format` | Prettier write (`src/**`) |
| `npm run seed` | Seed demo data (idempotent) |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, modules, data flow
- [docs/API.md](docs/API.md) — REST endpoint reference
- [docs/SECURITY.md](docs/SECURITY.md) — auth, cookies, CSRF, hardening
- [docs/MARKET_DATA.md](docs/MARKET_DATA.md) — providers, metrics, scoring engine
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — build, run, environment reference
- [docs/TECH_DECISIONS.md](docs/TECH_DECISIONS.md) — key choices and trade-offs

## Repository layout

```
.
├── server/            # Express 5 + MongoDB API (npm workspace @nivesh/server)
│   └── src/
│       ├── config/    # env validation, db, logger
│       ├── middlewares/
│       ├── modules/   # feature modules (auth, market, stocks, …)
│       ├── routes/    # API router composition
│       ├── scripts/   # seed
│       └── tests/
├── client/            # React + Vite terminal (npm workspace @nivesh/client)
│   └── src/
│       ├── components/{ui,common,charts,layout,auth}
│       ├── hooks/  lib/  pages/  stores/  styles/
└── docs/
```

## License

MIT
