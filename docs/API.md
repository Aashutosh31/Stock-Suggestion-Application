# API Reference

Base URL: **`/api/v1`** (configurable via `API_PREFIX`). All responses are JSON except the CSV
export.

## Conventions

**Success envelope**

```json
{ "success": true, "data": { }, "meta": { } }
```

**Error envelope**

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "…", "details": { } } }
```

- Authentication uses **HttpOnly cookies** (`nv_access`, `nv_refresh`, `nv_csrf`), not bearer
  tokens. Send requests with credentials (the client does this automatically).
- Unsafe methods (`POST`/`PUT`/`PATCH`/`DELETE`) must originate from an allowlisted origin —
  enforced by `originGuard`.
- Zod validation errors return `400 VALIDATION_ERROR` with `details`.
- Health check is outside the prefix: `GET /health`.

Auth legend: **Public** · **Optional** (works anonymously, personalises if signed in) ·
**Auth** (requires a valid access token; `401` otherwise).

---

## Auth — `/auth`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/register` | Public | Create an account (sends verification link if mail enabled) |
| POST | `/login` | Public | Authenticate; sets access/refresh cookies |
| POST | `/refresh` | Public | Rotate refresh token, issue a new access token |
| POST | `/logout` | Public | Clear cookies and revoke the session |
| POST | `/demo` | Public | Log in to the shared demo account |
| GET | `/me` | Auth | Current user + session info |
| POST | `/password/change` | Auth | Change password (requires current password) |
| POST | `/password/forgot` | Public | Request a reset link (always generic response) |
| POST | `/password/reset` | Public | Complete a reset with a token |
| POST | `/verify-email` | Public | Confirm an email address |

## Users — `/users` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/me` | Profile |
| PATCH | `/me` | Update name/profile |
| PATCH | `/me/preferences` | Update preferences |
| GET | `/me/export` | Download all personal data (JSON) |
| DELETE | `/me` | Delete account and owned data |

## Market — `/market`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/status` | Public | Market open/closed, next open/close (Asia/Kolkata) |
| GET | `/indices` | Public | Benchmark indices (NIFTY, SENSEX, …) |
| GET | `/meta` | Public | Sectors, exchanges, capabilities |
| GET | `/search` | Public | Symbol/name search |
| GET | `/quotes` | Public | Bulk quotes — **max 50 symbols** per call |
| GET | `/news` | Public | Aggregated market news |
| GET | `/provider/health` | Public | Active provider + latency/health |

## Stocks — `/stocks`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/universe` | Public | Paginated instrument universe |
| GET | `/compare` | Public | Side-by-side comparison of symbols |
| GET | `/:symbol` | Optional | Quote + profile + fundamentals snapshot |
| GET | `/:symbol/history` | Public | OHLCV candles (range/interval) |
| GET | `/:symbol/indicators` | Public | SMA/EMA/RSI/MACD/Bollinger/ATR series |
| GET | `/:symbol/fundamentals` | Public | Fundamentals |
| GET | `/:symbol/profile` | Public | Company profile |
| GET | `/:symbol/news` | Public | Symbol-specific news |
| POST | `/:symbol/view` | Auth | Record a view (recently viewed) |

## Screener — `/screener`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/presets` | Public | Built-in screen presets |
| GET | `/` | Public | Run a screen with filters + sort + paging |
| GET | `/export.csv` | Public | Same screen, as a CSV download |
| GET | `/meta` | Optional | Filter/sort field metadata |
| GET | `/saved` | Auth | List saved screens |
| POST | `/saved` | Auth | Create or update a saved screen |
| DELETE | `/saved/:id` | Auth | Delete a saved screen |

## Suggestions — `/suggestions`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/weights` | Public | Default scoring weights |
| GET | `/` | Public | Ranked suggestions (query: `limit`, `minScore`, `sector`, `exchange`, `trend`, `includeStale`, `ai`) |
| POST | `/` | Auth | Same, with a **custom weight profile** in the body |

Both responses include a `disclaimer` and per-suggestion component breakdowns.

## Watchlists — `/watchlists` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List watchlists |
| POST | `/` | Create |
| GET | `/:id` | Get one (with items) |
| PATCH | `/:id` | Rename / update |
| DELETE | `/:id` | Delete |
| POST | `/:id/items` | Add symbol(s) |
| PATCH | `/:id/items/:symbol` | Update item (note, etc.) |
| DELETE | `/:id/items/:symbol` | Remove item |
| PUT | `/:id/order` | Reorder items |

## Portfolio — `/portfolios` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List portfolios |
| POST | `/` | Create |
| DELETE | `/:id` | Delete |
| GET | `/:id/holdings` | Holdings with live valuation |
| GET | `/:id/allocation` | Allocation by sector/instrument |
| GET | `/:id/transactions` | Transaction history |
| POST | `/:id/transactions` | Add a transaction |
| PATCH | `/transactions/:transactionId` | Update a transaction |
| DELETE | `/transactions/:transactionId` | Delete a transaction |

## Paper trading — `/paper` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/account` | Cash, positions, P&L |
| PATCH | `/config` | Starting balance / settings |
| POST | `/reset` | Reset the account |
| POST | `/orders` | Place a simulated order |
| GET | `/trades` | Trade history |

## Alerts — `/alerts` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List alerts |
| POST | `/` | Create an alert |
| PATCH | `/:id` | Update (enable/disable, thresholds) |
| DELETE | `/:id` | Delete |
| POST | `/evaluate` | Evaluate alerts against current quotes |

## Notifications — `/notifications` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/` | List notifications |
| POST | `/:id/read` | Mark one read |
| POST | `/read-all` | Mark all read |
| DELETE | `/:id` | Delete |

## Research — `/research` (all **Auth**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/recently-viewed` | Recently viewed symbols |
| GET | `/notes` | List research notes |
| POST | `/notes` | Create a note |
| PATCH | `/notes/:id` | Update a note |
| DELETE | `/notes/:id` | Delete a note |

## Admin — `/admin`

Session-authenticated admins, **or** a raw `x-admin-token` header matching
`ADMIN_DIAGNOSTICS_TOKEN` (when set). When no token is configured, extended diagnostics stay
locked.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Dependency health |
| GET | `/metrics` | Request metrics (counts, latencies) |
| GET | `/diagnostics` | Extended diagnostics (cache, provider, config summary) |

---

## Rate limiting

- Global API: `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` (default 300 / 15 min).
- Login: `LOGIN_RATE_LIMIT_MAX` (default 10) — stricter, per credentials/IP.
- Exceeding a limit returns `429` with a JSON error envelope.
