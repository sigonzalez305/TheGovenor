import { z } from 'zod';

export const WardSchema = z.object({
  id: z.number().int().min(1).max(8),
  name: z.string(),
  geom: z.any(), // GeoJSON geometry
  centroid: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
});
export type Ward = z.infer<typeof WardSchema>;

export const WardStatusSchema = z.object({
  wardId: z.number().int().min(1).max(8),
  wardName: z.string(),
  status: z.enum(['green', 'yellow', 'red', 'blue', 'pink']),
  signalCount24h: z.number(),
  topThemes: z.array(z.object({ name: z.string(), count: z.number() })),
  sentimentBreakdown: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
  }),
  categoryBreakdown: z.object({
    green: z.number(),
    yellow: z.number(),
    red: z.number(),
    blue: z.number(),
    pink: z.number(),
  }),
  avgRiskScore: z.number().optional(),
  lastUpdated: z.string().datetime(),
});
export type WardStatus = z.infer<typeof WardStatusSchema>;
