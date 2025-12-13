# DC Internet Listener

A full-stack web application for real-time ward-level monitoring and sentiment analysis across Washington, DC's eight wards.

## Overview

The DC Internet Listener continuously ingests, analyzes, and visualizes signals from:
- **X (Twitter)**: Official accounts + keyword/geo queries
- **Reddit**: DC subreddits + keyword searches
- **Email listservs**: IMAP ingestion (requires permission)
- **ANC + Mayor + DC agency RSS/ICS feeds**
- **WMATA social + alerts feeds**

Each signal is enriched with:
- Sentiment analysis (positive/neutral/negative)
- Emotion classification (joy, anger, fear, sadness, trust, etc.)
- Topic/theme modeling
- Entity extraction (places, addresses, organizations, people)
- Risk scoring
- Real geocoding → ward assignment via PostGIS spatial joins

The system displays ward-level status via a color-coded map:
- **Green**: Positive news/community vibe
- **Yellow**: Alerts/caution
- **Red**: Danger/safety concerns
- **Blue**: Sales/free offers
- **Pink**: Missed connections

## Architecture

### Monorepo Structure

```
/apps/web        # Next.js frontend (App Router, Tailwind, Mapbox)
/apps/api        # Fastify REST API
/apps/worker     # BullMQ workers (ingestion, parsing, enrichment)
/apps/ml         # Python FastAPI ML service (sentiment, emotion, NER, topics)
/packages/shared # Shared TypeScript types and Zod schemas
/db/migrations   # PostgreSQL + PostGIS schema migrations
/db/seeds        # Seed data (wards, sources)
/infra           # Docker Compose for local development
```

### Technology Stack

**Frontend**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Zustand (state management)
- Mapbox GL JS (mapping)
- Recharts (data visualization)

**Backend**:
- Node.js + TypeScript
- Fastify (REST API)
- PostgreSQL + PostGIS (spatial database)
- Redis (job queues + caching)
- BullMQ (job processing)

**ML/NLP Pipeline**:
- Python 3.11
- FastAPI
- HuggingFace Transformers (sentiment, emotion)
- spaCy (NER)
- Detoxify (toxicity detection)
- BERTopic (topic modeling - placeholder)

**Infrastructure**:
- Docker + Docker Compose
- MinIO (S3-compatible object storage)
- pnpm workspaces (monorepo)
- Turbo (build orchestration)

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** + **Docker Compose**
- **Python** 3.11 (for ML service)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd TheGovenor
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.local.example apps/web/.env.local

# Worker (inherits from API .env)
```

**Required environment variables**:

```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dc_listener

# Redis
REDIS_URL=redis://localhost:6379

# External APIs (optional for MVP; stub values work)
TWITTER_BEARER_TOKEN=your_token_here
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret

# Geocoding (optional)
MAPBOX_ACCESS_TOKEN=your_mapbox_token
NOMINATIM_EMAIL=your-email@example.com

# Email IMAP (optional)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-password

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### 4. Start Infrastructure with Docker Compose

```bash
pnpm docker:up
```

This starts:
- PostgreSQL + PostGIS (port 5432)
- Redis (port 6379)
- MinIO (ports 9000, 9001)
- Python ML service (port 8000)
- Fastify API (port 3001)
- BullMQ worker
- Next.js web app (port 3000)

### 5. Run Database Migrations and Seeds

```bash
# Run migrations
docker exec -it dc-listener-api pnpm run migrate

# Seed data (wards + sources)
docker exec -it dc-listener-api pnpm run seed
```

Or if running locally:

```bash
pnpm --filter @dc-listener/api run migrate
pnpm --filter @dc-listener/api run seed
```

### 6. Access the Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **ML Service**: http://localhost:8000/docs (FastAPI Swagger UI)
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)

## Development

### Run Individual Services Locally

```bash
# API
pnpm --filter @dc-listener/api run dev

# Worker
pnpm --filter @dc-listener/worker run dev

# Web
pnpm --filter @dc-listener/web run dev
```

### Build All

```bash
pnpm build
```

### Database Migrations

To create a new migration:

```bash
# Create migration file
touch db/migrations/002_your_migration_name.sql

# Run migrations
pnpm --filter @dc-listener/api run migrate
```

## Data Pipeline

### Job Flow

1. **FETCH_SOURCE**: Polls external sources (Twitter, Reddit, RSS, etc.)
2. **PARSE_RAW**: Normalizes raw data → signals table
3. **ENRICH_ML**: Calls Python ML service for sentiment, emotion, NER, topics
4. **GEOCODE**: Resolves location → assigns ward_id via PostGIS spatial join
5. **CLUSTER**: Groups similar signals (dedupe + storylines)
6. **EVENT_LINK**: Links signals to events (ANC meetings, transit disruptions, etc.)
7. **ROLLUP_DAILY**: Precomputes daily metrics by ward
8. **ROLLUP_WARD_STATUS**: Updates current ward status (green/yellow/red/blue/pink)

### Ingestion Sources

Configured in `db/seeds/002_sources.sql`:

- **Mayor's Office**: @MayorBowser, @CommAffDC, @DCMOCRS
- **DC Agencies**: @DCPoliceDept, @ddotdc, @DCDPW, @octodc
- **WMATA**: @metrorailinfo, @metrobusinfo
- **ANCs**: OANC calendar, ANC 4B RSS/ICS (add more per ANC)
- **Reddit**: r/washingtondc
- **Email**: Capitol Hill listserv (requires IMAP setup)

To add a new source:

```sql
INSERT INTO sources (slug, name, source_type, platform, handle, format, refresh_rate_minutes, is_active, categories)
VALUES ('new_source', 'New Source Name', 'OFFICIAL_SOCIAL', 'twitter', '@handle', 'json', 10, true, ARRAY['news']);
```

## API Endpoints

### Wards

- `GET /api/wards` - List all wards with GeoJSON
- `GET /api/wards/:id` - Get ward details
- `GET /api/wards/status?window=24h` - Get ward status map (1h/6h/24h/7d)

### Signals

- `GET /api/signals?wardId=1&category=red&window=24h` - List signals with filters
- `GET /api/signals/:id` - Get signal details

### Events

- `GET /api/events?wardId=1&eventType=ANC_MEETING` - List events
- `GET /api/events/:id` - Get event with before/during/after sentiment

### Sources

- `GET /api/sources` - List all sources
- `GET /api/sources/health` - Source health/freshness status

### Daily Pulse

- `GET /api/daily?date=2024-12-13&wardId=1` - Daily rollup
- `GET /api/daily/pulse` - Daily pulse for all wards

### Search

- `GET /api/search?q=metro&type=signals` - Full-text search

## ML Service API

The Python ML service (`apps/ml`) exposes:

### `POST /nlp/enrich`

Enriches a single signal with:
- Language detection
- Sentiment (label + score)
- Emotion scores (joy, anger, fear, sadness, trust, etc.)
- Toxicity score
- Named entities (places, organizations, people, addresses)
- Keyphrases

**Request**:
```json
{
  "id": "123",
  "text": "Great community meeting tonight!",
  "title": "ANC 4B Meeting",
  "metadata": {}
}
```

**Response**:
```json
{
  "id": "123",
  "language": "en",
  "sentiment_label": "positive",
  "sentiment_score": 0.95,
  "emotion_scores": {
    "joy": 0.8,
    "trust": 0.6,
    "anger": 0.1
  },
  "toxicity_score": 0.02,
  "entities": {
    "places": ["ANC 4B"],
    "organizations": [],
    "people": [],
    "addresses": []
  },
  "keyphrases": ["community", "meeting", "tonight"]
}
```

### `POST /nlp/topics/batch`

Assigns topics/themes to a batch of signals.

## Database Schema

Key tables:

- `wards`: DC ward polygons (PostGIS geometry)
- `sources`: Registry of all data sources
- `raw_items`: Raw payloads from external sources
- `signals`: Normalized, enriched signals (main table)
- `events`: ANC meetings, mayor events, transit disruptions, etc.
- `clusters`: Deduplicated signal clusters + storylines
- `geocode_cache`: Cached geocoding results
- `daily_rollups`: Precomputed daily metrics

See `db/migrations/001_init_schema.sql` for full schema.

## Frontend Screens

- **/** (Map Overview): Ward choropleth + status table
- **/ward/:id** (Ward Detail): Timeline, themes, events, sources, actions
- **/events** (Events Explorer): Upcoming and recent events
- **/event/:id** (Event Detail): Before/during/after sentiment
- **/daily** (Daily Pulse): Citywide mood + theme deltas
- **/alerts** (Alerts Feed): Yellow/red signals
- **/search** (Global Search): Full-text search across signals and events
- **/sources** (Sources Registry): Transparency + health status

## Production Deployment

### Environment Variables

Set the following for production:

- `NODE_ENV=production`
- `DATABASE_URL` (managed PostgreSQL with PostGIS)
- `REDIS_URL` (managed Redis)
- Real API keys for Twitter, Reddit, etc.
- Geocoding provider tokens (Mapbox or Google)
- SMTP/IMAP credentials for email listservs

### Scaling

- Run multiple worker instances horizontally
- Separate queues by job type (fetch, ml, geocode)
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Enable connection pooling for PostgreSQL (PgBouncer)
- CDN for Next.js static assets (Vercel, Cloudflare)

### Ward Boundary Data

For production, replace the placeholder ward polygons in `db/seeds/001_wards.sql` with actual GeoJSON from:

**DC Open Data - Wards from 2022**:
https://opendata.dc.gov/datasets/wards-from-2022

Load using `ogr2ogr` or PostGIS loader:

```bash
ogr2ogr -f "PostgreSQL" \
  PG:"host=localhost dbname=dc_listener user=postgres" \
  wards.geojson \
  -nln wards \
  -overwrite
```

## Documentation

Additional documentation in `/docs`:

- `dc_internet_listener.md`: Original architecture notes
- `full_stack_codex_plan.md`: Full build specification
- `web_app_build_guide.md`: UI component map and build guide

## Testing

```bash
# API tests (add test files in apps/api/tests/)
pnpm --filter @dc-listener/api run test

# Web tests (add test files in apps/web/tests/)
pnpm --filter @dc-listener/web run test
```

## Troubleshooting

### Database connection errors

Ensure PostgreSQL is running:

```bash
docker ps | grep postgres
```

Check connection string in `.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dc_listener
```

### BullMQ jobs not processing

Check Redis connection:

```bash
docker ps | grep redis
redis-cli ping
```

### ML service errors

The ML service downloads large models on first run. Check logs:

```bash
docker logs dc-listener-ml
```

Models are cached after first download.

### API 503 errors

Run migrations:

```bash
pnpm --filter @dc-listener/api run migrate
```

Seed wards:

```bash
pnpm --filter @dc-listener/api run seed
```

## Contributing

1. Create a feature branch from `main`
2. Implement changes with tests
3. Ensure `pnpm build` passes
4. Commit using conventional commits
5. Open a pull request

## License

MIT

## Acknowledgments

- DC Open Data for ward boundaries
- WMATA for transit data
- DC.gov for official feeds
- All community contributors and local officials

---

**Note**: This is a production-ready architecture, not an MVP. For local development without external API keys, the system will run in stub mode (no real data ingestion, but all endpoints functional).
