# Read Receipts Server

A message read-count tracking service built on **Cloudflare Workers** + **D1**. Embed a 1x1 transparent tracking pixel in your messages — when recipients open the message, their IP is recorded and deduplicated read counts are returned.

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
- **IP Deduplication** — Same IP opening multiple times counts as 1 read
- **Dashboard** — Dark-themed, responsive UI with i18n (中文/English), search, filter, expandable read details
- **Serverless** — Runs on Cloudflare Workers edge network, D1 SQLite database
- **Zero cost** — Within free tier: 100k requests/day, 5GB D1 reads/day

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Bearer | Register a message, returns `{id}` |
| GET | `/pixel?wxId=&id=` | — | Tracking pixel (1x1 PNG), records reader IP |
| GET | `/count?wxId=&id=` | Bearer | Get deduplicated read count |
| GET | `/messages?q=` | Bearer | List all messages with read counts |
| DELETE | `/messages` | Bearer | Delete all messages |
| GET | `/messages/{wxId}?q=` | Bearer | List messages by sender |
| DELETE | `/messages/{wxId}` | Bearer | Delete all messages from a sender |
| GET | `/reads/{id}` | Bearer | Get detailed read records for a message |
| GET | `/` | Cookie | Dashboard frontend |
| POST | `/auth/verify` | — | Submit token, sets cookie, redirects to `/` |
| GET | `/auth/status` | — | Returns `{auth_required: bool}` |

## Authentication

The server uses a static token for dashboard and API authentication. Configure via the `AUTH_TOKEN` environment variable:

- **Not set** — No authentication required (open access)
- **Set** — All endpoints except `/pixel`, `/auth/verify`, `/auth/status`, `/favicon.ico` require auth

### Login Flow

1. Visit `/` → redirected to login page
2. Enter token → POST to `/auth/verify` → sets `auth_token` cookie → redirects to `/`

### API Access

Include the token in the `Authorization` header:

```
Authorization: Bearer <REDACTED>
```

### Configure with Wrangler

```bash
npx wrangler secret put AUTH_TOKEN
```

## Deployment

### Option 1: Cloudflare Dashboard (No CLI)

1. Create a D1 database named `read-receipts` in Cloudflare dashboard
2. Run `schema.sql` in the D1 console
3. Create a Worker, paste `worker.js` into the editor
4. Add D1 binding: Variable name `DB` → select `read-receipts`
5. (Optional) Set `AUTH_TOKEN` secret in Worker settings → Variables
6. Save and deploy

### Option 2: Wrangler CLI

```bash
npm install
npx wrangler login
npx wrangler d1 create read-receipts        # copy database_id to wrangler.toml
npx wrangler d1 execute read-receipts --file=./schema.sql
npx wrangler secret put AUTH_TOKEN          # optional: set auth token
npx wrangler deploy
```

## Project Structure

```
├── src/
│   ├── index.js        # Worker source (API routes + logic)
│   └── index.html      # Dashboard frontend
├── schema.sql          # D1 table definitions
├── worker.js           # Single-file build (for dashboard upload)
├── build.js            # Build script to merge src into worker.js
├── wrangler.toml       # Cloudflare Workers config
└── package.json
```

## Tech Stack

- **Runtime:** Cloudflare Workers (V8 isolates, global edge network)
- **Database:** Cloudflare D1 (SQLite-compatible)
- **Frontend:** Vanilla HTML/CSS/JS, no build step, no dependencies
- **Hashing:** Web Crypto API (SHA-256)

## License

MIT
