import React, { useState, useEffect } from 'react';
import { Download, Filter, AlertTriangle, Loader } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import CongestionChart from '../components/Charts/CongestionChart';
import HeatmapCard from '../components/PredictiveAnalytics/HeatmapCard';
import { getPredictiveAnalyticsData } from '../AI/services';
import type { PredictiveAnalyticsData } from '../AI/types';
import type { TimeFrame } from '../components/Charts/CongestionChart';

const PredictiveAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('heatmaps');
  const [analyticsData, setAnalyticsData] = useState<PredictiveAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('today');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // Using Nairobi CBD as the default location for the trend analysis
      const location = { lat: -1.286389, lng: 36.817223 };

      const response = await getPredictiveAnalyticsData(location, timeFrame);

      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        setError(response.error || 'Failed to fetch predictive data.');
      }
      setLoading(false);
    };

    fetchData();
  }, [timeFrame]); // Re-fetch when timeFrame changes

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader className="animate-spin text-primary-500" size={48} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 text-red-700 rounded-lg p-6">
          <AlertTriangle size={48} className="mb-4" />
          <h3 className="text-lg font-medium">An Error Occurred</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (!analyticsData) {
      return (
        <div className="flex items-center justify-center h-96">
          <p>No analytics data available.</p>
        </div>
      );
    }

    // Data transformation for HeatmapCard
    const transformHeatmapData = (data: typeof analyticsData.heatmaps.oneHour) => {
        return data.map(item => ({ area: item.area, level: item.congestion }));
    };

    switch (activeTab) {
      case 'heatmaps':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <HeatmapCard 
              title="1-Hour Forecast" 
              period="Next Hour" 
              data={transformHeatmapData(analyticsData.heatmaps.oneHour)}
            />
            <HeatmapCard 
              title="4-Hour Forecast" 
              period="Next 4 Hours" 
              data={transformHeatmapData(analyticsData.heatmaps.fourHour)}
            />
            <HeatmapCard 
              title="24-Hour Forecast" 
              period="Next 24 Hours" 
              data={transformHeatmapData(analyticsData.heatmaps.twentyFourHour)}
            />
          </div>
        );
      case 'trends':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <CongestionChart 
                data={analyticsData.trends} 
                activeTimeFrame={timeFrame}
                onTimeFrameChange={setTimeFrame}
            />
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-base font-medium text-secondary-900 mb-4">Weekly Comparison</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Filter size={24} className="mx-auto text-secondary-400 mb-2" />
                  <p className="text-secondary-600">Feature coming soon.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'forecasts':
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">AI Summary</h3>
                <p className="text-secondary-600">Detailed AI-powered text forecasts and summaries will be available here soon.</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader 
        title="Predictive Analytics" 
        subtitle="AI-powered traffic forecasting and trends"
        actions={
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Export Data
          </button>
        }
      />
      
      <FilterBar />
      
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('heatmaps')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'heatmaps'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
              }`}
            >
              Congestion Heatmaps
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'trends'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
              }`}
            >
              Traffic Trends
            </button>
            <button
              onClick={() => setActiveTab('forecasts')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'forecasts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
              }`}
            >
              AI Forecasts
            </button>
          </nav>
        </div>
      </div>
      
      {renderContent()}

    </div>
  );
};

export default PredictiveAnalytics;