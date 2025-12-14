import { create } from 'zustand';

export type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface WidgetState {
  // Filters
  location: string | null; // Ward ID
  timeRange: TimeRange;
  sentimentFilter: SentimentFilter;
  themeFilter: string | null; // Theme name
  sourceFilter: string | null; // Source ID

  // UI State
  selectedItem: {
    type: 'signal' | 'theme' | 'hotspot' | null;
    id: string | null;
  };
  drawerOpen: boolean;
  drawerContent: 'theme' | 'hotspot' | null;

  // Actions
  setLocation: (location: string | null) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setSentimentFilter: (filter: SentimentFilter) => void;
  setThemeFilter: (theme: string | null) => void;
  setSourceFilter: (source: string | null) => void;
  setSelectedItem: (type: 'signal' | 'theme' | 'hotspot' | null, id: string | null) => void;
  openDrawer: (content: 'theme' | 'hotspot', itemId: string) => void;
  closeDrawer: () => void;
  resetFilters: () => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  // Initial state
  location: null,
  timeRange: '24h',
  sentimentFilter: 'all',
  themeFilter: null,
  sourceFilter: null,
  selectedItem: {
    type: null,
    id: null,
  },
  drawerOpen: false,
  drawerContent: null,

  // Actions
  setLocation: (location) => set({ location }),
  setTimeRange: (timeRange) => set({ timeRange }),
  setSentimentFilter: (sentimentFilter) => set({ sentimentFilter }),
  setThemeFilter: (themeFilter) => set({ themeFilter }),
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),
  setSelectedItem: (type, id) =>
    set({
      selectedItem: { type, id },
    }),
  openDrawer: (content, itemId) =>
    set({
      drawerOpen: true,
      drawerContent: content,
      selectedItem: {
        type: content === 'theme' ? 'theme' : 'hotspot',
        id: itemId,
      },
    }),
  closeDrawer: () =>
    set({
      drawerOpen: false,
      drawerContent: null,
    }),
  resetFilters: () =>
    set({
      location: null,
      timeRange: '24h',
      sentimentFilter: 'all',
      themeFilter: null,
      sourceFilter: null,
    }),
}));
