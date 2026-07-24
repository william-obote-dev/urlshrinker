# URLShrinker

Production-grade URL shortener · NestJS · Redis · PostgreSQL · Next.js

Built by William Obote Makokha as a portfolio project demonstrating:
- Distributed systems (Redis counter for collision-free ID generation)
- Caching patterns (cache-aside, write-back, TTL expiry)
- High-throughput API design (sub-5ms p99 redirect latency)
- Non-blocking analytics (fire-and-forget click tracking)
- Kubernetes-ready stateless API

---

## Architecture

```
Browser → Netlify (Next.js) → Railway (NestJS API) → Upstash (Redis)
                                                    → Neon (PostgreSQL)
```

**Redirect flow (the hot path):**
1. Client hits GET /r/:code
2. API checks Redis (~2ms hit)
3. On cache miss → PostgreSQL lookup + write-back to Redis
4. 302 redirect fires to user
5. Click tracking writes to DB asynchronously (setImmediate)

---

## Zero-Local-Setup Deployment Guide

### Step 1 — Get your free accounts (15 minutes)

Open these four tabs and sign up with GitHub in each:

| Service | URL | What it gives you |
|---------|-----|------------------|
| GitHub | github.com | Code hosting (you need this first) |
| Neon | neon.tech | Free PostgreSQL (0.5GB) |
| Upstash | upstash.com | Free Redis (10k req/day) |
| Railway | railway.app | Free Node.js hosting ($5 credit/month) |
| Netlify | netlify.com | Free static site hosting |

---

### Step 2 — Push code to GitHub

1. Go to github.com → New repository
2. Name it `urlshrinker` → Create (leave it empty)
3. Open github.com/codespaces → New codespace → your repo
4. In the Codespace terminal, run:

```bash
# Upload this project to your repo
git init
git add .
git commit -m "feat: initial URLShrinker project"
git remote add origin https://github.com/YOUR_USERNAME/urlshrinker.git
git push -u origin main
```

---

### Step 3 — Set up Neon (PostgreSQL)

1. Go to console.neon.tech
2. New Project → Name: `urlshrinker`
3. Click "Connect" → copy the connection string
   It looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
4. Save this — you need it in steps 4 and 5

The tables are created automatically when the API starts (see `initDB()` in urls.service.ts)

---

### Step 4 — Set up Upstash (Redis)

1. Go to console.upstash.com
2. Create Database → Name: `urlshrinker` → Region: nearest to you
3. Copy the "Redis URL" — looks like:
   `redis://default:PASSWORD@HOST.upstash.io:6379`
4. Save this — you need it in step 5

---

### Step 5 — Deploy Backend to Railway

1. Go to railway.app → New Project → Deploy from GitHub
2. Select your `urlshrinker` repo
3. Set the root directory to `backend`
4. Go to Variables tab → Add these:

```
DATABASE_URL     = (your Neon connection string from Step 3)
REDIS_URL        = (your Upstash Redis URL from Step 4)
PORT             = 3001
BASE_URL         = https://YOUR-APP.railway.app   ← fill in after deploy
FRONTEND_URL     = https://YOUR-APP.netlify.app   ← fill in after step 6
API_SECRET_KEY   = make-up-a-long-random-string-here
```

5. Go to Settings → Start Command: `npm run build && npm run start:prod`
6. Deploy → wait ~2 minutes → copy your Railway URL

Test it: visit `https://your-app.railway.app/api/health`
You should see: `{"status":"ok"}`

---

### Step 6 — Deploy Frontend to Netlify

1. Go to netlify.com → Add new site → Import from Git → your repo
2. Set Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/out`
5. Go to Site settings → Environment variables → Add:

```
NEXT_PUBLIC_API_URL   = https://YOUR-RAILWAY-URL.railway.app/api
NEXT_PUBLIC_API_KEY   = (same API_SECRET_KEY from step 5)
```

6. Trigger a redeploy → your site is live!

---

### Step 7 — Update Railway with Netlify URL

Go back to Railway → Variables → update:
```
FRONTEND_URL = https://your-site.netlify.app
BASE_URL     = https://your-api.railway.app/api
```

Redeploy Railway. Done. ✅

---

## Local Development (Codespaces)

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Fill in your Neon + Upstash URLs in .env
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | None | Health check |
| POST | /api/urls | x-api-key | Create short link |
| GET | /r/:code | None | Redirect (hot path) |
| GET | /api/urls | x-api-key | List all links |
| GET | /api/urls/:code | x-api-key | Get link + analytics |
| DELETE | /api/urls/:code | x-api-key | Deactivate link |
| GET | /api/dashboard | x-api-key | Overall stats |

### Create a short link

```bash
curl -X POST https://your-api.railway.app/api/urls \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{"longUrl": "https://google.com", "customAlias": "goog", "ttlSeconds": 86400}'
```

Response:
```json
{
  "shortCode": "goog",
  "shortUrl": "https://your-api.railway.app/r/goog",
  "longUrl": "https://google.com",
  "qrCode": "data:image/png;base64,...",
  "expiresAt": "2025-07-25T00:00:00Z",
  "createdAt": "2025-07-24T00:00:00Z"
}
```

---

## Key Design Decisions

### Why Base62 over UUID?
`REDIS INCR` gives an atomic global counter. Convert to Base62 (0-9a-zA-Z) and you get short, readable codes with zero collision risk by design. UUID would require collision detection on every insert.

### Why 302 not 301?
301 is cached permanently by browsers — meaning analytics stop working after the first visit. 302 forces a server round-trip every time, letting us track every click.

### Why setImmediate for analytics?
The user cares about redirect speed, not our DB write. By deferring to the next event loop tick, the redirect response fires in ~4ms. The DB write happens ~20ms later — invisible to the user.

### Why stateless API?
All session state lives in Redis and PostgreSQL. The API server holds zero state. This means you can run N replicas behind a load balancer with no changes — critical for Kubernetes HPA scaling.
