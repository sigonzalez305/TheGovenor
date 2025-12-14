'use client';

import { SentimentScore } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface CitySentimentPulseProps {
  sentimentData: SentimentScore;
  onClick?: () => void;
}

export function CitySentimentPulse({ sentimentData, onClick }: CitySentimentPulseProps) {
  const { value, trend, trendValue, label } = sentimentData;

  // Normalize to 0-100 if value is in -100 to 100 range
  const normalizedValue = value < 0 ? (value + 100) / 2 : value;

  // Determine color based on label
  const getColor = () => {
    switch (label) {
      case 'Calm':
        return 'text-ward-green';
      case 'Mixed':
        return 'text-ward-yellow';
      case 'Tense':
        return 'text-orange-500';
      case 'Critical':
        return 'text-ward-red';
      default:
        return 'text-gray-600';
    }
  };

  const getBarColor = () => {
    switch (label) {
      case 'Calm':
        return 'bg-ward-green';
      case 'Mixed':
        return 'bg-ward-yellow';
      case 'Tense':
        return 'bg-orange-500';
      case 'Critical':
        return 'bg-ward-red';
      default:
        return 'bg-gray-400';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">City Sentiment Pulse</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className={`${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            {getTrendIcon()} {Math.abs(trendValue).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Score Display */}
        <div className="flex-1">
          <div className={`text-5xl font-bold ${getColor()}`}>
            {value.toFixed(0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">out of 100</div>
        </div>

        {/* Gauge Visualization */}
        <div className="flex-1 flex flex-col items-end">
          <div className={`text-2xl font-semibold ${getColor()}`}>
            {label}
          </div>
          <div className="w-full max-w-[200px] mt-3">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor()} transition-all duration-500`}
                style={{ width: `${normalizedValue}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        vs previous 24h
      </div>
    </div>
  );
}
