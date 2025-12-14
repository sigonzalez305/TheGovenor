import { FastifyInstance } from 'fastify';
import { query } from '../db';

export async function themesRoutes(fastify: FastifyInstance) {
  // Get top themes
  fastify.get<{ Querystring: { timeWindow?: string; limit?: string } }>(
    '/themes',
    async (request, reply) => {
      const timeWindow = request.query.timeWindow || '24h';
      const limit = parseInt(request.query.limit || '10');

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
      WITH current_themes AS (
        SELECT
          unnest(themes) as theme_name,
          COUNT(*)::int as signal_count,
          AVG(sentiment_score) as avg_sentiment,
          COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_count,
          COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_count,
          COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_count,
          array_agg(DISTINCT ward_id::text) FILTER (WHERE ward_id IS NOT NULL) as ward_ids,
          array_agg(DISTINCT unnest(keywords)) as all_keywords
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '${hours} hours'
          AND themes IS NOT NULL
          AND array_length(themes, 1) > 0
        GROUP BY theme_name
      ),
      previous_themes AS (
        SELECT
          unnest(themes) as theme_name,
          COUNT(*)::int as prev_signal_count
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '${previousHours} hours'
          AND timestamp <= NOW() - INTERVAL '${hours} hours'
          AND themes IS NOT NULL
          AND array_length(themes, 1) > 0
        GROUP BY theme_name
      )
      SELECT
        ct.theme_name as name,
        ct.signal_count,
        COALESCE(pt.prev_signal_count, 0) as prev_signal_count,
        ct.avg_sentiment,
        ct.positive_count,
        ct.neutral_count,
        ct.negative_count,
        ct.ward_ids,
        (SELECT array_agg(keyword ORDER BY freq DESC)
         FROM (
           SELECT keyword, COUNT(*) as freq
           FROM unnest(ct.all_keywords) as keyword
           GROUP BY keyword
           ORDER BY freq DESC
           LIMIT 5
         ) top_keywords
        ) as top_keywords
      FROM current_themes ct
      LEFT JOIN previous_themes pt ON ct.theme_name = pt.theme_name
      ORDER BY ct.signal_count DESC
      LIMIT $1
      `,
        [limit]
      );

      const themes = result.map((row) => {
        const total = row.signal_count;
        const prevTotal = row.prev_signal_count || 1;
        const change = Math.round(((total - prevTotal) / prevTotal) * 100);

        let trend: 'up' | 'down' | 'stable';
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
        else trend = 'stable';

        return {
          id: `theme-${row.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: row.name,
          intensity: Math.min(100, Math.round((total / 100) * 100)), // Scale based on signal count
          change,
          trend,
          sentimentBreakdown: {
            positive: Math.round((row.positive_count / total) * 100),
            neutral: Math.round((row.neutral_count / total) * 100),
            negative: Math.round((row.negative_count / total) * 100),
          },
          postCount: total,
          keywords: row.top_keywords || [],
          relatedLocations: row.ward_ids || [],
        };
      });

      return { themes, timeWindow };
    }
  );

  // Get theme detail by ID
  fastify.get<{ Params: { id: string } }>('/themes/:id', async (request, reply) => {
    const themeId = request.params.id;
    // Extract theme name from ID (format: theme-{name})
    const themeName = themeId.replace('theme-', '').replace(/-/g, ' ');

    const result = await query(
      `
      SELECT
        unnest(themes) as theme_name,
        COUNT(*)::int as signal_count,
        AVG(sentiment_score) as avg_sentiment,
        COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_count,
        COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_count,
        COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_count,
        array_agg(DISTINCT ward_id::text) FILTER (WHERE ward_id IS NOT NULL) as ward_ids,
        array_agg(DISTINCT unnest(keywords)) as all_keywords
      FROM signals
      WHERE timestamp > NOW() - INTERVAL '7 days'
        AND themes IS NOT NULL
        AND $1 = ANY(themes)
      GROUP BY theme_name
      HAVING theme_name = $1
      `,
      [themeName]
    );

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Theme not found' });
    }

    const data = result[0];
    const total = data.signal_count;

    // Get timeline data for this theme
    const timelineResult = await query(
      `
      SELECT
        date_trunc('hour', timestamp) as hour,
        AVG(sentiment_score) as avg_score,
        COUNT(*)::int as count
      FROM signals
      WHERE timestamp > NOW() - INTERVAL '48 hours'
        AND themes IS NOT NULL
        AND $1 = ANY(themes)
      GROUP BY hour
      ORDER BY hour ASC
      `,
      [themeName]
    );

    const timeline = timelineResult.map((row) => ({
      timestamp: row.hour,
      score: Math.round(((parseFloat(row.avg_score) + 1) / 2) * 100),
      count: row.count,
    }));

    // Get top signals for this theme
    const signalsResult = await query(
      `
      SELECT
        id,
        title,
        body,
        timestamp,
        sentiment,
        sentiment_score,
        category,
        engagement
      FROM signals
      WHERE timestamp > NOW() - INTERVAL '24 hours'
        AND themes IS NOT NULL
        AND $1 = ANY(themes)
      ORDER BY timestamp DESC
      LIMIT 10
      `,
      [themeName]
    );

    const theme = {
      id: themeId,
      name: data.theme_name,
      intensity: Math.min(100, Math.round((total / 100) * 100)),
      change: 0, // Would need previous period comparison
      trend: 'stable' as const,
      sentimentBreakdown: {
        positive: Math.round((data.positive_count / total) * 100),
        neutral: Math.round((data.neutral_count / total) * 100),
        negative: Math.round((data.negative_count / total) * 100),
      },
      postCount: total,
      keywords: data.all_keywords?.slice(0, 10) || [],
      relatedLocations: data.ward_ids || [],
      summary: `This theme has ${total} signals in the last 7 days.`,
      timeline,
      topPosts: signalsResult,
      relatedThemes: [], // TODO: Implement related themes
    };

    return { theme };
  });

  // Get theme network (relationships between themes)
  fastify.get('/themes/network', async (request, reply) => {
    // This is a complex query that finds co-occurrence of themes
    const result = await query(`
      WITH theme_pairs AS (
        SELECT
          t1.theme as source,
          t2.theme as target,
          COUNT(*)::int as co_occurrence
        FROM (
          SELECT id, unnest(themes) as theme
          FROM signals
          WHERE timestamp > NOW() - INTERVAL '7 days'
            AND themes IS NOT NULL
            AND array_length(themes, 1) > 1
        ) t1
        JOIN (
          SELECT id, unnest(themes) as theme
          FROM signals
          WHERE timestamp > NOW() - INTERVAL '7 days'
            AND themes IS NOT NULL
            AND array_length(themes, 1) > 1
        ) t2 ON t1.id = t2.id AND t1.theme < t2.theme
        GROUP BY source, target
        HAVING COUNT(*) >= 3
      ),
      theme_stats AS (
        SELECT
          unnest(themes) as theme,
          COUNT(*)::int as total_count,
          AVG(sentiment_score) as avg_sentiment
        FROM signals
        WHERE timestamp > NOW() - INTERVAL '7 days'
          AND themes IS NOT NULL
        GROUP BY theme
      )
      SELECT
        ts.theme,
        ts.total_count,
        ts.avg_sentiment,
        COALESCE(
          json_agg(
            json_build_object(
              'target', COALESCE(tp.target, tp.source),
              'strength', tp.co_occurrence
            )
          ) FILTER (WHERE tp.co_occurrence IS NOT NULL),
          '[]'
        ) as connections
      FROM theme_stats ts
      LEFT JOIN theme_pairs tp ON ts.theme = tp.source OR ts.theme = tp.target
      GROUP BY ts.theme, ts.total_count, ts.avg_sentiment
      ORDER BY ts.total_count DESC
      LIMIT 20
    `);

    const nodes = result.map((row) => ({
      id: row.theme,
      name: row.theme,
      size: row.total_count,
      sentiment: Math.round(((parseFloat(row.avg_sentiment) + 1) / 2) * 100),
    }));

    const links: Array<{ source: string; target: string; strength: number }> = [];
    result.forEach((row) => {
      const connections = row.connections || [];
      connections.forEach((conn: { target: string; strength: number }) => {
        links.push({
          source: row.theme,
          target: conn.target,
          strength: conn.strength,
        });
      });
    });

    return { network: { nodes, links } };
  });
}
