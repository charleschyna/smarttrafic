import React, { useState } from 'react';
import { Clock, Download, Filter } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import CongestionChart from '../components/Charts/CongestionChart';
import HeatmapCard from '../components/PredictiveAnalytics/HeatmapCard';
import { congestionByHour, forecastData } from '../data/mockData';

const PredictiveAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('heatmaps');
  
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
      
      {activeTab === 'heatmaps' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HeatmapCard 
            title="1-Hour Forecast" 
            period="Next Hour" 
            data={forecastData.oneHour}
          />
          <HeatmapCard 
            title="4-Hour Forecast" 
            period="Next 4 Hours" 
            data={forecastData.fourHour}
          />
          <HeatmapCard 
            title="24-Hour Forecast" 
            period="Next 24 Hours" 
            data={forecastData.twentyFourHour}
          />
        </div>
      )}
      
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CongestionChart data={congestionByHour} />
          
          {/* Placeholder for trend comparison chart */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-base font-medium text-secondary-900 mb-4">Weekly Comparison</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Filter size={24} className="mx-auto text-secondary-400 mb-2" />
                <p className="text-secondary-600">Select filters to view comparison data</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'forecasts' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-secondary-900">AI Traffic Forecast</h3>
            <div className="flex items-center text-sm text-secondary-500">
              <Clock size={16} className="mr-1.5" />
              <span>Last updated: Today, 10:45 AM</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="h-64 bg-gray-100 rounded-lg overflow-hidden relative">
              <div style={{ 
                backgroundImage: `url(https://images.pexels.com/photos/417023/pexels-photo-417023.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100%',
                opacity: 0.7
              }}></div>
              
              {/* Overlay showing congestion forecast */}
              <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-accent-500/40 rounded-full"></div>
                <div className="absolute bottom-1/3 right-1/4 w-1/4 h-1/4 bg-warning-500/40 rounded-full"></div>
                <div className="absolute top-1/2 right-1/3 w-1/5 h-1/5 bg-primary-500/40 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-secondary-900 mb-2">Morning Forecast (6AM-12PM)</h4>
              <p className="text-sm text-secondary-700 mb-2">
                Expect heavy congestion on Thika Road between 7AM and 9AM.
              </p>
              <div className="flex items-center text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-500 mr-1.5"></div>
                <span className="text-secondary-700">75% Congestion</span>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-secondary-900 mb-2">Afternoon Forecast (12PM-5PM)</h4>
              <p className="text-sm text-secondary-700 mb-2">
                Moderate traffic expected in CBD and Westlands areas.
              </p>
              <div className="flex items-center text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-warning-500 mr-1.5"></div>
                <span className="text-secondary-700">55% Congestion</span>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-secondary-900 mb-2">Evening Forecast (5PM-8PM)</h4>
              <p className="text-sm text-secondary-700 mb-2">
                Heavy traffic expected on all major highways out of the city.
              </p>
              <div className="flex items-center text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-500 mr-1.5"></div>
                <span className="text-secondary-700">80% Congestion</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalytics;