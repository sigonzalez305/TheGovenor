import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface EventsQuery {
  wardId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  offset?: string;
}

export async function eventsRoutes(fastify: FastifyInstance) {
  // Get events with filters
  fastify.get<{ Querystring: EventsQuery }>('/events', async (request, reply) => {
    const { wardId, eventType, startDate, endDate, limit = '50', offset = '0' } = request.query;

    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offsetNum = parseInt(offset) || 0;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (wardId) {
      conditions.push(`e.ward_id = $${paramIndex++}`);
      params.push(parseInt(wardId));
    }

    if (eventType) {
      conditions.push(`e.event_type = $${paramIndex++}`);
      params.push(eventType);
    }

    if (startDate) {
      conditions.push(`e.start_time >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`e.end_time <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const events = await query(
      `
      SELECT
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        ST_AsGeoJSON(e.location)::json as location,
        e.location_text,
        e.ward_id,
        e.recurrence_rule,
        e.event_type,
        e.source_links,
        e.metrics,
        e.created_at,
        w.name as ward_name
      FROM events e
      LEFT JOIN wards w ON w.id = e.ward_id
      ${whereClause}
      ORDER BY e.start_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limitNum, offsetNum]
    );

    const countResult = await query(
      `
      SELECT COUNT(*)::int as total
      FROM events e
      ${whereClause}
    `,
      params
    );

    return {
      events,
      pagination: {
        total: countResult[0]?.total || 0,
        limit: limitNum,
        offset: offsetNum,
      },
    };
  });

  // Get event by ID with before/during/after metrics
  fastify.get<{ Params: { id: string } }>('/events/:id', async (request, reply) => {
    const eventId = parseInt(request.params.id);

    const events = await query(
      `
      SELECT
        e.*,
        ST_AsGeoJSON(e.location)::json as location,
        w.name as ward_name,

        -- Compute before/during/after sentiment if not cached
        (
          SELECT json_build_object(
            'count', COUNT(*)::int,
            'avg_sentiment', AVG(sentiment_score),
            'emotions', json_object_agg(
              emotion_key,
              emotion_value
            )
          )
          FROM signals s,
          jsonb_each_text(s.emotion) AS e(emotion_key, emotion_value)
          WHERE s.event_id = e.id
            AND s.timestamp BETWEEN (e.start_time - INTERVAL '72 hours') AND e.start_time
        ) as before_metrics,

        (
          SELECT json_build_object(
            'count', COUNT(*)::int,
            'avg_sentiment', AVG(sentiment_score)
          )
          FROM signals s
          WHERE s.event_id = e.id
            AND s.timestamp BETWEEN e.start_time AND e.end_time
        ) as during_metrics,

        (
          SELECT json_build_object(
            'count', COUNT(*)::int,
            'avg_sentiment', AVG(sentiment_score)
          )
          FROM signals s
          WHERE s.event_id = e.id
            AND s.timestamp BETWEEN e.end_time AND (e.end_time + INTERVAL '72 hours')
        ) as after_metrics

      FROM events e
      LEFT JOIN wards w ON w.id = e.ward_id
      WHERE e.id = $1
    `,
      [eventId]
    );

    if (events.length === 0) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    return { event: events[0] };
  });
}
