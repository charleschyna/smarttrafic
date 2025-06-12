import React from 'react';
import { Calendar, Clock, AlertCircle, BarChart4 } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import CongestionMap from '../components/Dashboard/CongestionMap';
import KpiCard from '../components/Dashboard/KpiCard';
import InsightsList from '../components/Dashboard/InsightsList';
import CongestionChart from '../components/Charts/CongestionChart';
import AreaComparisonChart from '../components/Charts/AreaComparisonChart';
import IncidentsModal from '../components/Dashboard/IncidentsModal'; // Import the new modal
import { getDashboardData } from '../AI/services';
import { insights, congestionByHour, areaData } from '../data/mockData'; // Keep mock data for other charts for now

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false); // State for modal visibility


  React.useEffect(() => {
    const fetchData = async () => {
      // Using a default location for now. This can be made dynamic later.
      const location = { lat: -1.2921, lng: 36.8219 }; // Nairobi
      const radius = 3; // 15km. Set to cover the entire Nairobi area.

      try {
        setLoading(true);
        const response = await getDashboardData(location, radius);
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError(response.error || 'Failed to fetch dashboard data.');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
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
      
      {loading && <p>Loading dashboard data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <KpiCard 
            title="City Congestion Level" 
            value={dashboardData.congestionLevel} 
            unit="%" 
            icon={BarChart4}
            trend={{ value: 5, isPositive: false }} // Trend can be made dynamic later
            color="bg-primary-500"
          />
          <KpiCard 
            title="Average Travel Time" 
            value={dashboardData.avgTripTime} 
            unit="minutes" 
            icon={Clock}
            trend={{ value: 8, isPositive: false }} // Trend can be made dynamic later
            color="bg-warning-500"
          />
          <button onClick={() => setIsModalOpen(true)} className="text-left">
            <KpiCard 
              title="Active Incidents" 
              value={dashboardData.activeIncidents} 
              icon={AlertCircle}
              trend={{ value: 2, isPositive: true }} // Trend can be made dynamic later
              color="bg-accent-500"
            />
          </button>
        </div>
      )}

      {dashboardData && (
        <IncidentsModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          incidents={dashboardData.incidents || []} 
        />
      )}
      
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