'use client';

import { SentimentBreakdown } from '@/types/widgets';
import { useWidgetStore } from '@/store/widgetStore';

interface SentimentBreakdownStripProps {
  breakdown: SentimentBreakdown;
}

export function SentimentBreakdownStrip({ breakdown }: SentimentBreakdownStripProps) {
  const { setSentimentFilter } = useWidgetStore();

  const handleSegmentClick = (sentiment: 'positive' | 'neutral' | 'negative') => {
    setSentimentFilter(sentiment);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Sentiment Distribution</h3>

      {/* Stacked Bar */}
      <div className="flex h-12 rounded-lg overflow-hidden mb-3">
        {/* Positive */}
        <div
          className="bg-ward-green hover:opacity-80 cursor-pointer transition-opacity flex items-center justify-center text-white font-semibold"
          style={{ width: `${breakdown.positive}%` }}
          onClick={() => handleSegmentClick('positive')}
          title="Filter by positive sentiment"
        >
          {breakdown.positive > 15 && `${breakdown.positive.toFixed(0)}%`}
        </div>

        {/* Neutral */}
        <div
          className="bg-gray-400 hover:opacity-80 cursor-pointer transition-opacity flex items-center justify-center text-white font-semibold"
          style={{ width: `${breakdown.neutral}%` }}
          onClick={() => handleSegmentClick('neutral')}
          title="Filter by neutral sentiment"
        >
          {breakdown.neutral > 15 && `${breakdown.neutral.toFixed(0)}%`}
        </div>

        {/* Negative */}
        <div
          className="bg-ward-red hover:opacity-80 cursor-pointer transition-opacity flex items-center justify-center text-white font-semibold"
          style={{ width: `${breakdown.negative}%` }}
          onClick={() => handleSegmentClick('negative')}
          title="Filter by negative sentiment"
        >
          {breakdown.negative > 15 && `${breakdown.negative.toFixed(0)}%`}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-ward-green rounded"></div>
          <span>Positive {breakdown.positive.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>Neutral {breakdown.neutral.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-ward-red rounded"></div>
          <span>Negative {breakdown.negative.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
