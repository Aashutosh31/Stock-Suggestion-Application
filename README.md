# Nivesh Terminal

A production-minded **stock research and suggestion platform for Indian equities (NSE/BSE)**.
It combines a deterministic, fully explainable scoring engine with live market data plumbing,
portfolio & paper-trading tooling, screeners, alerts and research notes — in a fast, accessible
React terminal UI.

> **Not investment advice.** Every suggestion, score and metric is a transparent, reproducible
> calculation over market data, presented for research only. The default data provider is
> **simulated** and clearly labelled as demo data.

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
