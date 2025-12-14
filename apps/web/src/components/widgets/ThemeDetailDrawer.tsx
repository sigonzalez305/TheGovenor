'use client';

import { ThemeDetail } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';
import { SentimentBreakdownStrip } from './SentimentBreakdownStrip';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EvidenceStack } from './EvidenceStack';
import { Signal } from '@dc-listener/shared';

interface ThemeDetailDrawerProps {
  theme: ThemeDetail;
  onClose: () => void;
}

export function ThemeDetailDrawer({ theme, onClose }: ThemeDetailDrawerProps) {
  const { drawerOpen } = useWidgetStore();

  if (!drawerOpen) return null;

  const formattedTimeline = theme.timeline.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    score: point.score,
  }));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{theme.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>{theme.postCount} posts</span>
                <span>•</span>
                <span>Intensity: {theme.intensity.toFixed(0)}%</span>
                <span>•</span>
                <span
                  className={
                    theme.trend === 'up'
                      ? 'text-red-600'
                      : theme.trend === 'down'
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }
                >
                  {theme.trend === 'up' ? '↑' : theme.trend === 'down' ? '↓' : '→'}{' '}
                  {Math.abs(theme.change).toFixed(0)}%
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
            >
              ×
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
              Follow Theme
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold">
              Mute Theme
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold">
              View on Map
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{theme.summary}</p>
          </div>

          {/* Sentiment Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sentiment Distribution</h3>
            <SentimentBreakdownStrip breakdown={theme.sentimentBreakdown} />
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Timeline</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formattedTimeline}>
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Posts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Posts</h3>
            <EvidenceStack posts={theme.topPosts} />
          </div>

          {/* Related Locations */}
          {theme.relatedLocations && theme.relatedLocations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Locations</h3>
              <div className="flex flex-wrap gap-2">
                {theme.relatedLocations.map((wardId) => (
                  <span
                    key={wardId}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold"
                  >
                    Ward {wardId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {theme.keywords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Terms</h3>
              <div className="flex flex-wrap gap-2">
                {theme.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Themes */}
          {theme.relatedThemes && theme.relatedThemes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Themes</h3>
              <div className="space-y-2">
                {theme.relatedThemes.map((relatedTheme) => (
                  <div
                    key={relatedTheme.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="font-semibold text-gray-900">{relatedTheme.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {relatedTheme.postCount} posts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
