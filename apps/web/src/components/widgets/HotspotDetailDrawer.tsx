'use client';

import { HotspotDetail } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';
import { SentimentBreakdownStrip } from './SentimentBreakdownStrip';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EvidenceStack } from './EvidenceStack';

interface HotspotDetailDrawerProps {
  hotspot: HotspotDetail;
  onClose: () => void;
}

export function HotspotDetailDrawer({ hotspot, onClose }: HotspotDetailDrawerProps) {
  const { drawerOpen } = useWidgetStore();

  if (!drawerOpen) return null;

  const getSeverityBadge = () => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[hotspot.severity];
  };

  const formattedTimeline = hotspot.timeline.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    score: point.score,
  }));

  // Calculate sentiment breakdown from hotspot data
  const sentimentBreakdown = {
    positive: (hotspot.sentimentScore > 0 ? hotspot.sentimentScore : 0) / 100 * 100,
    negative: (hotspot.sentimentScore < 0 ? Math.abs(hotspot.sentimentScore) : 0) / 100 * 100,
    neutral: 100 - Math.abs(hotspot.sentimentScore),
  };

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
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{hotspot.wardName}</h2>
                <span className={`px-3 py-1 rounded border text-xs font-semibold uppercase ${getSeverityBadge()}`}>
                  {hotspot.severity}
                </span>
                {hotspot.isActive && (
                  <span className="px-3 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Ward {hotspot.wardId}</span>
                <span>•</span>
                <span>{hotspot.volume} signals</span>
                <span>•</span>
                <span>Updated {hotspot.recency}m ago</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{hotspot.summary}</p>
          </div>

          {/* Theme Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Themes</h3>
            <div className="space-y-2">
              {hotspot.themeBreakdown.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{theme.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {theme.postCount} posts • Intensity: {theme.intensity.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    {theme.trend === 'up' ? '↑' : theme.trend === 'down' ? '↓' : '→'}{' '}
                    {Math.abs(theme.change).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sentiment</h3>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Score</span>
                <span className="text-2xl font-bold">{hotspot.sentimentScore.toFixed(0)}</span>
              </div>
            </div>
            <SentimentBreakdownStrip breakdown={sentimentBreakdown} />
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
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Posts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Posts</h3>
            <EvidenceStack posts={hotspot.recentPosts} />
          </div>

          {/* Suggested Actions */}
          {hotspot.suggestedActions && hotspot.suggestedActions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggested Actions</h3>
              <div className="space-y-2">
                {hotspot.suggestedActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="text-blue-600 text-lg">→</div>
                    <div className="flex-1 text-gray-700">{action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Location Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Ward</div>
                <div className="font-semibold text-gray-900">{hotspot.wardId}</div>
              </div>
              <div>
                <div className="text-gray-500">Coordinates</div>
                <div className="font-semibold text-gray-900 text-xs">
                  {hotspot.location.lat.toFixed(4)}, {hotspot.location.lng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
