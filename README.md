# Relevance Feed API (NestJS + MongoDB + Redis)

Production-like API that serves a post feed ranked by relevance (and optionally, freshness). Users can create posts, list posts with filters, like/dislike posts, and fetch categories.

## Tech stack
- NestJS (TypeScript)
- MongoDB (Mongoose)
- Redis (ioredis)
- Docker Compose

## Getting started (local)
1. Install deps:
   ```bash
   npm ci
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Start infra (from `api/`):
   ```bash
   docker-compose up -d
   ```
4. Seed database:
   ```bash
   npm run seed
   ```
5. Start API (dev):
   ```bash
   npm run start:dev
   ```

## Getting started (Docker only)
From `api/`:
```bash
docker-compose up -d
```
API will be available at `http://localhost:3000`.
The API service includes an HTTP healthcheck and sets `SYNC_INDEXES=true` in compose to ensure indexes exist at boot.

## Environment variables
Copy `.env.example` to `.env` if needed.
- `MONGODB_URI` (default: `mongodb://localhost:27017/tea_feed`)
- `REDIS_URL` (default: `redis://localhost:6379`)
- `PORT` (default: `3000`)
 - `SYNC_INDEXES` (default: `false`) — if `true`, app will call `syncIndexes()` on boot

## Authentication
All routes require the header `X-User-Id: <string>` except `/health` (public).

## Rate limiting
- Global rate limiting is enforced per user and per route using Redis counters for high accuracy and scalability.
  - Each unique combination of user (from `X-User-Id` header) and route is tracked.
  - This approach helps prevent abuse while allowing fair access for all users.
  - (Future improvements could include additional metrics, such as per-IP or global user-only limits.)
- Defaults: 100 requests per 60 seconds per route and user (header `X-User-Id`).
- On exceed, API returns `429 Too Many Requests`.
- Note: For production environments, it's recommended to implement rate limiting at the API gateway level (e.g., using Cloudflare or AWS API Gateway) to prevent excessive load on the main server.

## Health
```
GET /health
```
Response:
```json
{ "status": "ok", "mongo": "up", "redis": "up" }
```

## Data model (Mongo)
- Category: `{ _id, name, createdAt, updatedAt }`
- Post: `{ _id, authorId, categoryId, title, content, likeCount, createdAt, updatedAt }`
- Like: `{ _id, userId, postId, createdAt }` (unique on `{ userId, postId }`)

## Endpoints

### Categories
```
GET /categories
Headers: X-User-Id
```
Response:
```json
[{ "id": "...", "name": "Technology" }]
```

### Create post
```
POST /posts
Headers: X-User-Id
Body: { "categoryId": "<mongoId>", "title": "...", "content": "..." }
```
Response (201):
```json
{
  "id": "...",
  "authorId": "user_123",
  "categoryId": "...",
  "title": "...",
  "content": "...",
  "likeCount": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Get post by id
```
GET /posts/:id
Headers: X-User-Id
```
- 200: post JSON
- 404: not found
- 400: invalid id

### Like / Dislike (idempotent)
```
POST /posts/:id/like
POST /posts/:id/dislike
Headers: X-User-Id
```
Response:
```json
{ "ok": true, "liked": true }
{ "ok": true, "disliked": true }
```

### Feed (with filters and scoring)
```
GET /posts?categoryId=<id>&page=1&limit=10&fresh=true|false
Headers: X-User-Id
```
Response:
```json
{
  "page": 1,
  "limit": 10,
  "total": 5200,
  "items": [ { "id": "...", "title": "...", "likeCount": 42, "score": 1.23, "createdAt": "..." } ]
}
```
Query params:
- `categoryId` (optional): filter by category
- `page` (default 1), `limit` (default 10, max 50)
- `fresh` (default false): if true, re-rank by score

## Scoring (relevance)
We combine popularity and freshness:
- Popularity (logarithmic): `base = log10(likeCount + 1)`
- Freshness decay: `decay = 0.5^(ageHours / halfLife)` (half-life ≈ 24h)
- Score: `score = base * decay`

Behavior:
- `fresh=false`: decay effectively disabled → sorts by `likeCount` desc then `createdAt` desc
- `fresh=true`: re-ranks by computed score

Unit tests: see `src/posts/score.util.spec.ts`.

## Redis caching
- Feed pages (TTL 60s)
  - Key: `cache:feed:cat:{categoryId|all}:fresh:{0|1}:page:{page}:limit:{limit}`
  - Invalidation on like/dislike: clear category feed keys and global feed keys
- Post by id (TTL 300s)
  - Key: `cache:post:{postId}`
  - Invalidation on like/dislike
- Categories list (TTL 1h)
  - Key: `cache:categories`
  - Invalidation when categories change (rare in this project)

Note: cache invalidation currently uses `KEYS` for simplicity; in production prefer `SCAN`.

## Indexes
- `createdAt` (sort by recent)
- `{ likeCount: -1, createdAt: -1 }` (relevance order)
- `{ categoryId: 1, likeCount: -1, createdAt: -1 }` (category feed)

## Seeding
```
npm run seed
```
Creates 12 categories, ~5200 posts, and likes with a heavy‑tailed distribution (some “hot” posts).

## Error handling
Global exception filter returns consistent JSON for errors. 4xx keep the proper status/message; 500 logs the error and returns a structured body.

## Trade-offs / next steps
- Replace `KEYS` with `SCAN` for cache invalidation
- Optional: background worker to pre-compute hot posts (sorted sets)
- Optional: cursor-based pagination

## Scripts
```bash
npm run build       # compile to dist
npm run start:dev   # dev server
npm run seed        # populate database
npm test            # unit tests (scoring)
```
