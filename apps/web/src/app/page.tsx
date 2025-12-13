'use client';

import { useQuery } from '@tanstack/react-query';
import { WardMap } from '@/components/WardMap';
import { WardStatusTable } from '@/components/WardStatusTable';
import { TopNav } from '@/components/TopNav';
import { api } from '@/lib/api';

export default function Home() {
  const { data: wardStatuses, isLoading } = useQuery({
    queryKey: ['wardStatuses', '24h'],
    queryFn: () => api.getWardStatuses('24h'),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            DC Internet Listener
          </h1>
          <p className="text-gray-600">
            Real-time ward-level monitoring and sentiment analysis for Washington, DC
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map - takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Ward Status Map</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click a ward to see details
                </p>
              </div>
              <div className="h-[600px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading map...</div>
                  </div>
                ) : (
                  <WardMap wardStatuses={wardStatuses?.wardStatuses || []} />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Ward Status</h2>
              {isLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : (
                <WardStatusTable wardStatuses={wardStatuses?.wardStatuses || []} />
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
              <div className="space-y-2">
                <a
                  href="/daily"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  Daily Pulse
                </a>
                <a
                  href="/events"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  Events Explorer
                </a>
                <a
                  href="/alerts"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  Alerts Feed
                </a>
                <a
                  href="/sources"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  Sources Registry
                </a>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">
                Color Legend
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-ward-green rounded mr-2"></div>
                  <span>Green: Positive/Good News</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-ward-yellow rounded mr-2"></div>
                  <span>Yellow: Alerts/Caution</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-ward-red rounded mr-2"></div>
                  <span>Red: Danger/Safety Concerns</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-ward-blue rounded mr-2"></div>
                  <span>Blue: Sales/Free Things</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-ward-pink rounded mr-2"></div>
                  <span>Pink: Missed Connections</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
