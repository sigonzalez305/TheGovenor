import { z } from 'zod';

export const SourceTypeSchema = z.enum([
  'ANC_SITE',
  'OANC_CALENDAR',
  'ANC_RESOLUTIONS',
  'GOV_RSS',
  'OFFICIAL_SOCIAL',
  'METRO_SOCIAL',
  'REDDIT',
  'EMAIL_LIST',
  'DC_RSS',
  'MAYOR_CALENDAR',
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const PlatformSchema = z.enum([
  'twitter',
  'reddit',
  'email',
  'rss',
  'ical',
  'web',
  'pdf',
  'json',
]);
export type Platform = z.infer<typeof PlatformSchema>;

export const SourceSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  sourceType: SourceTypeSchema,
  platform: PlatformSchema,
  handle: z.string().optional(),
  query: z.string().optional(),
  url: z.string().optional(),
  format: z.string(),
  refreshRateMinutes: z.number().int().positive().default(60),
  isActive: z.boolean().default(true),
  wardScope: z.array(z.number().int().min(1).max(8)).default([]),
  categories: z.array(z.string()).default([]),
  authRef: z.string().optional(),
  lastFetchAt: z.string().datetime().optional(),
  lastSuccessAt: z.string().datetime().optional(),
  lastError: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Source = z.infer<typeof SourceSchema>;
