import { FastifyInstance } from 'fastify';
import { query } from '../db';

export async function sentimentRoutes(fastify: FastifyInstance) {
  // Get citywide sentiment score
  fastify.get<{ Querystring: { timeWindow?: string } }>(
    '/sentiment/citywide',
    async (request, reply) => {
      const timeWindow = request.query.timeWindow || '24h';

      // Map window to hours
      const hoursMap: Record<string, number> = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
      };

      const hours = hoursMap[timeWindow] || 24;
      const previousHours = hours * 2; // For trend calculation

      const result = await query(
        `
      WITH current_period AS (
        SELECT
          COUNT(*)::int as total_signals,
          COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_count,
          COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_count,
          COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_count,
          AVG(sentiment_score) as avg_sentiment_score
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      ),
      previous_period AS (
        SELECT
          AVG(sentiment_score) as avg_sentiment_score
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '${previousHours} hours'
          AND timestamp <= NOW() - INTERVAL '${hours} hours'
      )
      SELECT
        cp.total_signals,
        cp.positive_count,
        cp.neutral_count,
        cp.negative_count,
        COALESCE(cp.avg_sentiment_score, 0) as avg_sentiment_score,
        COALESCE(pp.avg_sentiment_score, 0) as prev_avg_sentiment_score
      FROM current_period cp
      CROSS JOIN previous_period pp
      `
      );

      if (result.length === 0 || result[0].total_signals === 0) {
        return {
          score: 50,
          label: 'Calm',
          breakdown: {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          trend: 0,
          timeWindow,
        };
      }

      const data = result[0];

      // Convert sentiment_score (-1 to 1) to 0-100 scale
      const avgScore = parseFloat(data.avg_sentiment_score) || 0;
      const prevAvgScore = parseFloat(data.prev_avg_sentiment_score) || 0;
      const score = Math.round(((avgScore + 1) / 2) * 100);

      // Calculate trend
      let trend = 0;
      if (prevAvgScore !== 0) {
        trend = Math.round(((avgScore - prevAvgScore) / Math.abs(prevAvgScore)) * 100);
      }

      // Determine label
      let label: 'Calm' | 'Mixed' | 'Tense' | 'Critical';
      if (score >= 75) label = 'Calm';
      else if (score >= 50) label = 'Mixed';
      else if (score >= 25) label = 'Tense';
      else label = 'Critical';

      // Calculate percentages
      const total = data.total_signals;
      const breakdown = {
        positive: Math.round((data.positive_count / total) * 100),
        neutral: Math.round((data.neutral_count / total) * 100),
        negative: Math.round((data.negative_count / total) * 100),
      };

      return {
        score,
        label,
        breakdown,
        trend,
        timeWindow,
      };
    }
  );

  // Get sentiment for a specific ward
  fastify.get<{ Params: { wardId: string }; Querystring: { timeWindow?: string } }>(
    '/sentiment/ward/:wardId',
    async (request, reply) => {
      const wardId = parseInt(request.params.wardId);
      const timeWindow = request.query.timeWindow || '24h';

      if (isNaN(wardId) || wardId < 1 || wardId > 8) {
        return reply.code(400).send({ error: 'Invalid ward ID' });
      }

      const hoursMap: Record<string, number> = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
      };

      const hours = hoursMap[timeWindow] || 24;
      const previousHours = hours * 2;

      const result = await query(
        `
      WITH current_period AS (
        SELECT
          COUNT(*)::int as total_signals,
          COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_count,
          COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_count,
          COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_count,
          AVG(sentiment_score) as avg_sentiment_score
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '${hours} hours'
          AND ward_id = $1
      ),
      previous_period AS (
        SELECT
          AVG(sentiment_score) as avg_sentiment_score
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '${previousHours} hours'
          AND timestamp <= NOW() - INTERVAL '${hours} hours'
          AND ward_id = $1
      )
      SELECT
        cp.total_signals,
        cp.positive_count,
        cp.neutral_count,
        cp.negative_count,
        COALESCE(cp.avg_sentiment_score, 0) as avg_sentiment_score,
        COALESCE(pp.avg_sentiment_score, 0) as prev_avg_sentiment_score
      FROM current_period cp
      CROSS JOIN previous_period pp
      `,
        [wardId]
      );

      if (result.length === 0 || result[0].total_signals === 0) {
        return {
          wardId,
          score: 50,
          breakdown: {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          timeline: [],
          timeWindow,
        };
      }

      const data = result[0];

      // Convert sentiment_score (-1 to 1) to 0-100 scale
      const avgScore = parseFloat(data.avg_sentiment_score) || 0;
      const score = Math.round(((avgScore + 1) / 2) * 100);

      // Calculate percentages
      const total = data.total_signals;
      const breakdown = {
        positive: Math.round((data.positive_count / total) * 100),
        neutral: Math.round((data.neutral_count / total) * 100),
        negative: Math.round((data.negative_count / total) * 100),
      };

      return {
        wardId,
        score,
        breakdown,
        timeline: [], // TODO: Implement timeline
        timeWindow,
      };
    }
  );

  // Get sentiment timeseries
  fastify.get<{
    Querystring: { start?: string; end?: string; bucket?: string; wardId?: string };
  }>('/sentiment/timeseries', async (request, reply) => {
    const { start, end, bucket = 'hour', wardId } = request.query;

    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    // Determine bucket interval
    const bucketMap: Record<string, string> = {
      hour: '1 hour',
      day: '1 day',
      week: '1 week',
    };

    const bucketInterval = bucketMap[bucket] || '1 hour';

    const wardFilter = wardId ? `AND ward_id = ${parseInt(wardId)}` : '';

    const result = await query(
      `
      SELECT
        date_trunc('${bucket}', timestamp) as bucket_time,
        AVG(sentiment_score) as avg_score,
        COUNT(*)::int as signal_count,
        COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_count,
        COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_count,
        COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_count
      FROM signals
      WHERE timestamp >= $1
        AND timestamp <= $2
        ${wardFilter}
      GROUP BY bucket_time
      ORDER BY bucket_time ASC
      `,
      [startDate, endDate]
    );

    const timeline = result.map((row) => ({
      timestamp: row.bucket_time,
      score: Math.round(((parseFloat(row.avg_score) + 1) / 2) * 100),
      breakdown: {
        positive: row.positive_count,
        neutral: row.neutral_count,
        negative: row.negative_count,
      },
      signalCount: row.signal_count,
    }));

    return { timeline, start: startDate, end: endDate, bucket };
  });
}
