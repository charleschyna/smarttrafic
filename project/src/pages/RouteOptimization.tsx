import React from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import RouteForm from '../components/RouteOptimization/RouteForm';
import RouteResults from '../components/RouteOptimization/RouteResults';
import { routeData } from '../data/mockData';

const RouteOptimization: React.FC = () => {
  return (
    <div>
      <PageHeader 
        title="Route Optimization" 
        subtitle="Find the most efficient routes with real-time traffic data"
        actions={
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Export Route
          </button>
        }
      />
      
      <FilterBar />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <RouteForm />
        </div>
        <div className="lg:col-span-2">
          <RouteResults route={routeData[0]} alternativeRoutes={[routeData[1], routeData[2]]} />
        </div>
      </div>
    </div>
  );
};

export default RouteOptimization;