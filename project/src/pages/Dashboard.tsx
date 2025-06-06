import React from 'react';
import { Calendar, Clock, AlertCircle, BarChart4 } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import CongestionMap from '../components/Dashboard/CongestionMap';
import KpiCard from '../components/Dashboard/KpiCard';
import InsightsList from '../components/Dashboard/InsightsList';
import CongestionChart from '../components/Charts/CongestionChart';
import AreaComparisonChart from '../components/Charts/AreaComparisonChart';
import { trafficData, insights, congestionByHour, areaData } from '../data/mockData';

const Dashboard: React.FC = () => {
  const dateTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div>
      <PageHeader 
        title="Dashboard Overview" 
        subtitle={dateTime}
        actions={
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-gray-50">
            <Calendar size={16} className="mr-2" />
            View Reports
          </button>
        }
      />
      
      <FilterBar />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <KpiCard 
          title="City Congestion Level" 
          value={trafficData.congestionLevel} 
          unit="%" 
          icon={BarChart4}
          trend={{ value: 5, isPositive: false }}
          color="bg-primary-500"
        />
        <KpiCard 
          title="Average Trip Time" 
          value={trafficData.avgTripTime} 
          unit="minutes" 
          icon={Clock}
          trend={{ value: 8, isPositive: false }}
          color="bg-warning-500"
        />
        <KpiCard 
          title="Active Incidents" 
          value={trafficData.incidents} 
          icon={AlertCircle}
          trend={{ value: 2, isPositive: true }}
          color="bg-accent-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CongestionMap />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CongestionChart data={congestionByHour} />
            <AreaComparisonChart data={areaData} />
          </div>
        </div>
        <div>
          <InsightsList insights={insights} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;