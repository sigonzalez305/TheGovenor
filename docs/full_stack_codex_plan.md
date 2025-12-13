# DC Internet Listener Full-Stack Delivery Plan (Codex Build)

This document translates the requested production-grade build into an actionable monorepo plan. It assumes pnpm workspaces, PostGIS, Redis, MinIO, BullMQ workers, and a Python ML microservice. Use it as the canonical checklist for implementation and for verifying that all pieces are present end-to-end.

## Monorepo Layout
```
/ apps/
  web/       # Next.js (App Router) + TypeScript + Tailwind + React Query + Zustand + Mapbox + Recharts
  api/       # Fastify REST API (Node/TypeScript)
  worker/    # BullMQ job processors and schedulers (Node/TypeScript)
  ml/        # FastAPI Python service for NLP/ML enrichment
/ packages/
  shared/    # DTOs, Zod schemas, enums for queues, and shared types across apps
/ db/
  migrations/  # SQL migrations (PostGIS) for wards, sources, raw_items, signals, clusters, events, geocode_cache, daily_rollups
  seeds/       # Ward polygons, seed sources, optional demo data
/ infra/
  docker-compose.yml  # Postgres+PostGIS, Redis, MinIO, API, worker, web, ML
  README.md           # Local/production notes, health checks
```

Add `pnpm-workspace.yaml` at the repo root covering `apps/*` and `packages/*`.

## Environment & Secrets
Define `.env` (root) or per-app `.env.local` stubs for:
- Postgres/PostGIS connection (`DATABASE_URL`), Redis URL, S3/MinIO credentials and bucket.
- X/Twitter API credentials, Reddit script app credentials, IMAP (and optional Gmail) credentials.
- Mapbox (or other provider) geocoding token; Nominatim requires rate-limiting headers.
- Mapbox map style token for the frontend.
- ML service URL; CORS settings for web.

## Database Schema (SQL Migrations)
Implement migrations exactly as specified:
- `wards` with `geom` polygon and GiST indexes; optional `centroid` point.
- `sources` registry with refresh cadence, scope, categories, and health fields; GIN on ward scope.
- `raw_items` storing raw payloads and hashes for dedupe + ingest status.
- `signals` normalized, geocoded, and enriched data with GiST on `location`, fts column, and ward/category/time indexes.
- `clusters`, `events`, `geocode_cache`, and `daily_rollups` as defined in the build brief.
Ensure PostGIS is enabled in the first migration.

## API (Fastify, Node/TypeScript)
- Health endpoints for API, queue, DB, and object storage.
- CRUD/read endpoints for wards, ward status, signals (filters), signal detail, events, sources registry, alerts, rollups, and cluster summaries.
- Auth middleware placeholder (admin toggles for sources); rate limiting per IP.
- Shared validation via Zod schemas from `packages/shared`.

## Worker (BullMQ)
Queues: `fetch`, `parse`, `ml`, `geo`, `cluster`, `event-link`, `rollup` with repeatable jobs. Core processors:
1. `FETCH_SOURCE`: poll source, push `raw_items`.
2. `PARSE_RAW`: normalize into `signals`.
3. `ENRICH_ML`: call Python ML service; persist sentiment/emotion/entities/toxicity/themes/embedding.
4. `GEOCODE`: run provider chain, cache results, assign ward via PostGIS `ST_Contains` then nearest centroid fallback; set `location_confidence`.
5. `CLUSTER`: dedupe/cluster via embeddings; set `cluster_id` and representative.
6. `EVENT_LINK`: map signals to events based on time/location; update before/during/after metrics.
7. `ROLLUP_DAILY` and `ROLLUP_WARD_STATUS`: compute 24h ward color and daily summaries; cache in Redis.
Retry policies: exponential backoff on network, respect rate-limit reset headers, mark source inactive on auth errors.

## Ingestion Adapters
- **Twitter/X**: official API SDK with `USER_TIMELINE` and `SEARCH_RECENT` modes; store `external_id`, timestamps, geo/places if present; parse place text for geocoding when coordinates absent.
- **Reddit**: subreddit and keyword search; handle posts and comments separately; store `permalink` in `signals.url` (label it in UI, not raw).
- **Email (IMAP/Gmail)**: Message-ID dedupe; parse MIME (prefer text/plain, strip HTML/quotes); optional folder/domain filters; default privacy/redaction for PII.
- **RSS/ICS/Docs**: RSS parser; ICS with RRULE; PDF/text extraction via Tika or similar; store files in MinIO and extracted text in `raw_items`.
- **ANC/Mayor/DC agency/WMATA**: configured as `sources` entries; use fetcher functions per platform.

## ML Service (FastAPI, Python)
Endpoints:
- `POST /nlp/enrich` → language, sentiment label/score, emotion scores, toxicity score, entities, keyphrases, embedding.
- `POST /nlp/topics/batch` → BERTopic/LDA topic assignments per item.
Models: HuggingFace sentiment/emotion, spaCy NER (en_core_web_trf) with DC gazetteer, sentence-transformers embeddings, Detoxify toxicity. Stateless service invoked by Node workers.

## Geocoding
- Provider interface with adapters: `MapboxGeocodingAdapter` (uses token) and `NominatimAdapter` (rate-limited fallback).
- Cache hits via `geocode_cache` keyed by normalized `query_hash`.
- Query strategy: full address → intersection → place name + "Washington DC". Store provider, confidence, lat/lng, result payload.
- Ward assignment: `ST_Contains` polygon check; fallback nearest ward centroid within threshold; set confidence (`high/med/low/none`).

## Frontend (Next.js App Router)
- Pages: Map Overview, Ward Detail (Timeline/Themes/Events/Sources/Actions tabs), Daily Pulse, Alerts, Events, Sources registry, Search.
- Components: ward choropleth with status legend; Recharts for sentiment/emotion/theme charts; virtualized signal feeds; drawers for signal/event detail; freshness indicators.
- State: React Query for server data; Zustand for UI filters/layers; persisted filters in localStorage.
- Map: Mapbox GL JS with ward GeoJSON overlay and alert/event layers.
- Accessibility: keyboard nav, focus traps, colorblind-safe palette.

## Rollups & Analytics
- Ward status every 5 minutes: category counts, weighted sentiment, risk average, top themes; choose color (Red/Yellow/Blue/Pink/Green); cache in Redis and store in `daily_rollups`.
- Daily rollups (nightly + incremental): citywide and per-ward metrics, deltas, movers/hotspots, narrative summary text.

## Monitoring & Ops
- Health checks for API, worker (queue depth), ML, DB, Redis, MinIO; expose Prometheus metrics where possible.
- Structured logging with request IDs and source IDs; store `last_fetch_at`, `last_success_at`, `last_error` on sources.
- Admin controls to enable/disable sources and view errors.

## Compliance & Safety
- Respect platform rate limits and terms; pause sources on auth failure.
- Do not display raw email content publicly; redact phone numbers/addresses; gate source URLs behind labels.
- Attribute sources consistently and surface data freshness per widget.

## Execution Order (recommended)
1) Scaffold pnpm workspace + packages/shared.
2) Add PostGIS migrations and seeds.
3) Implement Fastify API skeleton and health checks.
4) Wire BullMQ queues and processors with schedules.
5) Build source registry endpoints + admin toggles.
6) Add Twitter ingestion; 7) Reddit; 8) Email; 9) RSS/ICS/docs.
10) Deploy ML service; 11) Geocoding + ward assignment; 12) Clustering/events; 13) Rollups; 14) Frontend pages; 15) Monitoring; 16) README with local/dev run steps.

## Deliverables Snapshot
- Running Docker Compose for local dev (`infra/docker-compose.yml`).
- API/worker services reading from env, connecting to PostGIS, Redis, MinIO, ML.
- Seeds for wards and sample sources.
- Frontend consuming live endpoints with map, ward detail, daily pulse, alerts, events, sources registry.
- Tests: API unit/integration, worker job tests, ML endpoint smoke, frontend unit/component + smoke navigation.
