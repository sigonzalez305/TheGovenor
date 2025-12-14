'use client';

import { Signal } from '@dc-listener/shared';
import { useState } from 'react';

interface EvidenceStackProps {
  posts: Signal[];
  maxInitial?: number;
}

export function EvidenceStack({ posts, maxInitial = 3 }: EvidenceStackProps) {
  const [expanded, setExpanded] = useState(false);
  const displayPosts = expanded ? posts : posts.slice(0, maxInitial);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-ward-green';
      case 'negative':
        return 'border-l-ward-red';
      default:
        return 'border-l-gray-400';
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'green':
        return '✓';
      case 'yellow':
        return '⚠';
      case 'red':
        return '🚨';
      case 'blue':
        return '💰';
      case 'pink':
        return '💬';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-3">
      {displayPosts.map((post) => (
        <div
          key={post.id}
          className={`border-l-4 ${getSentimentColor(post.sentiment)} bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(post.category)}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {post.sourceId || 'Unknown Source'}
                </div>
                <div className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</div>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${getSentimentBadge(post.sentiment)} font-semibold`}
            >
              {post.sentiment}
            </span>
          </div>

          {/* Content */}
          <p className="text-gray-700 text-sm leading-relaxed mb-2">{post.body}</p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {post.ward_id && <span>Ward {post.ward_id}</span>}
            {post.themes && post.themes.length > 0 && (
              <span>
                {post.themes.length} theme{post.themes.length > 1 ? 's' : ''}
              </span>
            )}
            {post.entities && post.entities.length > 0 && (
              <span>
                {post.entities.length} entit{post.entities.length > 1 ? 'ies' : 'y'}
              </span>
            )}
            {post.riskScore !== undefined && post.riskScore > 0.5 && (
              <span className="text-red-600 font-semibold">
                Risk: {(post.riskScore * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* Themes Tags */}
          {post.themes && post.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.themes.slice(0, 3).map((theme: string, idx: number) => (
                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Expand/Collapse Button */}
      {posts.length > maxInitial && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
        >
          {expanded ? '↑ Show less' : `↓ Show ${posts.length - maxInitial} more posts`}
        </button>
      )}
    </div>
  );
}
