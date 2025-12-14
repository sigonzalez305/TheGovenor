'use client';

import { Hotspot } from '@/types/widgets';

interface HotspotPreviewCardProps {
  hotspots: Hotspot[];
  onViewMap?: () => void;
}

export function HotspotPreviewCard({ hotspots, onViewMap }: HotspotPreviewCardProps) {
  // Get top 3-5 most severe hotspots
  const topHotspots = hotspots
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .slice(0, 5);

  const getSeverityColor = (severity: Hotspot['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-ward-red';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-ward-yellow';
      case 'low':
        return 'bg-ward-green';
      default:
        return 'bg-gray-400';
    }
  };

  const getSeverityPulse = (isActive: boolean) => {
    if (!isActive) return '';
    return 'animate-pulse';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Hotspots</h2>
        <span className="text-sm text-gray-600">
          {hotspots.filter((h) => h.isActive).length} active
        </span>
      </div>

      {/* Mini Map Representation */}
      <div className="relative bg-gray-100 rounded-lg h-48 mb-4 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-gray-200"></div>
          ))}
        </div>

        {/* Hotspot Dots */}
        {topHotspots.map((hotspot, index) => (
          <div
            key={hotspot.id}
            className="absolute"
            style={{
              left: `${(index * 20 + 15) % 80 + 10}%`,
              top: `${(index * 25 + 20) % 70 + 15}%`,
            }}
          >
            <div
              className={`relative ${getSeverityColor(hotspot.severity)} ${getSeverityPulse(hotspot.isActive)} rounded-full opacity-70`}
              style={{
                width: `${Math.max(20, hotspot.volume / 10)}px`,
                height: `${Math.max(20, hotspot.volume / 10)}px`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {hotspot.volume}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hotspot List */}
      <div className="space-y-2">
        {topHotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div
              className={`w-3 h-3 rounded-full ${getSeverityColor(hotspot.severity)} ${getSeverityPulse(hotspot.isActive)}`}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {hotspot.wardName}
              </div>
              <div className="text-xs text-gray-500">
                {hotspot.volume} signals • {hotspot.recency}m ago
              </div>
            </div>
            <div className="text-xs text-gray-600 uppercase font-semibold">{hotspot.severity}</div>
          </div>
        ))}
      </div>

      {/* View Map Button */}
      <button
        onClick={onViewMap}
        className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
      >
        View Full Map →
      </button>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{hotspots.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">
            {hotspots.filter((h) => h.severity === 'critical').length}
          </div>
          <div className="text-xs text-gray-500">Critical</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {hotspots.filter((h) => h.isActive).length}
          </div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
      </div>
    </div>
  );
}
