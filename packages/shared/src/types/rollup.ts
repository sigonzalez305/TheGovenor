import { z } from 'zod';

export const DailyRollupMetrics = z.object({
  totalSignals: z.number(),
  categoryBreakdown: z.object({
    green: z.number(),
    yellow: z.number(),
    red: z.number(),
    blue: z.number(),
    pink: z.number(),
  }),
  sentimentBreakdown: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
  }),
  emotionAggregates: z
    .object({
      joy: z.number(),
      anger: z.number(),
      fear: z.number(),
      sadness: z.number(),
      trust: z.number(),
      anticipation: z.number(),
      surprise: z.number(),
      disgust: z.number(),
    })
    .optional(),
  topThemes: z.array(
    z.object({
      name: z.string(),
      count: z.number(),
      avgSentiment: z.number().optional(),
    })
  ),
  avgRiskScore: z.number().optional(),
  avgToxicityScore: z.number().optional(),
});
export type DailyRollupMetrics = z.infer<typeof DailyRollupMetrics>;

export const DailyRollupSchema = z.object({
  id: z.number(),
  date: z.string(), // YYYY-MM-DD
  wardId: z.number().int().min(1).max(8).optional(), // null for citywide
  metrics: DailyRollupMetrics,
});
export type DailyRollup = z.infer<typeof DailyRollupSchema>;
