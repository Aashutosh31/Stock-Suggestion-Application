# Security

Nivesh Terminal handles authentication and personal financial-research data, so security is a
first-class concern rather than an afterthought. This document describes the model and the
operational checklist.

## Authentication

- **Two-token JWT scheme.** Short-lived **access** tokens (`JWT_ACCESS_TTL`, default `15m`) and
  long-lived **refresh** tokens (`JWT_REFRESH_TTL`, default `7d`), signed with **separate**
  secrets (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`).
- Tokens are delivered in **HttpOnly cookies** — never `localStorage` — so JavaScript (and XSS
  payloads) cannot read them.
- **Refresh rotation & revocation.** Each refresh token carries a `jti`; the server stores only a
  **SHA-256 hash** of the token in a `Session` document. `/auth/refresh` rotates the token, and
  `/auth/logout` revokes the session. Sessions have a **TTL index** and expire automatically.
- **Passwords** are hashed with **bcryptjs** at `BCRYPT_ROUNDS` (default 12). Password reset and
  email verification use opaque random tokens that are hashed at rest.
- `POST /auth/password/forgot` always returns a generic success response to avoid account
  enumeration.

## Cookies

| Cookie | HttpOnly | Purpose |
| ------ | -------- | ------- |
| `nv_access` | yes | Access token |
| `nv_refresh` | yes | Refresh token |
| `nv_csrf` | **no** (by design) | Double-submit CSRF token |

Cookie attributes: `SameSite=Lax` in development, **`SameSite=Strict` in production** (override
with `COOKIE_SAMESITE`); `Secure` controlled by `COOKIE_SECURE` (must be `true` in production);
optional `COOKIE_DOMAIN`; `path=/`.

> **Split-domain deployments** (e.g. Vercel frontend + Render backend on different registrable
> domains) are *cross-site*, so `SameSite=Strict`/`Lax` cookies will not be sent and login will
> silently fail. Set **`COOKIE_SAMESITE=none`** (which also forces `Secure`). Prefer same-site
> custom domains (`app.example.com` + `api.example.com`) so the default `Strict` stays in effect.

## CSRF protection

Cookie auth removes the need to store tokens in JS, but introduces CSRF risk. Two independent
layers mitigate it:

1. **`SameSite=Strict` cookies** in production prevent cross-site sending.
2. **Origin guard** (`middlewares/originGuard.ts`) — every unsafe method (`POST`/`PUT`/`PATCH`/
   `DELETE`) with an `Origin`/`Referer` header must match the `CLIENT_ORIGIN` allowlist,
   otherwise `403`. A readable `nv_csrf` cookie is also issued for the double-submit pattern.

## CORS

- Strict **origin allowlist** from `CLIENT_ORIGIN` (comma-separated). Requests from unknown
  origins are rejected.
- `credentials: true`; only the methods and headers the app actually needs are allowed
  (`Content-Type`, `Authorization`, `x-csrf-token`).

## Hardening

- **Helmet** sets safe HTTP headers (CSP is enabled in production; disabled only for the dev
  server).
- `x-powered-by` is disabled.
- Request bodies are capped at **64 kb** (JSON and urlencoded).
- **Rate limiting** — a global API limiter plus a stricter login limiter.
- **Input validation** — every mutating route validates params/query/body with **Zod**, and the
  security-sensitive schemas (auth, profile, preferences) are `.strict()`, so unknown fields are
  **rejected** rather than ignored (defence-in-depth against mass-assignment / privilege
  escalation). Filters never reach Mongo as raw query objects — the screener filters in memory.
- **Centralised error handling** — internal errors are logged server-side and returned as a
  generic message in production; details are never leaked.
- **`trust proxy`** is opt-in (`TRUST_PROXY`) so IP-based limits are correct behind a proxy.

## Data protection

- The `Session` collection stores token **hashes**, not tokens.
- `GET /users/me/export` gives users a full copy of their data; `DELETE /users/me` removes the
  account and its owned documents.
- The logger never prints secrets, tokens or passwords.

## Production fail-fast

`config/env.ts` refuses to start when `NODE_ENV=production` and any of the following hold:

- `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` still contain the placeholder prefix,
- the two secrets are identical,
- `COOKIE_SECURE` is not `true`.

Set `TRUST_PROXY=true` when running behind a reverse proxy / load balancer, and terminate TLS at
the edge.

## Secrets management

- Copy `server/.env.example` → `server/.env`; **never commit** `.env`.
- Generate secrets with `openssl rand -base64 48`.
- Rotate JWT secrets by issuing new values and forcing re-login (refresh tokens signed with the
  old secret stop validating).

## Optional integrations

- **Email** is disabled by default (`MAIL_ENABLED=false`); when disabled, reset/verification links
  are logged locally and alert emails are marked "channel disabled".
- **AI explanation** is disabled by default (`AI_EXPLAIN_ENABLED=false`). When enabled, prompts are
  sent to **Groq** (`GROQ_API_KEY`) using the `openai/gpt-oss-120b` model; only the already-computed
  metric facts for a symbol are transmitted, and the model never invents prices, metrics or
  recommendations. The API key is redacted from logs.

## Reporting

Found a vulnerability? Please open a private report rather than a public issue.
