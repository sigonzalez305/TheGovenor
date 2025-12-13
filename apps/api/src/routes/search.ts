import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface SearchQuery {
  q: string;
  type?: 'signals' | 'events' | 'all';
  limit?: string;
}

export async function searchRoutes(fastify: FastifyInstance) {
  // Global search endpoint
  fastify.get<{ Querystring: SearchQuery }>('/search', async (request, reply) => {
    const { q, type = 'all', limit = '20' } = request.query;

    if (!q || q.trim().length === 0) {
      return reply.code(400).send({ error: 'Query parameter "q" is required' });
    }

    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const results: any = {};

    // Search signals
    if (type === 'all' || type === 'signals') {
      const signals = await query(
        `
        SELECT
          s.id,
          s.timestamp,
          s.title,
          s.body,
          s.category,
          s.sentiment,
          s.ward_id,
          src.name as source_name,
          ts_rank(s.fts, plainto_tsquery('english', $1)) as rank
        FROM signals s
        LEFT JOIN sources src ON src.id = s.source_id
        WHERE s.fts @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC, s.timestamp DESC
        LIMIT $2
      `,
        [q, limitNum]
      );

      results.signals = signals;
    }

    // Search events
    if (type === 'all' || type === 'events') {
      const events = await query(
        `
        SELECT
          e.id,
          e.title,
          e.start_time,
          e.end_time,
          e.location_text,
          e.ward_id,
          e.event_type,
          w.name as ward_name
        FROM events e
        LEFT JOIN wards w ON w.id = e.ward_id
        WHERE
          e.title ILIKE $1
          OR e.location_text ILIKE $1
        ORDER BY e.start_time DESC
        LIMIT $2
      `,
        [`%${q}%`, limitNum]
      );

      results.events = events;
    }

    return {
      query: q,
      results,
    };
  });
}
