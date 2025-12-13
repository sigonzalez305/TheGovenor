import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface SignalsQuery {
  wardId?: string;
  category?: string;
  sentiment?: string;
  sourceType?: string;
  window?: string;
  limit?: string;
  offset?: string;
  search?: string;
}

export async function signalsRoutes(fastify: FastifyInstance) {
  // Get signals with filters
  fastify.get<{ Querystring: SignalsQuery }>('/signals', async (request, reply) => {
    const {
      wardId,
      category,
      sentiment,
      sourceType,
      window = '24h',
      limit = '50',
      offset = '0',
      search,
    } = request.query;

    const hoursMap: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
    };

    const hours = hoursMap[window] || 24;
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offsetNum = parseInt(offset) || 0;

    const conditions: string[] = [`s.timestamp > NOW() - INTERVAL '${hours} hours'`];
    const params: any[] = [];
    let paramIndex = 1;

    if (wardId) {
      conditions.push(`s.ward_id = $${paramIndex++}`);
      params.push(parseInt(wardId));
    }

    if (category) {
      conditions.push(`s.category = $${paramIndex++}`);
      params.push(category);
    }

    if (sentiment) {
      conditions.push(`s.sentiment = $${paramIndex++}`);
      params.push(sentiment);
    }

    if (sourceType) {
      conditions.push(`src.source_type = $${paramIndex++}`);
      params.push(sourceType);
    }

    if (search) {
      conditions.push(`s.fts @@ plainto_tsquery('english', $${paramIndex++})`);
      params.push(search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const signals = await query(
      `
      SELECT
        s.id,
        s.source_id,
        s.timestamp,
        s.title,
        s.body,
        s.author,
        s.platform,
        s.tags,
        s.category,
        s.sentiment,
        s.sentiment_score,
        s.emotion,
        s.themes,
        s.entities,
        s.risk_score,
        s.ward_id,
        s.place_text,
        s.location_confidence,
        ST_AsGeoJSON(s.location)::json as location,
        src.name as source_name,
        src.source_type
      FROM signals s
      LEFT JOIN sources src ON src.id = s.source_id
      ${whereClause}
      ORDER BY s.timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limitNum, offsetNum]
    );

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(*)::int as total
      FROM signals s
      LEFT JOIN sources src ON src.id = s.source_id
      ${whereClause}
    `,
      params
    );

    return {
      signals,
      pagination: {
        total: countResult[0]?.total || 0,
        limit: limitNum,
        offset: offsetNum,
      },
    };
  });

  // Get signal by ID
  fastify.get<{ Params: { id: string } }>('/signals/:id', async (request, reply) => {
    const signalId = parseInt(request.params.id);

    const signals = await query(
      `
      SELECT
        s.*,
        ST_AsGeoJSON(s.location)::json as location,
        src.name as source_name,
        src.source_type,
        src.platform,
        e.title as event_title,
        e.start_time as event_start
      FROM signals s
      LEFT JOIN sources src ON src.id = s.source_id
      LEFT JOIN events e ON e.id = s.event_id
      WHERE s.id = $1
    `,
      [signalId]
    );

    if (signals.length === 0) {
      return reply.code(404).send({ error: 'Signal not found' });
    }

    return { signal: signals[0] };
  });

  // Get signals for a specific event
  fastify.get<{ Params: { eventId: string } }>(
    '/events/:eventId/signals',
    async (request, reply) => {
      const eventId = parseInt(request.params.eventId);

      const signals = await query(
        `
      SELECT
        s.id,
        s.timestamp,
        s.title,
        s.body,
        s.category,
        s.sentiment,
        s.sentiment_score,
        s.emotion,
        src.name as source_name
      FROM signals s
      LEFT JOIN sources src ON src.id = s.source_id
      WHERE s.event_id = $1
      ORDER BY s.timestamp DESC
    `,
        [eventId]
      );

      return { signals };
    }
  );
}
