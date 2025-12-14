'use client';

import { useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { TabNavigation, TabType } from '@/components/TabNavigation';
import { BriefTab } from '@/components/tabs/BriefTab';
import { TrendsTab } from '@/components/tabs/TrendsTab';
import { MapTab } from '@/components/tabs/MapTab';
import { ThemeDetailDrawer } from '@/components/widgets/ThemeDetailDrawer';
import { HotspotDetailDrawer } from '@/components/widgets/HotspotDetailDrawer';
import { useWidgetStore } from '@/store/widgetStore';
import {
  useSentimentData,
  useThemesData,
  useHotspotsData,
  useThemeDetail,
  useHotspotDetail,
} from '@/hooks/useWidgetData';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('brief');
  const { drawerOpen, drawerContent, selectedItem, closeDrawer } = useWidgetStore();

  // Fetch widget data
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentData();
  const { data: themesData, isLoading: themesLoading } = useThemesData();
  const { data: hotspotsData, isLoading: hotspotsLoading } = useHotspotsData();

  // Fetch drawer data based on selected item
  const { data: themeDetail } = useThemeDetail(
    drawerContent === 'theme' ? selectedItem.id : null
  );
  const { data: hotspotDetail } = useHotspotDetail(
    drawerContent === 'hotspot' ? selectedItem.id : null
  );

  const handleViewMap = () => {
    setActiveTab('map');
  };

  const isLoading = sentimentLoading || themesLoading || hotspotsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="sticky top-0 z-30 shadow-sm">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main>
        {isLoading ? (
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="text-gray-500 text-lg">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {activeTab === 'brief' && sentimentData && themesData && hotspotsData && (
              <BriefTab
                sentimentData={sentimentData.pulse}
                themes={themesData.topThemes}
                hotspots={hotspotsData.hotspots}
                onViewMap={handleViewMap}
              />
            )}

            {activeTab === 'trends' && sentimentData && themesData && (
              <TrendsTab
                sentimentTimeline={sentimentData.timeline}
                themes={themesData.topThemes}
                onPointClick={(timestamp) => {
                  console.log('Clicked timeline point:', timestamp);
                  // TODO: Filter feed/map by timestamp
                }}
              />
            )}

            {activeTab === 'map' && hotspotsData && (
              <MapTab hotspots={hotspotsData.hotspots} />
            )}
          </>
        )}
      </main>

      {/* Drawers */}
      {drawerOpen && drawerContent === 'theme' && themeDetail && (
        <ThemeDetailDrawer theme={themeDetail} onClose={closeDrawer} />
      )}

      {drawerOpen && drawerContent === 'hotspot' && hotspotDetail && (
        <HotspotDetailDrawer hotspot={hotspotDetail} onClose={closeDrawer} />
      )}
    </div>
  );
}
