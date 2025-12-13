-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Wards table
CREATE TABLE wards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  geom GEOMETRY(Polygon, 4326) NOT NULL,
  centroid GEOMETRY(Point, 4326)
);

CREATE INDEX idx_wards_geom ON wards USING GIST (geom);
CREATE INDEX idx_wards_centroid ON wards USING GIST (centroid);

-- Sources table
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT,
  query TEXT,
  url TEXT,
  format TEXT NOT NULL,
  refresh_rate_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ward_scope INT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  auth_ref TEXT,
  last_fetch_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_source_type ON sources (source_type);
CREATE INDEX idx_sources_platform ON sources (platform);
CREATE INDEX idx_sources_is_active ON sources (is_active);
CREATE INDEX idx_sources_ward_scope ON sources USING GIN (ward_scope);

-- Raw items table (stores raw payloads)
CREATE TABLE raw_items (
  id BIGSERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  raw JSONB NOT NULL,
  raw_hash TEXT NOT NULL,
  ingest_status TEXT NOT NULL DEFAULT 'NEW',
  error TEXT
);

CREATE UNIQUE INDEX idx_raw_items_source_external ON raw_items (source_id, external_id);
CREATE INDEX idx_raw_items_hash ON raw_items (raw_hash);
CREATE INDEX idx_raw_items_published ON raw_items (published_at DESC);
CREATE INDEX idx_raw_items_status ON raw_items (ingest_status);

-- Events table
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location GEOMETRY(Point, 4326),
  location_text TEXT,
  ward_id INT REFERENCES wards(id),
  recurrence_rule TEXT,
  event_type TEXT NOT NULL,
  source_links JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_start_time ON events (start_time);
CREATE INDEX idx_events_ward_id ON events (ward_id);
CREATE INDEX idx_events_location ON events USING GIST (location);
CREATE INDEX idx_events_type ON events (event_type);

-- Clusters table (for deduplication and storylines)
CREATE TABLE clusters (
  id BIGSERIAL PRIMARY KEY,
  cluster_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  top_terms TEXT[] DEFAULT '{}',
  representative_signal_id BIGINT,
  ward_id INT REFERENCES wards(id),
  category TEXT,
  risk_score NUMERIC
);

CREATE INDEX idx_clusters_ward_created ON clusters (ward_id, created_at DESC);
CREATE INDEX idx_clusters_category ON clusters (category);

-- Signals table (normalized, user-visible)
CREATE TABLE signals (
  id BIGSERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  raw_item_id BIGINT REFERENCES raw_items(id),
  timestamp TIMESTAMPTZ NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  author TEXT,
  platform TEXT,
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  sentiment TEXT,
  sentiment_score NUMERIC,
  emotion JSONB DEFAULT '{}',
  themes JSONB DEFAULT '{}',
  entities JSONB DEFAULT '{}',
  risk_score NUMERIC,
  toxicity_score NUMERIC,
  language TEXT,
  location GEOMETRY(Point, 4326),
  place_text TEXT,
  location_confidence TEXT,
  geocode_provider TEXT,
  ward_id INT REFERENCES wards(id),
  event_id BIGINT REFERENCES events(id),
  cluster_id BIGINT REFERENCES clusters(id),
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_timestamp ON signals (timestamp DESC);
CREATE INDEX idx_signals_ward_timestamp ON signals (ward_id, timestamp DESC);
CREATE INDEX idx_signals_category_timestamp ON signals (category, timestamp DESC);
CREATE INDEX idx_signals_location ON signals USING GIST (location);
CREATE INDEX idx_signals_source_id ON signals (source_id);
CREATE INDEX idx_signals_event_id ON signals (event_id);
CREATE INDEX idx_signals_cluster_id ON signals (cluster_id);

-- Full-text search on signals
ALTER TABLE signals ADD COLUMN fts TSVECTOR;
CREATE INDEX idx_signals_fts ON signals USING GIN (fts);

CREATE OR REPLACE FUNCTION signals_fts_trigger() RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.body, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signals_fts_update BEFORE INSERT OR UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION signals_fts_trigger();

-- Update representative_signal_id foreign key after signals table is created
ALTER TABLE clusters ADD CONSTRAINT fk_clusters_representative
  FOREIGN KEY (representative_signal_id) REFERENCES signals(id);

-- Geocode cache table
CREATE TABLE geocode_cache (
  id BIGSERIAL PRIMARY KEY,
  query_hash TEXT UNIQUE NOT NULL,
  query_text TEXT NOT NULL,
  provider TEXT NOT NULL,
  result JSONB NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  confidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geocode_cache_hash ON geocode_cache (query_hash);
CREATE INDEX idx_geocode_cache_created ON geocode_cache (created_at DESC);

-- Daily rollups table
CREATE TABLE daily_rollups (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  ward_id INT REFERENCES wards(id),
  metrics JSONB NOT NULL
);

CREATE UNIQUE INDEX idx_daily_rollups_date_ward ON daily_rollups (date, ward_id);
CREATE INDEX idx_daily_rollups_date ON daily_rollups (date DESC);
CREATE INDEX idx_daily_rollups_ward ON daily_rollups (ward_id);

-- Trigger to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
