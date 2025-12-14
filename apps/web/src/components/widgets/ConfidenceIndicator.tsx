'use client';

import { ConfidenceIndicator as ConfidenceData } from '@/types/widgets';

interface ConfidenceIndicatorProps {
  confidence: ConfidenceData;
}

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const getColor = () => {
    switch (confidence.level) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (confidence.level) {
      case 'high':
        return '✓';
      case 'medium':
        return '~';
      case 'low':
        return '!';
      default:
        return '?';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getColor()}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getIcon()}</div>
        <div className="flex-1">
          <div className="font-semibold text-sm uppercase tracking-wide mb-1">
            {confidence.level} Confidence
          </div>
          <p className="text-sm opacity-90 mb-3">{confidence.explanation}</p>

          {/* Factors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Data Volume</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current"
                    style={{ width: `${confidence.factors.volume * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right">{(confidence.factors.volume * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>Source Diversity</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current"
                    style={{ width: `${confidence.factors.sourceDiversity * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right">
                  {(confidence.factors.sourceDiversity * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>Time Span</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current"
                    style={{ width: `${confidence.factors.timeSpan * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right">{(confidence.factors.timeSpan * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
