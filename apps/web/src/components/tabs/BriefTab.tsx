'use client';

import { CitySentimentPulse } from '@/components/widgets/CitySentimentPulse';
import { SentimentBreakdownStrip } from '@/components/widgets/SentimentBreakdownStrip';
import { TopThemesList } from '@/components/widgets/TopThemesList';
import { HotspotPreviewCard } from '@/components/widgets/HotspotPreviewCard';
import { SentimentScore, Theme, Hotspot } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface BriefTabProps {
  sentimentData: SentimentScore;
  themes: Theme[];
  hotspots: Hotspot[];
  onOpenSentimentBreakdown?: () => void;
  onViewMap?: () => void;
}

export function BriefTab({
  sentimentData,
  themes,
  hotspots,
  onOpenSentimentBreakdown,
  onViewMap,
}: BriefTabProps) {
  const { timeRange, setTimeRange } = useWidgetStore();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Brief</h1>
          <p className="text-gray-600 mt-1">Quick overview of city sentiment and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Time Range:</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sentiment Pulse */}
          <CitySentimentPulse sentimentData={sentimentData} onClick={onOpenSentimentBreakdown} />

          {/* Sentiment Breakdown */}
          <SentimentBreakdownStrip
            breakdown={{
              positive: 45,
              neutral: 35,
              negative: 20,
            }}
          />

          {/* Top Themes */}
          <TopThemesList themes={themes} maxItems={5} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Hotspot Preview */}
          <HotspotPreviewCard hotspots={hotspots} onViewMap={onViewMap} />

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Active Signals</div>
                <div className="text-2xl font-bold text-gray-900">
                  {hotspots.reduce((sum, h) => sum + h.volume, 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Active Themes</div>
                <div className="text-2xl font-bold text-gray-900">{themes.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Hotspots</div>
                <div className="text-2xl font-bold text-gray-900">{hotspots.length}</div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-900">
              <strong>Last Updated:</strong>{' '}
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
            <div className="text-xs text-blue-700 mt-2">Data refreshes every 5 minutes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
