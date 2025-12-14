'use client';

import { HotspotMap } from '@/components/widgets/HotspotMap';
import { Hotspot } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface MapTabProps {
  hotspots: Hotspot[];
  wardGeojson?: any;
}

export function MapTab({ hotspots, wardGeojson }: MapTabProps) {
  const {
    timeRange,
    setTimeRange,
    sentimentFilter,
    setSentimentFilter,
    themeFilter,
    setThemeFilter,
    resetFilters,
  } = useWidgetStore();

  // Get unique themes from hotspots
  const allThemes = Array.from(new Set(hotspots.flatMap((h) => h.topThemes)));

  // Count hotspots by severity
  const severityCounts = {
    critical: hotspots.filter((h) => h.severity === 'critical').length,
    high: hotspots.filter((h) => h.severity === 'high').length,
    medium: hotspots.filter((h) => h.severity === 'medium').length,
    low: hotspots.filter((h) => h.severity === 'low').length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geographic View</h1>
          <p className="text-gray-600 mt-1">Explore hotspots across the city</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Filters and Stats */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              {/* Sentiment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment</label>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              {/* Theme Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={themeFilter || ''}
                  onChange={(e) => setThemeFilter(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Themes</option>
                  {allThemes.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Severity Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">By Severity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ward-red rounded-full"></div>
                  <span className="text-sm text-gray-700">Critical</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{severityCounts.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">High</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{severityCounts.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ward-yellow rounded-full"></div>
                  <span className="text-sm text-gray-700">Medium</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{severityCounts.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ward-green rounded-full"></div>
                  <span className="text-sm text-gray-700">Low</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{severityCounts.low}</span>
              </div>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Total Hotspots</div>
                <div className="text-3xl font-bold text-gray-900">{hotspots.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Active Now</div>
                <div className="text-3xl font-bold text-green-600">
                  {hotspots.filter((h) => h.isActive).length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Signals</div>
                <div className="text-3xl font-bold text-blue-600">
                  {hotspots.reduce((sum, h) => sum + h.volume, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map */}
        <div className="lg:col-span-3">
          <HotspotMap hotspots={hotspots} wardGeojson={wardGeojson} />
        </div>
      </div>
    </div>
  );
}
