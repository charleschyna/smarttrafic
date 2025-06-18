// src/pages/PredictiveAnalyticsV2.tsx
import React, { useState, useEffect } from 'react';
import HotspotPanel from '../components/PredictiveAnalyticsV2/HotspotPanel';
import RecommendationsPanel from '../components/PredictiveAnalyticsV2/RecommendationsPanel';
import { getPredictiveAnalyticsV2Data } from '../AI/services';
import type { HotspotAlert, AIRecommendation } from '../AI/types';
import { toast } from 'react-toastify';

const PredictiveAnalyticsV2: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hotspots, setHotspots] = useState<HotspotAlert[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Using a central Nairobi location for this example
      const location = { lat: -1.286389, lng: 36.817223 };
      const radius = 5000; // 5km radius

      const response = await getPredictiveAnalyticsV2Data(location, radius);

      if (response.success && response.data) {
        setHotspots(response.data.hotspotAlerts);
        setRecommendations(response.data.aiRecommendations);
      } else {
        console.error('Failed to fetch predictive analytics data:', response.error);
        toast.error(`Error: ${response.error || 'Could not load predictive data.'}`);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Predictive Analytics</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Forecasting traffic hotspots and providing actionable insights for Nairobi.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column for Panels */}
          <div className="lg:col-span-1">
            <HotspotPanel alerts={hotspots} isLoading={isLoading} />
            <RecommendationsPanel recommendations={recommendations} isLoading={isLoading} />
          </div>

          {/* Right Column for Map (Placeholder) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow min-h-[400px] lg:min-h-[700px]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Predictive Traffic Map</h2>
            <div className="mt-4 flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 rounded-md">
              <p className="text-gray-500 dark:text-gray-400">Interactive map coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsV2;
