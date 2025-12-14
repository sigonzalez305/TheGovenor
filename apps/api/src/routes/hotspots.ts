import { FastifyInstance } from 'fastify';
import { query } from '../db';

export async function hotspotsRoutes(fastify: FastifyInstance) {
  // Get all hotspots
  fastify.get<{
    Querystring: { timeWindow?: string; ward?: string; severity?: string };
  }>('/hotspots', async (request, reply) => {
    const timeWindow = request.query.timeWindow || '24h';
    const wardFilter = request.query.ward;
    const severityFilter = request.query.severity;

    const hoursMap: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
    };

    const hours = hoursMap[timeWindow] || 24;

    let wardCondition = '';
    if (wardFilter) {
      wardCondition = `AND s.ward_id = ${parseInt(wardFilter)}`;
    }

    // Detect hotspots using spatial clustering
    const result = await query(
      `
      WITH signal_locations AS (
        SELECT
          s.id,
          s.location,
          s.ward_id,
          s.sentiment,
          s.sentiment_score,
          s.themes,
          s.timestamp,
          s.category,
          w.name as ward_name,
          ST_X(s.location::geometry) as lng,
          ST_Y(s.location::geometry) as lat
        FROM signals s
        LEFT JOIN wards w ON s.ward_id = w.id
        WHERE s.timestamp > NOW() - INTERVAL '${hours} hours'
          AND s.location IS NOT NULL
          ${wardCondition}
      ),
      clustered_signals AS (
        SELECT
          sl1.*,
          COUNT(*) OVER (
            PARTITION BY sl1.ward_id
            ORDER BY sl1.timestamp
            RANGE BETWEEN INTERVAL '2 hours' PRECEDING AND CURRENT ROW
          ) as local_density
        FROM signal_locations sl1
      ),
      hotspot_candidates AS (
        SELECT
          ward_id,
          ward_name,
          AVG(lat) as center_lat,
          AVG(lng) as center_lng,
          COUNT(*)::int as signal_count,
          AVG(sentiment_score) as avg_sentiment,
          COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_count,
          COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_count,
          COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_count,
          array_agg(DISTINCT unnest(themes)) FILTER (WHERE themes IS NOT NULL) as all_themes,
          MAX(timestamp) as last_update,
          array_agg(DISTINCT category) as categories
        FROM clustered_signals
        WHERE local_density >= 3
        GROUP BY ward_id, ward_name
        HAVING COUNT(*) >= 5
      )
      SELECT
        ward_id,
        ward_name,
        center_lat,
        center_lng,
        signal_count,
        avg_sentiment,
        positive_count,
        neutral_count,
        negative_count,
        (SELECT array_agg(theme ORDER BY freq DESC)
         FROM (
           SELECT theme, COUNT(*) as freq
           FROM unnest(all_themes) as theme
           GROUP BY theme
           ORDER BY freq DESC
           LIMIT 3
         ) top_themes
        ) as top_themes,
        last_update,
        categories,
        EXTRACT(EPOCH FROM (NOW() - last_update)) / 60 as minutes_since_update
      FROM hotspot_candidates
      ORDER BY signal_count DESC, avg_sentiment ASC
      `
    );

    const hotspots = result.map((row, index) => {
      const avgSentiment = parseFloat(row.avg_sentiment) || 0;
      const sentimentScore = Math.round(((avgSentiment + 1) / 2) * 100);
      const signalCount = row.signal_count;

      // Determine severity based on signal volume and sentiment
      let severity: 'low' | 'medium' | 'high' | 'critical';
      if (sentimentScore < 30 && signalCount > 50) severity = 'critical';
      else if (sentimentScore < 40 && signalCount > 30) severity = 'high';
      else if (sentimentScore < 50 || signalCount > 20) severity = 'medium';
      else severity = 'low';

      // Apply severity filter if specified
      if (severityFilter && severity !== severityFilter) {
        return null;
      }

      return {
        id: `hotspot-${row.ward_id}-${index}`,
        location: {
          lat: parseFloat(row.center_lat),
          lng: parseFloat(row.center_lng),
        },
        wardId: row.ward_id.toString(),
        wardName: row.ward_name,
        severity,
        volume: signalCount,
        sentimentScore: avgSentiment * 100,
        topThemes: row.top_themes || [],
        recency: Math.round(row.minutes_since_update),
        isActive: row.minutes_since_update < 60,
      };
    });

    const filteredHotspots = hotspots.filter((h) => h !== null);

    return {
      hotspots: filteredHotspots,
      summary: {
        total: filteredHotspots.length,
        critical: filteredHotspots.filter((h) => h.severity === 'critical').length,
        active: filteredHotspots.filter((h) => h.isActive).length,
      },
      timeWindow,
    };
  });

  // Get hotspot detail by ID
  fastify.get<{ Params: { id: string } }>('/hotspots/:id', async (request, reply) => {
    const hotspotId = request.params.id;

    // Extract ward_id from hotspot ID (format: hotspot-{ward_id}-{index})
    const match = hotspotId.match(/hotspot-(\d+)-(\d+)/);
    if (!match) {
      return reply.code(400).send({ error: 'Invalid hotspot ID format' });
    }

    const wardId = parseInt(match[1]);

    const result = await query(
      `
      WITH hotspot_signals AS (
        SELECT
          s.id,
          s.title,
          s.body,
          s.timestamp,
          s.sentiment,
          s.sentiment_score,
          s.themes,
          s.category,
          s.engagement,
          ST_X(s.location::geometry) as lng,
          ST_Y(s.location::geometry) as lat
        FROM signals s
        WHERE s.timestamp > NOW() - INTERVAL '24 hours'
          AND s.ward_id = $1
          AND s.location IS NOT NULL
        ORDER BY s.timestamp DESC
      ),
      theme_breakdown AS (
        SELECT
          unnest(themes) as theme_name,
          COUNT(*)::int as count,
          AVG(sentiment_score) as avg_sentiment
        FROM hotspot_signals
        WHERE themes IS NOT NULL
        GROUP BY theme_name
        ORDER BY count DESC
        LIMIT 5
      ),
      timeline_data AS (
        SELECT
          date_trunc('hour', timestamp) as hour,
          AVG(sentiment_score) as avg_score,
          COUNT(*)::int as count
        FROM hotspot_signals
        GROUP BY hour
        ORDER BY hour ASC
      )
      SELECT
        (SELECT json_agg(hs.*) FROM hotspot_signals hs LIMIT 10) as recent_signals,
        (SELECT json_agg(tb.*) FROM theme_breakdown tb) as theme_breakdown,
        (SELECT json_agg(td.*) FROM timeline_data td) as timeline,
        AVG(hs.lat) as center_lat,
        AVG(hs.lng) as center_lng,
        COUNT(*)::int as total_signals,
        AVG(hs.sentiment_score) as avg_sentiment
      FROM hotspot_signals hs
      `,
      [wardId]
    );

    if (result.length === 0 || !result[0].recent_signals) {
      return reply.code(404).send({ error: 'Hotspot not found' });
    }

    const data = result[0];
    const avgSentiment = parseFloat(data.avg_sentiment) || 0;
    const sentimentScore = Math.round(((avgSentiment + 1) / 2) * 100);

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (sentimentScore < 30 && data.total_signals > 50) severity = 'critical';
    else if (sentimentScore < 40 && data.total_signals > 30) severity = 'high';
    else if (sentimentScore < 50 || data.total_signals > 20) severity = 'medium';
    else severity = 'low';

    const themeBreakdown = (data.theme_breakdown || []).map((t: any) => ({
      id: `theme-${t.theme_name.toLowerCase().replace(/\s+/g, '-')}`,
      name: t.theme_name,
      intensity: Math.min(100, Math.round((t.count / 10) * 100)),
      change: 0,
      trend: 'stable' as const,
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      postCount: t.count,
      keywords: [],
      relatedLocations: [],
    }));

    const timeline = (data.timeline || []).map((t: any) => ({
      timestamp: t.hour,
      score: Math.round(((parseFloat(t.avg_score) + 1) / 2) * 100),
      count: t.count,
    }));

    const hotspot = {
      id: hotspotId,
      location: {
        lat: parseFloat(data.center_lat),
        lng: parseFloat(data.center_lng),
      },
      wardId: wardId.toString(),
      wardName: `Ward ${wardId}`,
      severity,
      volume: data.total_signals,
      sentimentScore: avgSentiment * 100,
      topThemes: themeBreakdown.map((t: any) => t.name).slice(0, 3),
      recency: 0,
      isActive: true,
      summary: `This hotspot has ${data.total_signals} signals in the last 24 hours with an average sentiment of ${sentimentScore}/100.`,
      themeBreakdown,
      timeline,
      recentPosts: data.recent_signals || [],
      suggestedActions: [
        'Monitor social media for escalating concerns',
        'Review recent signals for actionable items',
        'Check for related themes in neighboring wards',
      ],
    };

    return { hotspot };
  });
}
