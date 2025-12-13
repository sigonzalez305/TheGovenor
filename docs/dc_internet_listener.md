# DC Internet Listener Architecture Blueprint

## Purpose
A ward-level awareness system for Washington, DC that aggregates online and official signals, classifies sentiment and categories (Green, Yellow, Red, Blue, Pink), and surfaces actionable insights to keep residents informed and safer.

## High-Level Features
- Ward map with color-coded status per ward and drill-down detail panels.
- Broad ingestion coverage: ANC sites and calendars, Executive Office of the Mayor, DC agency announcements, official social accounts, WMATA/DDOT transportation feeds, Reddit, and approved neighborhood listservs.
- Classification pipeline: deterministic category rules plus sentiment/emotion scoring, geocoding, and urgency weighting.
- Event detection with before/during/after sentiment timelines.
- Filters for time windows, source type, topics, ward selection, and search.

## Data Sources Overview
- **Geospatial**: Ward boundaries (GeoJSON or shapefile) stored in PostGIS; neighborhood centroids lookup for geocoding fallbacks.
- **Official DC & ANC**: OANC calendar, ANC sites/documents/resolutions, Mayor newsroom/public schedule, DC.gov RSS ecosystem.
- **Official Social**: Mayor and agency handles (e.g., MayorBowser, CommAffDC, DCMOCRS, DCPoliceDept, ddotdc, dfhv_dc) and council/ANC representatives.
- **Transportation**: WMATA rail/bus social alerts (metrorailinfo, metrobusinfo), MetroAlerts email/text, DDOT and other operators.
- **Community**: Reddit (DC-focused subs and keyword search) and permissioned neighborhood listserv emails.

## Core Data Model (PostgreSQL + PostGIS)
- **Wards**: `id`, `name`, `geom`, optional `centroid`; spatial indexes.
- **Sources**: registry of every feed/handle with `slug`, `name`, `source_type`, `platform`, `handle`, `url`, `format`, `refresh_rate_minutes`, `is_active`, `wards`, `categories`, timestamps.
- **Signals**: normalized ingest with `source_id`, `timestamp`, `title`, `body`, `author`, `platform`, `tags`, `location`, `place_text`, `ward_id`, `event_id`, `category`, `sentiment`, optional `emotions`/`themes`, `ingested_at`; indexes on time, ward, category, full-text, and location.
- **Events**: `title`, `start_time`, `end_time`, `location`, `location_text`, `ward_id`, `recurrence_rule`, `source_links`, timestamps; indexes on time, ward, and location.

## Ingestion Pipeline
1. **Collectors** (scheduled workers):
   - `collector_oanc_calendar`, `collector_anc_sites`, `collector_anc_resolutions`.
   - `collector_dc_rss`, `collector_mayor_newsroom`, `collector_official_social`.
   - `collector_metro_social`, `collector_reddit`, `collector_email_imap`, `collector_twitter_stream`.
2. **Normalization**: transform each record into the Signal shape; attach source metadata and platform.
3. **Geocoding**:
   - Use explicit coordinates when present.
   - Parse addresses; geocode, then spatial join to ward.
   - Map neighborhood names to centroids; spatial join to ward.
   - If unresolved, leave `ward_id` null but searchable.
4. **Classification & Sentiment**:
   - Deterministic rules for categories (e.g., danger/crime → Red; alerts/disruptions → Yellow; sales/free → Blue; missed connections → Pink; otherwise Green).
   - Sentiment model (positive/neutral/negative) plus optional emotion distribution.
   - Urgency weighting based on source trust, recency, and category.
5. **Event Detection**:
   - Parse RRULEs from ICS/RSS; cluster similar titles/time for recurring meetings.
   - Link signals to events if within time/location windows.
   - Compute before/during/after sentiment windows (e.g., ±72 hours).

## Ward Status Calculation
- Maintain rolling windows (1h, 6h, 24h, 7d) per ward.
- Aggregate weighted category scores to select the displayed color.
- Expose freshness and data-coverage indicators by source type.

## Frontend (React) Screens & Key Components
- `/`: Ward Map Overview with choropleth, legend, layer toggles, ward status table, top stories, quick alerts.
- `/ward/:wardId`: Ward Detail tabs for timeline, themes (emotion + key phrases), sources, actions (support/recommendations), and optional compare.
- `/events`: Events explorer with list/calendar split, ward filter, type filter, recurring toggle.
- `/event/:eventId`: Event detail with sentiment timeline and related signals.
- `/daily`: Daily Community Pulse showing mood summary, ward mini-cards, theme deltas, hotspots, and support opportunities.
- `/sources`: Source registry viewer with health/freshness badges.
- `/alerts`: Unified Yellow/Red alert feed with optional mini map.
- `/search`: Global search across signals/events/sources.
- Shared layout: App shell with top nav, global filter bar (time window, categories, source types, topics, geocoded-only, hide duplicates), toast center, optional context drawer.

## Classification Rules (Initial Deterministic Set)
- **Red**: crime/violence, urgent danger, credible threats.
- **Yellow**: alerts, service disruptions, transit delays, weather cautions.
- **Blue**: sales, free offers, giveaways, mutual aid offers.
- **Pink**: missed connections, lost/found, personal requests without risk.
- **Green**: positive/community news when no higher-priority rule matches.

## Compliance & Safety
- Prefer official APIs; respect robots.txt and platform terms.
- For listservs, ingest only with permission; treat content as private by default.
- Avoid embedding raw URLs in UI; display labels/handles instead.
- Attribute sources consistently and surface collector health.

## MVP Build Order
1. Load ward GeoJSON into PostGIS; expose ward status API.
2. Implement OANC calendar and ANC site collectors; seed sources registry.
3. Add Mayor/DC.gov RSS + newsroom collectors and official social handles.
4. Add metro social + MetroAlerts ingestion; generate events for disruptions.
5. Add Reddit and permitted email ingestion; apply geocoding and classification rules.
6. Ship frontend ward map and detail pages with filters; render ward colors from aggregated scores.
7. Add event sentiment timelines and daily pulse summaries; iterate on theme/emotion models.

## Infrastructure Notes
- Backend: Spring Boot (or similar) APIs with Kafka/Redis Streams for ingestion buffering.
- Storage/search: PostgreSQL + PostGIS for core data, OpenSearch/Elasticsearch for full-text and trending queries.
- File parsing: Apache Tika for PDF/DOC ingestion.
- Optional real-time updates via WebSockets/SSE; Mapbox GL JS or Leaflet for mapping.
