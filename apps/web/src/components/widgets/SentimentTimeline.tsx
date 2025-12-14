'use client';

import { SentimentTimeSeries } from '@/types/widgets';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState } from 'react';

interface SentimentTimelineProps {
  data: SentimentTimeSeries[];
  onPointClick?: (timestamp: string) => void;
}

export function SentimentTimeline({ data, onPointClick }: SentimentTimelineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from data
  const categories = Array.from(new Set(data.map((d) => d.category).filter(Boolean)));

  // Format data for Recharts
  const formattedData = data.map((point) => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    fullTimestamp: point.timestamp,
    score: point.score,
    category: point.category,
  }));

  // Filter data by selected category if applicable
  const displayData = selectedCategory
    ? formattedData.filter((d) => d.category === selectedCategory)
    : formattedData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded border border-gray-200">
          <p className="text-sm font-semibold">{payload[0].payload.timestamp}</p>
          <p className="text-sm text-gray-600">
            Score: <span className="font-semibold">{payload[0].value.toFixed(1)}</span>
          </p>
          {payload[0].payload.category && (
            <p className="text-xs text-gray-500 mt-1">{payload[0].payload.category}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const handlePointClick = (data: any) => {
    if (onPointClick && data && data.activePayload) {
      onPointClick(data.activePayload[0].payload.fullTimestamp);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sentiment Over Time</h2>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedCategory(category || null)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={displayData} onClick={handlePointClick}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={[-100, 100]}
            ticks={[-100, -50, 0, 50, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Click a point to view posts from that time period
      </div>
    </div>
  );
}
