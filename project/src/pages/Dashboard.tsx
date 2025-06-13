import React from 'react';
import { Calendar, Clock, AlertCircle, BarChart4 } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import CongestionMap from '../components/Dashboard/CongestionMap';
import KpiCard from '../components/Dashboard/KpiCard';
import InsightsList from '../components/Dashboard/InsightsList';
import CongestionChart, { TimeFrame } from '../components/Charts/CongestionChart';
import AreaComparisonChart from '../components/Charts/AreaComparisonChart';
import IncidentsModal from '../components/Dashboard/IncidentsModal';
import StatsModal from '../components/Dashboard/StatsModal'; // Import the new stats modal
import { getDashboardData } from '../AI/services';
import { insights } from '../data/mockData'; // Keep mock data for other charts for now

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCongestionModalOpen, setIsCongestionModalOpen] = React.useState(false);
  const [isTravelTimeModalOpen, setIsTravelTimeModalOpen] = React.useState(false);
  const [timeFrame, setTimeFrame] = React.useState<TimeFrame>('today');


  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      // Using a default location for now. This can be made dynamic later.
      const location = { lat: -1.2921, lng: 36.8219 }; // Nairobi
      const radius = 3; // 15km. Set to cover the entire Nairobi area.

      try {
        setLoading(true);
        const response = await getDashboardData(location, radius, timeFrame);
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
  }, [timeFrame]);
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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <button onClick={() => setIsCongestionModalOpen(true)} className="text-left">
              <KpiCard 
                title="City Congestion Level" 
                value={dashboardData?.congestionLevel} 
                unit="%" 
                icon={BarChart4}
                trend={{ value: 5, isPositive: false }} // Trend can be made dynamic later
                color="bg-primary-500"
              />
            </button>
            <button onClick={() => setIsTravelTimeModalOpen(true)} className="text-left">
              <KpiCard 
                title="Average Travel Time" 
                value={dashboardData?.avgTripTime} 
                unit="minutes" 
                icon={Clock}
                trend={{ value: 8, isPositive: false }} // Trend can be made dynamic later
                color="bg-warning-500"
              />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="text-left">
              <KpiCard 
                title="Active Incidents" 
                value={dashboardData?.activeIncidents} 
                icon={AlertCircle}
                trend={{ value: 2, isPositive: true }} // Trend can be made dynamic later
                color="bg-accent-500"
              />
            </button>
          </div>

          <IncidentsModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            incidents={dashboardData?.incidents || []} 
          />

          <StatsModal
            isOpen={isCongestionModalOpen}
            onClose={() => setIsCongestionModalOpen(false)}
            title="Congestion Level Details"
            stats={[
              { label: 'Avg. Current Travel Time', value: Math.round(dashboardData?.avgTripTime * 60), unit: 's' },
              { label: 'Avg. Free-Flow Time', value: Math.round(dashboardData?.freeFlowTravelTime), unit: 's' },
              { label: 'Congestion (Delay)', value: `${dashboardData?.congestionLevel}%`, unit: '' },
            ]}
            description="Congestion is the percentage increase in travel time compared to free-flow conditions."
          />

          <StatsModal
            isOpen={isTravelTimeModalOpen}
            onClose={() => setIsTravelTimeModalOpen(false)}
            title="Average Travel Time Details"
            stats={[
              { label: 'Current Avg. Travel Time', value: dashboardData?.avgTripTime, unit: 'min' },
              { label: 'Typical (Free-Flow) Time', value: Math.round(dashboardData?.freeFlowTravelTime / 60), unit: 'min' },
              { label: 'Current Delay', value: Math.round(dashboardData?.avgTripTime - (dashboardData?.freeFlowTravelTime / 60)), unit: 'min' },
            ]}
            description="This is the average time to travel through the monitored area, compared to a typical day with no traffic."
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CongestionMap />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CongestionChart 
              data={dashboardData?.congestionForecast || []} 
              onTimeFrameChange={handleTimeFrameChange}
              activeTimeFrame={timeFrame}
            />
                <AreaComparisonChart data={dashboardData?.areaComparisonData || []} />
              </div>
            </div>
            <div>
              <InsightsList insights={insights} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;