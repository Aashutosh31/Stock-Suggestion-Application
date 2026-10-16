# Deployment

## Prerequisites

- **Node.js ≥ 20** (developed on Node 26) and **npm ≥ 10** (workspaces).
- **MongoDB 7** (local Docker, or MongoDB Atlas).
- A reverse proxy that terminates TLS (Nginx, Caddy, a cloud LB) for production.

## Local development

```bash
npm install
docker compose up -d            # MongoDB on 127.0.0.1:27017
cp server/.env.example server/.env
#   set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET  →  openssl rand -base64 48
npm run seed                    # optional but recommended (demo account + data)
npm run dev                     # API :4000  +  web :5173
```

The Vite dev server proxies `/api` to `http://localhost:4000` (override with
`VITE_PROXY_TARGET`) so cookies stay same-origin. The default `MARKET_DATA_PROVIDER=demo`
requires no market-data credentials.

## Production build

```bash
npm ci
npm run build                   # server → server/dist ; client → client/dist
NODE_ENV=production npm run start
```

- `npm run build` runs `tsc --noEmit` then `vite build` for the client, and `tsc -p
  tsconfig.build.json` for the server.
- The server serves the JSON API only. Serve `client/dist` as static files from your CDN / web
  server and **proxy `/api/v1` to the API** so cookies are same-origin.

### Recommended topology

```
Browser ──TLS──► Reverse proxy ──┬── /            → client/dist (static SPA, SPA fallback to index.html)
                                 └── /api/v1       → Node API (:4000)
```

Set `TRUST_PROXY=true` behind the proxy so client IPs and rate limits are correct.

### Production guards

Startup is **refused** when `NODE_ENV=production` and:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are still placeholders or equal, or
- `COOKIE_SECURE` is not `true`.

Set `CLIENT_ORIGIN` to the exact public origin(s) (comma-separated) and `COOKIE_DOMAIN` to your
apex domain when serving the API and app on subdomains.

## Health & observability

- `GET /health` → `{ status, database, uptimeSeconds, timestamp }` (no secrets).
- `GET /api/v1/market/status` → market state; excluded from access logs.
- `GET /api/v1/admin/metrics` and `/admin/diagnostics` → token/session gated.
- Logs are structured JSON via Pino (use `pino-pretty` in dev only). Secrets are never logged.

## Docker Compose (local)

`docker-compose.yml` starts MongoDB only. Connection string:
`mongodb://127.0.0.1:27017/nivesh_terminal`. Data persists in the `nivesh-mongo-data` volume.

---

## Environment reference — Backend (`server/.env`)

Legend: **R** = required, **O** = optional (has default), **S** = secret.

| Variable | Req | Default | Description |
| -------- | :-: | ------- | ----------- |
| `NODE_ENV` | O | `development` | `development` \| `test` \| `production` |
| `PORT` | O | `4000` | HTTP port |
| `HOST` | O | `0.0.0.0` | Bind address |
| `APP_NAME` | O | `Nivesh Terminal` | Display name |
| `API_PREFIX` | O | `/api/v1` | API mount path |
| `LOG_LEVEL` | O | `info` | Pino level |
| `TRUST_PROXY` | O | `false` | Set `true` behind a proxy |
| `MONGODB_URI` | **R** | — | Mongo connection string |
| `JWT_ACCESS_SECRET` | **R/S** | — | ≥16 chars; signs access tokens |
| `JWT_REFRESH_SECRET` | **R/S** | — | ≥16 chars; must differ from access |
| `JWT_ACCESS_TTL` | O | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | O | `7d` | Refresh token lifetime |
| `BCRYPT_ROUNDS` | O | `12` | Password hash cost (8–15) |
| `COOKIE_DOMAIN` | O | *(empty)* | Cookie domain (apex for subdomains) |
| `COOKIE_SECURE` | O | `false` | **Must be `true` in production** |
| `CLIENT_ORIGIN` | **R** | `http://localhost:5173` | CORS/origin allowlist (comma-separated) |
| `MARKET_DATA_PROVIDER` | O | `demo` | `demo` \| `yahoo` |
| `MARKET_DATA_TIMEOUT_MS` | O | `8000` | Provider request timeout |
| `MARKET_DATA_RETRIES` | O | `2` | Provider retry attempts |
| `QUOTE_CACHE_TTL_SECONDS` | O | `30` | Quote cache TTL |
| `HISTORY_CACHE_TTL_SECONDS` | O | `300` | History cache TTL |
| `SEARCH_CACHE_TTL_SECONDS` | O | `3600` | Search cache TTL |
| `FUNDAMENTALS_CACHE_TTL_SECONDS` | O | `3600` | Fundamentals cache TTL |
| `MAIL_ENABLED` | O | `false` | Enable SMTP email |
| `SMTP_HOST` | O | — | SMTP host |
| `SMTP_PORT` | O | `587` | SMTP port |
| `SMTP_SECURE` | O | `false` | Use TLS |
| `SMTP_USER` | O/S | — | SMTP username |
| `SMTP_PASSWORD` | O/S | — | SMTP password |
| `MAIL_FROM` | O | `Nivesh Terminal <no-reply@nivesh.local>` | From header |
| `AI_EXPLAIN_ENABLED` | O | `false` | Enable AI text summary of computed metrics |
| `GROQ_API_KEY` | O/S | — | Groq API key; required only when AI enabled |
| `GROQ_MODEL` | O | `openai/gpt-oss-120b` | Groq model id |
| `GROQ_BASE_URL` | O | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible base URL |
| `RATE_LIMIT_WINDOW_MS` | O | `900000` | Global rate-limit window |
| `RATE_LIMIT_MAX` | O | `300` | Global max requests/window |
| `LOGIN_RATE_LIMIT_MAX` | O | `10` | Login attempts/window |
| `ADMIN_DIAGNOSTICS_TOKEN` | O/S | — | Unlocks `/admin/*` via `x-admin-token` |

## Environment reference — Frontend (`client`)

Vite exposes only variables prefixed with `VITE_`. Create `client/.env` (or `.env.local`) as
needed.

| Variable | Req | Default | Description |
| -------- | :-: | ------- | ----------- |
| `VITE_API_BASE_URL` | O | `/api/v1` | API base URL used by the client |
| `VITE_PROXY_TARGET` | O | `http://localhost:4000` | Dev-only proxy target for `/api` |

In development, leave `VITE_API_BASE_URL` unset and use the built-in proxy (same-origin cookies).
For a split deployment, set `VITE_API_BASE_URL=https://api.example.com/api/v1` at build time and
ensure `CLIENT_ORIGIN` includes the web origin and `COOKIE_DOMAIN` is set.

## Deploy checklist

1. `NODE_ENV=production`, strong distinct `JWT_*_SECRET`, `COOKIE_SECURE=true`.
2. `CLIENT_ORIGIN` = exact public origin(s); `COOKIE_DOMAIN` set if split across subdomains.
3. `TRUST_PROXY=true` behind the proxy; TLS terminated at the edge.
4. MongoDB reachable and backed up; consider Atlas with IP allowlisting.
5. Build the client with the correct `VITE_API_BASE_URL`; serve with SPA fallback.
6. Verify `GET /health` returns `ok` and login works end-to-end (cookies set).
7. Decide `MARKET_DATA_PROVIDER`: keep `demo` unless you accept Yahoo's unofficial/delayed data.
8. Leave `MAIL_ENABLED` / `AI_EXPLAIN_ENABLED` off unless configured.
