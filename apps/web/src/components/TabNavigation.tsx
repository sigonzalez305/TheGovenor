'use client';

import { useState } from 'react';

export type TabType = 'brief' | 'trends' | 'map';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; description: string }[] = [
    { id: 'brief', label: 'Brief', description: 'What matters today' },
    { id: 'trends', label: 'Trends', description: 'Historical patterns' },
    { id: 'map', label: 'Map', description: 'Geographic view' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex flex-col items-center sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-base font-semibold">{tab.label}</span>
              <span className="text-xs font-normal">{tab.description}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
