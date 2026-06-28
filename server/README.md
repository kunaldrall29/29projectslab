# 29projects-api

Backend for the **Request Board / Pitch a build** form on
[29projectslab.com](https://29projectslab.com). Stores submitted briefs in
Postgres via Prisma and exposes a token-gated endpoint to read them.

Node + Express + Prisma + Postgres.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Liveness probe (Railway healthcheck). |
| `POST` | `/api/briefs` | public (rate-limited) | Store a brief. |
| `GET` | `/api/briefs` | `Bearer ADMIN_TOKEN` | List recent briefs (newest first). |

### `POST /api/briefs`
```json
{ "handle": "@you", "contact": "you@example.com", "build": "what should exist",
  "why": "why now", "domains": ["AI", "Crypto"], "source": "request-board" }
```
`build` and `contact` are required. `domains` is filtered to the known set
(AI, Crypto, IoT, Hardware, Solar, Defense). Returns `201 { ok, id }`.

### `GET /api/briefs?limit=100`
Send `Authorization: Bearer <ADMIN_TOKEN>` (or `?token=<ADMIN_TOKEN>`).
Returns `{ ok, count, briefs: [...] }`.

## Environment

See [.env.example](.env.example): `DATABASE_URL`, `ADMIN_TOKEN`,
`ALLOWED_ORIGINS` (optional), `PORT` (optional).

## Run locally
```bash
cd server
npm install
cp .env.example .env          # then edit DATABASE_URL + ADMIN_TOKEN
npx prisma migrate deploy     # apply the schema to your database
npm start                     # http://localhost:3000/health
```

## Deploy on Railway
1. New project → deploy from the GitHub repo, set the service **Root Directory** to `server`.
2. Add a **Postgres** database to the project.
3. On the service, set variables:
   - `DATABASE_URL = ${{ Postgres.DATABASE_URL }}`
   - `ADMIN_TOKEN = <long random string>`
   - (optional) `ALLOWED_ORIGINS = https://29projectslab.com,https://29projects-ui-sand.vercel.app`
4. The start command (`railway.json`) runs `prisma migrate deploy` then boots the server.

Then point the site at the service URL by setting
`<meta name="api-base" content="https://<service>.up.railway.app">` in the
site's `index.html` and redeploying.
