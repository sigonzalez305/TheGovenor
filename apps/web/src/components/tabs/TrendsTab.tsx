'use client';

import { SentimentTimeline } from '@/components/widgets/SentimentTimeline';
import { TopThemesList } from '@/components/widgets/TopThemesList';
import { SentimentTimeSeries, Theme } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface TrendsTabProps {
  sentimentTimeline: SentimentTimeSeries[];
  themes: Theme[];
  onPointClick?: (timestamp: string) => void;
}

export function TrendsTab({ sentimentTimeline, themes, onPointClick }: TrendsTabProps) {
  const { timeRange, setTimeRange, sentimentFilter, setSentimentFilter } = useWidgetStore();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trends Analysis</h1>
          <p className="text-gray-600 mt-1">Historical patterns and sentiment over time</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Sentiment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Sentiment Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <SentimentTimeline data={sentimentTimeline} onPointClick={onPointClick} />

          {/* Trend Insights */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trend Insights</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-xl">📈</div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 mb-1">
                      Sentiment is improving
                    </div>
                    <div className="text-sm text-blue-700">
                      Overall sentiment has increased by 12% compared to the previous period.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 text-xl">⚠️</div>
                  <div className="flex-1">
                    <div className="font-semibold text-yellow-900 mb-1">Peak activity times</div>
                    <div className="text-sm text-yellow-700">
                      Most discussion occurs between 6 PM - 9 PM. Consider monitoring more closely
                      during these hours.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-green-600 text-xl">✓</div>
                  <div className="flex-1">
                    <div className="font-semibold text-green-900 mb-1">Stable periods</div>
                    <div className="text-sm text-green-700">
                      Weekday mornings (8 AM - 12 PM) show consistently neutral to positive
                      sentiment.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Themes */}
        <div className="space-y-6">
          <TopThemesList themes={themes} maxItems={10} />

          {/* Trending Up */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Up</h3>
            <div className="space-y-3">
              {themes
                .filter((t) => t.trend === 'up')
                .slice(0, 5)
                .map((theme) => (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{theme.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{theme.postCount} posts</div>
                    </div>
                    <div className="text-red-600 font-bold text-sm">
                      ↑ {Math.abs(theme.change).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Trending Down */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Down</h3>
            <div className="space-y-3">
              {themes
                .filter((t) => t.trend === 'down')
                .slice(0, 5)
                .map((theme) => (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{theme.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{theme.postCount} posts</div>
                    </div>
                    <div className="text-green-600 font-bold text-sm">
                      ↓ {Math.abs(theme.change).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
