import { FastifyInstance } from 'fastify';
import { query } from '../db';

export async function sourcesRoutes(fastify: FastifyInstance) {
  // Get all sources
  fastify.get('/sources', async (request, reply) => {
    const sources = await query(`
      SELECT
        id,
        slug,
        name,
        source_type,
        platform,
        handle,
        format,
        refresh_rate_minutes,
        is_active,
        ward_scope,
        categories,
        last_fetch_at,
        last_success_at,
        last_error,
        created_at,
        updated_at
      FROM sources
      ORDER BY name
    `);

    return { sources };
  });

  // Get source by ID
  fastify.get<{ Params: { id: string } }>('/sources/:id', async (request, reply) => {
    const sourceId = parseInt(request.params.id);

    const sources = await query(
      `
      SELECT
        s.*,
        COUNT(si.id)::int as signal_count
      FROM sources s
      LEFT JOIN signals si ON si.source_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
    `,
      [sourceId]
    );

    if (sources.length === 0) {
      return reply.code(404).send({ error: 'Source not found' });
    }

    return { source: sources[0] };
  });

  // Get source health/freshness status
  fastify.get('/sources/health', async (request, reply) => {
    const health = await query(`
      SELECT
        source_type,
        COUNT(*)::int as total_sources,
        COUNT(*) FILTER (WHERE is_active)::int as active_sources,
        COUNT(*) FILTER (WHERE last_fetch_at > NOW() - INTERVAL '1 hour')::int as fresh_sources,
        COUNT(*) FILTER (WHERE last_error IS NOT NULL)::int as error_sources,
        MAX(last_fetch_at) as most_recent_fetch
      FROM sources
      GROUP BY source_type
      ORDER BY source_type
    `);

    return { health };
  });
}
