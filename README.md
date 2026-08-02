# Read Receipts Server

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lie-jiu/wekit-read-receipts-cf-workers)

A message read-count tracking service built on **Cloudflare Workers** + **D1**. Embed a 1x1 transparent tracking pixel in your messages — when recipients open the message, their IP is recorded and deduplicated read counts are returned.

> ⚠️ **Privacy disclosure**: This service records recipients' IP addresses and exact open timestamps without their knowledge. In China this falls under the Personal Information Protection Law (PIPL) — inform recipients before tracking, and consider data minimization (e.g. set `RETENTION_DAYS`). WeChat's terms of service prohibit third-party tracking of this kind; your account may be at risk.

## How It Works

```
Sender                   Server                   Recipient
  |                        |                        |
  |-- POST /register ----->|                        |
  |<-- {id: sha256hex} ---|                        |
  |                        |                        |
  |  Embed pixel in message|                        |
  |                        |<--- Open message -------|
  |                        |   GET /pixel            |
  |                        |   Record reader IP      |
  |                        |                        |
  |-- GET /count --------->|                        |
  |<-- {count: 3} --------|                        |
```

## Features

- **Deterministic IDs** — Message ID = `SHA256(wxId + \0 + content + \0 + createTime)`, computed independently by client and server
- **IP Deduplication** — Same IP opening multiple times counts as 1 read (enforced at storage level via a unique index)
- **Dashboard** — Dark-themed, responsive UI with i18n (中文/English), search, filter, expandable read details
- **Serverless** — Runs on Cloudflare Workers edge network, D1 SQLite database
- **Zero cost** — Within free tier: 100k requests/day, 5GB D1 reads/day

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Bearer | Register a message, returns `{id}` |
| GET | `/pixel?wxId=&id=` | — | Tracking pixel (1x1 PNG), records reader IP (only for registered messages) |
| GET | `/count?wxId=&id=` | Bearer | Get deduplicated read count |
| GET | `/messages?q=` | Bearer | List all messages with read counts |
| DELETE | `/messages` | Bearer | Delete all messages (audited) |
| GET | `/messages/{wxId}?q=` | Bearer | List messages by sender |
| DELETE | `/messages/{wxId}` | Bearer | Delete all messages from a sender (audited) |
| GET | `/reads/{id}` | Bearer | Get detailed read records for a message |
| GET | `/` | Cookie | Dashboard frontend |
| POST | `/auth/verify` | — | Submit token, sets session cookie, redirects to `/` |
| GET | `/auth/status` | — | Returns `{auth_required: bool, weak_token: bool}` |

## Authentication

The server uses a static token (`AUTH_TOKEN`) for API access, plus short-lived session cookies for the dashboard:

- **Not set** — No authentication required (open access)
- **Set (≥ 24 chars)** — All endpoints except `/pixel`, `/auth/verify`, `/auth/status`, `/favicon.ico` require auth
- **Set (too short)** — All management endpoints return `503` until the token is rotated to ≥ 24 characters

### Login Flow

1. Visit `/` → redirected to login page
2. Enter token → POST to `/auth/verify` → sets an `__Host-session` cookie (HttpOnly, Secure, SameSite=Lax, 30 days) → redirects to `/`
3. The server stores only a SHA-256 hash of the session id; the cookie itself never contains `AUTH_TOKEN`

Legacy `auth_token` cookies (which contained the raw token) remain accepted for backward compatibility until they expire.

### API Access

Include the token in the `Authorization` header:

```
Authorization: Bearer <REDACTED>
```

### Configure with Wrangler

```bash
npx wrangler secret put AUTH_TOKEN   # generate a strong one: openssl rand -hex 32
```

## Security Features

- **Rate limiting** — `/pixel`: 10 req/min per IP; `/auth/verify`: 5 req/min per IP (fail-closed for login)
- **Registered-message check** — `/pixel` ignores reads for unregistered messages (blocks DB-filling attacks)
- **Storage-level dedup** — unique index on `reads(id, ip)` + `INSERT OR IGNORE`
- **Constant-time token comparison** — via SHA-256 digests; failed logins add randomized delay
- **Session cookies** — random id, hash-at-rest, 30-day expiry, `__Host-` prefix, Secure/HttpOnly/SameSite=Lax
- **Trusted client IP only** — `CF-Connecting-IP`; client-controlled headers are ignored
- **Security headers** — CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on all responses
- **Input validation** — length limits on register fields, LIKE-wildcard escaping, malformed-URL handling
- **Audit log** — every bulk/sender delete is recorded in the `audit_logs` table
- **Optional retention** — set `RETENTION_DAYS` to auto-purge messages/reads older than N days (daily cron, default 03:00 UTC)

## Deployment

### Option 1: Cloudflare Dashboard (No CLI)

1. Create a D1 database named `read-receipts` in Cloudflare dashboard
2. Run `schema.sql` in the D1 console (safe to re-run on existing deployments)
3. Create a Worker, paste `worker.js` into the editor
4. Add D1 binding: Variable name `DB` → select `read-receipts`
5. Set `AUTH_TOKEN` secret (≥ 24 chars) in Worker settings → Variables; optional `RETENTION_DAYS`
6. Add a Cron Trigger `0 3 * * *` (Settings → Triggers → Cron)
7. Save and deploy

### Option 2: Wrangler CLI

```bash
npm install
npx wrangler login
npx wrangler d1 create read-receipts        # copy database_id to wrangler.toml
npx wrangler d1 execute read-receipts --file=./schema.sql
npx wrangler secret put AUTH_TOKEN          # required: ≥ 24 chars, e.g. openssl rand -hex 32
npx wrangler deploy
```

### Upgrading an existing deployment

Re-run `schema.sql` once. It is idempotent and will:

- create the `sessions` and `audit_logs` tables
- deduplicate existing `reads` rows and add the unique `(id, ip)` index
- (existing readers who already re-opened a message keep their first record only)

Existing `auth_token` cookies keep working until they expire; the next login issues a session cookie.

## Project Structure

```
├── schema.sql          # D1 table definitions + idempotent migration
├── worker.js           # Worker source (API routes + dashboard frontend)
├── wrangler.toml       # Cloudflare Workers config (D1 binding + cron)
├── package.json
└── LICENSE
```

## Tech Stack

- **Runtime:** Cloudflare Workers (V8 isolates, global edge network)
- **Database:** Cloudflare D1 (SQLite-compatible)
- **Frontend:** Vanilla HTML/CSS/JS, no build step, no dependencies
- **Hashing:** Web Crypto API (SHA-256)
- **Rate limiting:** Workers Cache API (fixed window)

## License

Apache-2.0
