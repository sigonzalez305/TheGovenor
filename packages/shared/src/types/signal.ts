import { z } from 'zod';

export const CategorySchema = z.enum(['green', 'yellow', 'red', 'blue', 'pink']);
export type Category = z.infer<typeof CategorySchema>;

export const SentimentSchema = z.enum(['positive', 'neutral', 'negative']);
export type Sentiment = z.infer<typeof SentimentSchema>;

export const LocationConfidenceSchema = z.enum(['high', 'medium', 'low', 'none']);
export type LocationConfidence = z.infer<typeof LocationConfidenceSchema>;

export const EmotionScores = z.object({
  joy: z.number().min(0).max(1).optional(),
  anger: z.number().min(0).max(1).optional(),
  fear: z.number().min(0).max(1).optional(),
  sadness: z.number().min(0).max(1).optional(),
  trust: z.number().min(0).max(1).optional(),
  anticipation: z.number().min(0).max(1).optional(),
  surprise: z.number().min(0).max(1).optional(),
  disgust: z.number().min(0).max(1).optional(),
});
export type EmotionScores = z.infer<typeof EmotionScores>;

export const ThemeAssignment = z.object({
  themeId: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(1),
});
export type ThemeAssignment = z.infer<typeof ThemeAssignment>;

export const EntityExtraction = z.object({
  places: z.array(z.string()).optional(),
  organizations: z.array(z.string()).optional(),
  people: z.array(z.string()).optional(),
  addresses: z.array(z.string()).optional(),
});
export type EntityExtraction = z.infer<typeof EntityExtraction>;

export const SignalSchema = z.object({
  id: z.string(),
  sourceId: z.number(),
  rawItemId: z.number().optional(),
  timestamp: z.string().datetime(),
  title: z.string().optional(),
  body: z.string(),
  author: z.string().optional(),
  platform: z.string(),
  url: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: CategorySchema.optional(),
  sentiment: SentimentSchema.optional(),
  sentimentScore: z.number().optional(),
  emotion: EmotionScores.optional(),
  themes: z.array(ThemeAssignment).default([]),
  entities: EntityExtraction.optional(),
  riskScore: z.number().min(0).max(100).optional(),
  toxicityScore: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
  location: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    })
    .optional(),
  placeText: z.string().optional(),
  locationConfidence: LocationConfidenceSchema.optional(),
  geocodeProvider: z.string().optional(),
  wardId: z.number().int().min(1).max(8).optional(),
  eventId: z.number().optional(),
  clusterId: z.number().optional(),
  ingestedAt: z.string().datetime(),
});
export type Signal = z.infer<typeof SignalSchema>;
