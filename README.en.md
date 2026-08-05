# Read Receipts Server

English | [简体中文](README.md)

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

- **Multi-user** — wxId is the account, password login, strict data isolation (each user sees only their own messages)
- **Level quotas** — new users are level 1 (keep 1 message for 1 month); level N keeps N messages for N months (max 99). Level 0 = blocked, cannot register messages. Admins can adjust levels (0–99)
- **Invite codes** — optional `INVITE_CODE` env var; when set, registration requires the code
- **Admin backend** — `ADMIN` accounts can access `/admin` to manage users, adjust levels, and delete data
- **Deterministic IDs** — Message ID = `SHA256(wxId + \0 + content + \0 + createTime)`, computed independently by client and server
- **IP Deduplication** — Same IP opening multiple times counts as 1 read (enforced at storage level via a unique index)
- **Dashboard** — Dark-themed, responsive UI with i18n (中文/English), search, filter, expandable read details, password change
- **Serverless** — Runs on Cloudflare Workers edge network, D1 SQLite database
- **Zero cost** — Within free tier: 100k requests/day, 5GB D1 reads/day

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register a message (no login required, but wxId must be a registered account), returns `{id}` |
| GET | `/pixel?wxId=&id=` | — | Tracking pixel (1x1 PNG), records reader IP (only for registered messages) |
| GET | `/count?wxId=&id=` | — | Get deduplicated read count (no login required, wxId in query) |
| GET | `/messages?q=` | Cookie | List all own messages with read counts |
| DELETE | `/messages` | Cookie | Delete all own messages (audited) |
| GET | `/messages/{wxId}?q=` | Cookie | List messages by sender (own only) |
| DELETE | `/messages/{wxId}` | Cookie | Delete all messages from a sender (own only, audited) |
| GET | `/reads/{id}` | Cookie | Get detailed read records for own message |
| GET | `/` | Cookie | Dashboard frontend (redirects to login if unauthenticated) |
| GET | `/admin` | Cookie | Admin backend (ADMIN accounts only) |
| POST | `/auth/register` | — | Register an account (wxId + password + invite code) |
| POST | `/auth/verify` | — | wxId + password login, sets session cookie |
| POST | `/auth/logout` | Cookie | Destroy current session |
| POST | `/auth/password` | Cookie | Change own password |
| GET | `/auth/status` | — | Returns `{auth_required: bool, invite_required: bool}` |
| GET | `/admin/users` | Admin | List all users |
| POST | `/admin/level` | Admin | Adjust a user's level |
| POST | `/admin/password` | Admin | Set a new password for any user |
| DELETE | `/admin/users/{wxId}` | Admin | Delete a user and all their data |
| GET | `/admin/messages` | Admin | Browse all messages |
| DELETE | `/admin/messages?wxId=` | Admin | Delete all data for a user |
| DELETE | `/admin/messages/{id}` | Admin | Delete a single message |

## Authentication

The server uses a **multi-user wxId + password** system, with short-lived session cookies for the dashboard:

- **Registration**: visit the login page → switch to "Register" → enter wxId + password (≥8 chars) + invite code → auto-login
- **Login**: wxId + password → POST to `/auth/verify` → sets an `__Host-session` cookie (HttpOnly, Secure, SameSite=Lax, 30 days) → redirects to `/`. Admins must manually visit `/admin` to access the backend
- **Sessions**: the server stores only a SHA-256 hash of a random session ID; the cookie never contains the password
- **Data isolation**: all `/messages*`, `/reads/*`, `/count`, `/register` endpoints are scoped to the currently logged-in account's wxId

### Level Quotas

New users are **level 1**. Level N means: keep up to **N messages**, each for up to **N months** (max 99). When registering a new message, the oldest message beyond the quota is auto-deleted (lazily, only at registration time). **Level 0 = blocked**, cannot register messages. Admins can adjust levels (0–99) in the backend.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INVITE_CODE` | No | Invite code. When set, registration requires it; when empty, registration is open |
| `ADMIN` | No | Comma-separated wxId list; these accounts can access the `/admin` backend. When unset, there are no admins |

```bash
npx wrangler secret put INVITE_CODE   # optional
npx wrangler variable put ADMIN       # optional, e.g.: wxid_a,wxid_b
```

## Security Features

- **Rate limiting** — `/pixel`: 10 req/min per IP; `/auth/verify`, `/auth/register`, `/auth/password`: 5 req/min per IP (fail-closed)
- **Password hashing** — PBKDF2-SHA256, per-user random salt, 100k iterations (Web Crypto, natively available in Workers)
- **Registered-message check** — `/pixel` ignores reads for unregistered messages (blocks DB-filling attacks)
- **Storage-level dedup** — unique index on `reads(id, ip)` + `INSERT OR IGNORE`
- **Constant-time password comparison** — via SHA-256 digests; failed logins add randomized delay
- **Session cookies** — random id, hash-at-rest, 30-day expiry, `__Host-` prefix, Secure/HttpOnly/SameSite=Lax
- **Trusted client IP only** — `CF-Connecting-IP`; client-controlled headers are ignored
- **Security headers** — CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on all responses
- **Input validation** — length limits on register fields, LIKE-wildcard escaping, malformed-URL handling, wxId format validation
- **Audit log** — every bulk/sender delete is recorded in the `audit_logs` table
- **Optional retention** — set `RETENTION_DAYS` to auto-purge messages/reads older than N days (daily cron, default 03:00 UTC)

## Deployment

Two options — pick the one that fits your workflow. Neither requires a D1 database ID: the database is auto-created and bound on the first deploy (Automatic provisioning, requires Wrangler ≥ 4.45.0; the ID stays in the dashboard, never in the repo).

### CLI

```bash
git clone https://github.com/lie-jiu/wekit-read-receipts-cf-workers
cd wekit-read-receipts-cf-workers
npx wrangler login
npx wrangler deploy                  # auto-creates the D1 database on first deploy
```

Initialize the database after deploying:

```bash
npx wrangler d1 execute read-receipts --file=./schema.sql --remote
```

> [!IMPORTANT]
> Run `schema.sql` once after the first deploy, otherwise every endpoint fails with missing-table errors. It is idempotent — re-run it when upgrading.

> [!NOTE]
> Local development: `npx wrangler dev` auto-creates a local D1; put local secrets in `.dev.vars` (already gitignored).

### Workers Builds (Git integration)

1. Fork this repository (or use your own)
2. Cloudflare Dashboard → **Workers & Pages → Create → Worker** → choose **Workers Builds**
3. **Connect to GitHub**, select your repository; production branch `main`, build command empty
4. `git push` to `main` auto-builds and deploys; the D1 database is auto-created on the first deploy
5. Run `schema.sql` once in the D1 database console

> [!NOTE]
> Optional env vars: `INVITE_CODE` (invite code), `ADMIN` (admin wxId list), `RETENTION_DAYS` (data retention days).

### Upgrading an existing deployment

Re-run `schema.sql` once. It is idempotent and will:

- create the `users`, `sessions`, and `audit_logs` tables
- deduplicate existing `reads` rows and add the unique `(id, ip)` index
- (existing readers who already re-opened a message keep their first record only)

> [!NOTE]
> Re-running `schema.sql` truncates the `sessions` table (all users must log in again once).

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
