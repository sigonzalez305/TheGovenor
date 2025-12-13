import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'ANC_MEETING',
  'MAYOR_EVENT',
  'TRANSIT',
  'COMMUNITY',
  'OTHER',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EventMetrics = z.object({
  before: z
    .object({
      count: z.number(),
      avgSentiment: z.number().optional(),
      emotions: z.record(z.number()).optional(),
    })
    .optional(),
  during: z
    .object({
      count: z.number(),
      avgSentiment: z.number().optional(),
      emotions: z.record(z.number()).optional(),
    })
    .optional(),
  after: z
    .object({
      count: z.number(),
      avgSentiment: z.number().optional(),
      emotions: z.record(z.number()).optional(),
    })
    .optional(),
});
export type EventMetrics = z.infer<typeof EventMetrics>;

export const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  locationText: z.string().optional(),
  wardId: z.number().int().min(1).max(8).optional(),
  recurrenceRule: z.string().optional(),
  eventType: EventTypeSchema,
  sourceLinks: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  metrics: EventMetrics.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Event = z.infer<typeof EventSchema>;
