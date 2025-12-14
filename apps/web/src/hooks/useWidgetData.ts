import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  SentimentScore,
  Theme,
  Hotspot,
  SentimentTimeSeries,
  ThemeDetail,
  HotspotDetail,
} from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

// Mock data generators (replace with real API calls later)
function generateMockSentimentScore(): SentimentScore {
  const value = Math.random() * 100;
  const trendValue = (Math.random() - 0.5) * 20;
  let label: SentimentScore['label'];

  if (value >= 75) label = 'Calm';
  else if (value >= 50) label = 'Mixed';
  else if (value >= 25) label = 'Tense';
  else label = 'Critical';

  return {
    value,
    trend: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'stable',
    trendValue: Math.abs(trendValue),
    label,
  };
}

function generateMockThemes(count: number = 10): Theme[] {
  const themeNames = [
    'Metro Delays',
    'Public Safety',
    'Road Construction',
    'Community Events',
    'School Updates',
    'Housing Issues',
    'Crime Reports',
    'Trash Collection',
    'Parks & Recreation',
    'Local Businesses',
  ];

  return themeNames.slice(0, count).map((name, index) => ({
    id: `theme-${index}`,
    name,
    intensity: Math.random() * 100,
    change: (Math.random() - 0.5) * 50,
    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
    sentimentBreakdown: {
      positive: Math.random() * 50,
      neutral: Math.random() * 30 + 10,
      negative: Math.random() * 40,
    },
    postCount: Math.floor(Math.random() * 500) + 50,
    keywords: ['keyword1', 'keyword2', 'keyword3'],
    relatedLocations: [`${Math.floor(Math.random() * 8) + 1}`],
  }));
}

function generateMockHotspots(count: number = 15): Hotspot[] {
  const wards = [
    { id: '1', name: 'Ward 1' },
    { id: '2', name: 'Ward 2' },
    { id: '3', name: 'Ward 3' },
    { id: '4', name: 'Ward 4' },
    { id: '5', name: 'Ward 5' },
    { id: '6', name: 'Ward 6' },
    { id: '7', name: 'Ward 7' },
    { id: '8', name: 'Ward 8' },
  ];

  const severities: Hotspot['severity'][] = ['critical', 'high', 'medium', 'low'];

  return Array.from({ length: count }, (_, index) => {
    const ward = wards[Math.floor(Math.random() * wards.length)];
    return {
      id: `hotspot-${index}`,
      location: {
        lat: 38.9072 + (Math.random() - 0.5) * 0.1,
        lng: -77.0369 + (Math.random() - 0.5) * 0.1,
      },
      wardId: ward.id,
      wardName: ward.name,
      severity: severities[Math.floor(Math.random() * severities.length)],
      volume: Math.floor(Math.random() * 200) + 20,
      sentimentScore: (Math.random() - 0.5) * 100,
      topThemes: ['Metro Delays', 'Public Safety'].slice(0, Math.floor(Math.random() * 2) + 1),
      recency: Math.floor(Math.random() * 60),
      isActive: Math.random() > 0.5,
    };
  });
}

function generateMockTimeline(hours: number = 24): SentimentTimeSeries[] {
  const now = Date.now();
  return Array.from({ length: hours }, (_, i) => ({
    timestamp: new Date(now - (hours - i) * 3600000).toISOString(),
    score: (Math.random() - 0.5) * 100,
    category: Math.random() > 0.7 ? 'Transit' : Math.random() > 0.5 ? 'Safety' : undefined,
  }));
}

// Hook for sentiment data
export function useSentimentData() {
  const { timeRange } = useWidgetStore();

  return useQuery({
    queryKey: ['sentiment', timeRange],
    queryFn: async () => {
      try {
        // Fetch citywide sentiment
        const citywideData = await api.getSentimentCitywide(timeRange);

        // Fetch timeline data
        const timelineData = await api.getSentimentTimeseries({
          bucket: 'hour',
        });

        // Transform API response to match widget interface
        const pulse: SentimentScore = {
          value: citywideData.score || 50,
          trend: citywideData.trend > 0 ? 'up' : citywideData.trend < 0 ? 'down' : 'stable',
          trendValue: Math.abs(citywideData.trend || 0),
          label: citywideData.label || 'Calm',
        };

        return {
          pulse,
          breakdown: citywideData.breakdown || {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          timeline: (timelineData.timeline || []).map((item: any) => ({
            timestamp: item.timestamp,
            score: item.score,
          })),
        };
      } catch (error) {
        console.error('Failed to fetch sentiment data:', error);
        // Fallback to mock data on error
        return {
          pulse: generateMockSentimentScore(),
          breakdown: {
            positive: 45,
            neutral: 35,
            negative: 20,
          },
          timeline: generateMockTimeline(),
        };
      }
    },
  });
}

// Hook for themes data
export function useThemesData() {
  const { timeRange, themeFilter } = useWidgetStore();

  return useQuery({
    queryKey: ['themes', timeRange, themeFilter],
    queryFn: async () => {
      try {
        const data = await api.getThemes(timeRange, 10);
        return {
          topThemes: data.themes || [],
          network: undefined, // Optional theme network
        };
      } catch (error) {
        console.error('Failed to fetch themes data:', error);
        // Fallback to mock data on error
        return {
          topThemes: generateMockThemes(10),
          network: undefined,
        };
      }
    },
  });
}

// Hook for hotspots data
export function useHotspotsData() {
  const { timeRange, sentimentFilter, themeFilter } = useWidgetStore();

  return useQuery({
    queryKey: ['hotspots', timeRange, sentimentFilter, themeFilter],
    queryFn: async () => {
      try {
        const params: any = { timeWindow: timeRange };
        if (sentimentFilter) params.sentiment = sentimentFilter;
        if (themeFilter) params.theme = themeFilter;

        const data = await api.getHotspots(params);
        return {
          hotspots: data.hotspots || [],
          summary: data.summary || {
            total: 0,
            critical: 0,
            active: 0,
          },
        };
      } catch (error) {
        console.error('Failed to fetch hotspots data:', error);
        // Fallback to mock data on error
        const hotspots = generateMockHotspots(15);
        return {
          hotspots,
          summary: {
            total: hotspots.length,
            critical: hotspots.filter((h) => h.severity === 'critical').length,
            active: hotspots.filter((h) => h.isActive).length,
          },
        };
      }
    },
  });
}

// Hook for theme detail
export function useThemeDetail(themeId: string | null) {
  return useQuery({
    queryKey: ['theme-detail', themeId],
    queryFn: async () => {
      if (!themeId) return null;

      try {
        const data = await api.getTheme(themeId);
        return data.theme as ThemeDetail;
      } catch (error) {
        console.error('Failed to fetch theme detail:', error);
        // Fallback to mock data on error
        const theme = generateMockThemes(1)[0];
        return {
          ...theme,
          summary: 'This theme has been gaining traction in the community over the past few days.',
          timeline: generateMockTimeline(48),
          topPosts: [],
          relatedThemes: generateMockThemes(3),
        } as ThemeDetail;
      }
    },
    enabled: !!themeId,
  });
}

// Hook for hotspot detail
export function useHotspotDetail(hotspotId: string | null) {
  return useQuery({
    queryKey: ['hotspot-detail', hotspotId],
    queryFn: async () => {
      if (!hotspotId) return null;

      try {
        const data = await api.getHotspot(hotspotId);
        return data.hotspot as HotspotDetail;
      } catch (error) {
        console.error('Failed to fetch hotspot detail:', error);
        // Fallback to mock data on error
        const hotspot = generateMockHotspots(1)[0];
        return {
          ...hotspot,
          summary:
            'This area has seen increased activity related to public safety and transportation issues.',
          themeBreakdown: generateMockThemes(5),
          timeline: generateMockTimeline(24),
          recentPosts: [],
          suggestedActions: [
            'Monitor social media for escalating concerns',
            'Coordinate with local police department',
            'Review recent 311 service requests',
          ],
        } as HotspotDetail;
      }
    },
    enabled: !!hotspotId,
  });
}
