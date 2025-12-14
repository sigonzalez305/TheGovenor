import { Signal } from '@dc-listener/shared';

// Sentiment Types
export interface SentimentScore {
  value: number; // -100 to +100 or 0 to 100
  trend: 'up' | 'down' | 'stable';
  trendValue: number; // % change
  label: 'Calm' | 'Mixed' | 'Tense' | 'Critical';
}

export interface SentimentBreakdown {
  positive: number; // percentage
  neutral: number;
  negative: number;
}

export interface SentimentTimeSeries {
  timestamp: string;
  score: number;
  category?: string; // For category-specific trends
}

// Theme Types
export interface Theme {
  id: string;
  name: string;
  intensity: number; // 0-100
  change: number; // % change vs previous period
  trend: 'up' | 'down' | 'stable';
  sentimentBreakdown: SentimentBreakdown;
  postCount: number;
  keywords: string[];
  relatedLocations?: string[]; // Ward IDs
}

export interface ThemeDetail extends Theme {
  summary: string;
  timeline: SentimentTimeSeries[];
  topPosts: Signal[];
  relatedThemes?: Theme[];
}

export interface ThemeNetwork {
  nodes: {
    id: string;
    name: string;
    size: number; // Intensity or volume
    sentiment: number;
  }[];
  links: {
    source: string;
    target: string;
    strength: number; // Relationship strength
  }[];
}

// Hotspot Types
export interface Hotspot {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  wardId: string;
  wardName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  volume: number; // Number of signals
  sentimentScore: number;
  topThemes: string[];
  recency: number; // Minutes since last update
  isActive: boolean;
}

export interface HotspotDetail extends Hotspot {
  summary: string;
  themeBreakdown: Theme[];
  timeline: SentimentTimeSeries[];
  recentPosts: Signal[];
  suggestedActions: string[];
}

// Evidence Types
export interface EvidencePost {
  id: string;
  content: string;
  source: {
    name: string;
    icon: string;
    type: string;
  };
  timestamp: string;
  engagement: {
    upvotes?: number;
    comments?: number;
    shares?: number;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Confidence Types
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceIndicator {
  level: ConfidenceLevel;
  factors: {
    volume: number;
    sourceDiversity: number;
    timeSpan: number;
  };
  explanation: string;
}

// Widget Data Response Types
export interface SentimentWidgetData {
  pulse: SentimentScore;
  breakdown: SentimentBreakdown;
  timeline: SentimentTimeSeries[];
}

export interface ThemesWidgetData {
  topThemes: Theme[];
  network?: ThemeNetwork;
}

export interface HotspotsWidgetData {
  hotspots: Hotspot[];
  summary: {
    total: number;
    critical: number;
    active: number;
  };
}
