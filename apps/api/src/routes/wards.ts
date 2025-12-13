import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { WardStatusSchema } from '@dc-listener/shared';

export async function wardsRoutes(fastify: FastifyInstance) {
  // Get all wards with geometry
  fastify.get('/wards', async (request, reply) => {
    const wards = await query(`
      SELECT
        id,
        name,
        ST_AsGeoJSON(geom)::json as geom,
        ST_AsGeoJSON(centroid)::json as centroid
      FROM wards
      ORDER BY id
    `);

    return { wards };
  });

  // Get ward by ID
  fastify.get<{ Params: { id: string } }>('/wards/:id', async (request, reply) => {
    const wardId = parseInt(request.params.id);

    if (isNaN(wardId) || wardId < 1 || wardId > 8) {
      return reply.code(400).send({ error: 'Invalid ward ID' });
    }

    const wards = await query(
      `
      SELECT
        id,
        name,
        ST_AsGeoJSON(geom)::json as geom,
        ST_AsGeoJSON(centroid)::json as centroid
      FROM wards
      WHERE id = $1
    `,
      [wardId]
    );

    if (wards.length === 0) {
      return reply.code(404).send({ error: 'Ward not found' });
    }

    return { ward: wards[0] };
  });

  // Get current ward status (for map coloring)
  fastify.get<{ Querystring: { window?: string } }>(
    '/wards/status',
    async (request, reply) => {
      const window = request.query.window || '24h';

      // Map window to hours
      const hoursMap: Record<string, number> = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
      };

      const hours = hoursMap[window] || 24;

      const wardStatuses = await query(
        `
      WITH recent_signals AS (
        SELECT
          s.ward_id,
          s.category,
          s.sentiment,
          s.risk_score,
          s.themes,
          s.timestamp
        FROM signals s
        WHERE s.timestamp > NOW() - INTERVAL '${hours} hours'
          AND s.ward_id IS NOT NULL
      ),
      ward_aggregates AS (
        SELECT
          w.id as ward_id,
          w.name as ward_name,
          COUNT(rs.*)::int as signal_count,

          -- Category breakdown
          COUNT(*) FILTER (WHERE rs.category = 'green')::int as green_count,
          COUNT(*) FILTER (WHERE rs.category = 'yellow')::int as yellow_count,
          COUNT(*) FILTER (WHERE rs.category = 'red')::int as red_count,
          COUNT(*) FILTER (WHERE rs.category = 'blue')::int as blue_count,
          COUNT(*) FILTER (WHERE rs.category = 'pink')::int as pink_count,

          -- Sentiment breakdown
          COUNT(*) FILTER (WHERE rs.sentiment = 'positive')::int as positive_count,
          COUNT(*) FILTER (WHERE rs.sentiment = 'neutral')::int as neutral_count,
          COUNT(*) FILTER (WHERE rs.sentiment = 'negative')::int as negative_count,

          -- Risk
          AVG(rs.risk_score) as avg_risk_score

        FROM wards w
        LEFT JOIN recent_signals rs ON rs.ward_id = w.id
        GROUP BY w.id, w.name
      )
      SELECT
        ward_id,
        ward_name,
        signal_count,

        -- Determine status color
        CASE
          WHEN red_count > 5 AND avg_risk_score > 60 THEN 'red'
          WHEN yellow_count > 10 THEN 'yellow'
          WHEN blue_count > pink_count AND blue_count > green_count THEN 'blue'
          WHEN pink_count > blue_count AND pink_count > green_count THEN 'pink'
          ELSE 'green'
        END as status,

        json_build_object(
          'green', green_count,
          'yellow', yellow_count,
          'red', red_count,
          'blue', blue_count,
          'pink', pink_count
        ) as category_breakdown,

        json_build_object(
          'positive', positive_count,
          'neutral', neutral_count,
          'negative', negative_count
        ) as sentiment_breakdown,

        avg_risk_score,
        NOW() as last_updated

      FROM ward_aggregates
      ORDER BY ward_id
      `
      );

      return { wardStatuses, window, hours };
    }
  );
}
