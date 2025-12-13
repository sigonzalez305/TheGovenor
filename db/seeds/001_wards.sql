-- Seed DC Ward boundaries
-- These are approximate centroids and simplified polygons for Ward 1-8
-- In production, load actual GeoJSON from DC Open Data

-- Note: Actual ward geometries should be loaded from:
-- https://opendata.dc.gov/datasets/wards-from-2022
-- This is simplified placeholder data for initial development

INSERT INTO wards (id, name, geom, centroid) VALUES
(1, 'Ward 1',
  ST_GeomFromText('POLYGON((-77.05 38.93, -77.01 38.93, -77.01 38.97, -77.05 38.97, -77.05 38.93))', 4326),
  ST_GeomFromText('POINT(-77.03 38.95)', 4326)),
(2, 'Ward 2',
  ST_GeomFromText('POLYGON((-77.05 38.89, -77.01 38.89, -77.01 38.93, -77.05 38.93, -77.05 38.89))', 4326),
  ST_GeomFromText('POINT(-77.03 38.91)', 4326)),
(3, 'Ward 3',
  ST_GeomFromText('POLYGON((-77.09 38.93, -77.05 38.93, -77.05 38.97, -77.09 38.97, -77.09 38.93))', 4326),
  ST_GeomFromText('POINT(-77.07 38.95)', 4326)),
(4, 'Ward 4',
  ST_GeomFromText('POLYGON((-77.05 38.97, -77.01 38.97, -77.01 39.01, -77.05 39.01, -77.05 38.97))', 4326),
  ST_GeomFromText('POINT(-77.03 38.99)', 4326)),
(5, 'Ward 5',
  ST_GeomFromText('POLYGON((-77.01 38.93, -76.97 38.93, -76.97 38.97, -77.01 38.97, -77.01 38.93))', 4326),
  ST_GeomFromText('POINT(-76.99 38.95)', 4326)),
(6, 'Ward 6',
  ST_GeomFromText('POLYGON((-77.01 38.87, -76.97 38.87, -76.97 38.91, -77.01 38.91, -77.01 38.87))', 4326),
  ST_GeomFromText('POINT(-76.99 38.89)', 4326)),
(7, 'Ward 7',
  ST_GeomFromText('POLYGON((-76.97 38.87, -76.93 38.87, -76.93 38.91, -76.97 38.91, -76.97 38.87))', 4326),
  ST_GeomFromText('POINT(-76.95 38.89)', 4326)),
(8, 'Ward 8',
  ST_GeomFromText('POLYGON((-77.01 38.83, -76.97 38.83, -76.97 38.87, -77.01 38.87, -77.01 38.83))', 4326),
  ST_GeomFromText('POINT(-76.99 38.85)', 4326));

-- Note: For production, replace this with actual ward boundaries from DC Open Data
-- The GeoJSON can be downloaded and loaded using ogr2ogr or PostGIS loader
