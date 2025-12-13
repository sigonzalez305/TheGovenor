import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface DailyQuery {
  date?: string;
  wardId?: string;
}

export async function dailyRoutes(fastify: FastifyInstance) {
  // Get daily rollup data
  fastify.get<{ Querystring: DailyQuery }>('/daily', async (request, reply) => {
    const { date, wardId } = request.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const conditions: string[] = ['date = $1'];
    const params: any[] = [targetDate];

    if (wardId) {
      conditions.push('ward_id = $2');
      params.push(parseInt(wardId));
    } else {
      conditions.push('ward_id IS NULL'); // Citywide
    }

    const rollups = await query(
      `
      SELECT
        id,
        date,
        ward_id,
        metrics
      FROM daily_rollups
      WHERE ${conditions.join(' AND ')}
    `,
      params
    );

    if (rollups.length === 0) {
      // Generate on-the-fly if not cached
      const liveData = await query(
        `
        SELECT
          json_build_object(
            'totalSignals', COUNT(*)::int,
            'categoryBreakdown', json_build_object(
              'green', COUNT(*) FILTER (WHERE category = 'green')::int,
              'yellow', COUNT(*) FILTER (WHERE category = 'yellow')::int,
              'red', COUNT(*) FILTER (WHERE category = 'red')::int,
              'blue', COUNT(*) FILTER (WHERE category = 'blue')::int,
              'pink', COUNT(*) FILTER (WHERE category = 'pink')::int
            ),
            'sentimentBreakdown', json_build_object(
              'positive', COUNT(*) FILTER (WHERE sentiment = 'positive')::int,
              'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral')::int,
              'negative', COUNT(*) FILTER (WHERE sentiment = 'negative')::int
            ),
            'avgRiskScore', AVG(risk_score)
          ) as metrics
        FROM signals
        WHERE DATE(timestamp) = $1
          ${wardId ? 'AND ward_id = $2' : 'AND ward_id IS NULL'}
      `,
        params
      );

      return {
        date: targetDate,
        wardId: wardId ? parseInt(wardId) : null,
        metrics: liveData[0]?.metrics || {},
        cached: false,
      };
    }

    return {
      date: targetDate,
      wardId: wardId ? parseInt(wardId) : null,
      metrics: rollups[0].metrics,
      cached: true,
    };
  });

  // Get daily pulse for all wards
  fastify.get('/daily/pulse', async (request, reply) => {
    const targetDate = new Date().toISOString().split('T')[0];

    // Get all ward rollups for today
    const wardRollups = await query(
      `
      SELECT
        dr.ward_id,
        w.name as ward_name,
        dr.metrics
      FROM daily_rollups dr
      LEFT JOIN wards w ON w.id = dr.ward_id
      WHERE dr.date = $1 AND dr.ward_id IS NOT NULL
      ORDER BY dr.ward_id
    `,
      [targetDate]
    );

    // Get citywide rollup
    const citywideRollup = await query(
      `
      SELECT metrics
      FROM daily_rollups
      WHERE date = $1 AND ward_id IS NULL
    `,
      [targetDate]
    );

    return {
      date: targetDate,
      citywide: citywideRollup[0]?.metrics || {},
      wards: wardRollups,
    };
  });
}
