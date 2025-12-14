'use client';

import { Theme } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface TopThemesListProps {
  themes: Theme[];
  maxItems?: number;
}

export function TopThemesList({ themes, maxItems = 5 }: TopThemesListProps) {
  const { openDrawer } = useWidgetStore();

  const displayThemes = themes.slice(0, maxItems);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-red-600'; // More discussion = red
    if (trend === 'down') return 'text-green-600'; // Less discussion = green
    return 'text-gray-600';
  };

  const getSentimentColor = (breakdown: Theme['sentimentBreakdown']) => {
    if (breakdown.negative > 50) return 'bg-ward-red';
    if (breakdown.positive > 50) return 'bg-ward-green';
    return 'bg-ward-yellow';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Themes</h2>

      <div className="space-y-3">
        {displayThemes.map((theme, index) => (
          <div
            key={theme.id}
            className="group cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
            onClick={() => openDrawer('theme', theme.id)}
          >
            {/* Theme Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-xl font-bold text-gray-400">#{index + 1}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {theme.name}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {theme.postCount} posts
                  </div>
                </div>
              </div>

              {/* Change Indicator */}
              <div
                className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor(theme.trend)}`}
              >
                <span>{getTrendIcon(theme.trend)}</span>
                <span>{Math.abs(theme.change).toFixed(0)}%</span>
              </div>
            </div>

            {/* Intensity Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Intensity</span>
                <span>{theme.intensity.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getSentimentColor(theme.sentimentBreakdown)} transition-all duration-500`}
                  style={{ width: `${theme.intensity}%` }}
                />
              </div>
            </div>

            {/* Keywords */}
            {theme.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {theme.keywords.slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {themes.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
            View all {themes.length} themes →
          </button>
        </div>
      )}
    </div>
  );
}
