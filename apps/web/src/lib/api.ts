const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Wards
  getWards: () => fetchAPI<any>('/wards'),
  getWard: (id: number) => fetchAPI<any>(`/wards/${id}`),
  getWardStatuses: (window: string = '24h') => fetchAPI<any>(`/wards/status?window=${window}`),

  // Signals
  getSignals: (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<any>(`/signals?${query}`);
  },
  getSignal: (id: number) => fetchAPI<any>(`/signals/${id}`),

  // Events
  getEvents: (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<any>(`/events?${query}`);
  },
  getEvent: (id: number) => fetchAPI<any>(`/events/${id}`),

  // Sources
  getSources: () => fetchAPI<any>('/sources'),
  getSource: (id: number) => fetchAPI<any>(`/sources/${id}`),
  getSourceHealth: () => fetchAPI<any>('/sources/health'),

  // Daily
  getDaily: (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<any>(`/daily?${query}`);
  },
  getDailyPulse: () => fetchAPI<any>('/daily/pulse'),

  // Search
  search: (q: string, type: string = 'all') =>
    fetchAPI<any>(`/search?q=${encodeURIComponent(q)}&type=${type}`),
};
