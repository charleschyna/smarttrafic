import React from 'react';
import { FileText, BarChart, AreaChart, PieChart } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import FilterBar from '../components/Common/FilterBar';
import ReportCard from '../components/Reports/ReportCard';

const Reports: React.FC = () => {
  const reportTypes = [
    { 
      title: 'Weekly Traffic Summary', 
      description: 'Overview of traffic patterns and congestion levels for the past week',
      icon: <BarChart size={20} />,
      lastUpdated: 'Today, 08:30 AM'
    },
    { 
      title: 'Monthly Trend Analysis', 
      description: 'Long-term traffic trends and comparison with previous months',
      icon: <AreaChart size={20} />,
      lastUpdated: 'Yesterday, 04:15 PM'
    },
    { 
      title: 'Area Congestion Report', 
      description: 'Detailed breakdown of congestion by city areas and neighborhoods',
      icon: <PieChart size={20} />,
      lastUpdated: '3 days ago'
    },
    { 
      title: 'AI Optimization Insights', 
      description: 'AI-generated recommendations for traffic flow improvements',
      icon: <FileText size={20} />,
      lastUpdated: '1 week ago'
    },
    { 
      title: 'Route Efficiency Analysis', 
      description: 'Performance metrics for major routes and thoroughfares',
      icon: <BarChart size={20} />,
      lastUpdated: '1 week ago'
    },
    { 
      title: 'Incident Response Report', 
      description: 'Summary of traffic incidents and response effectiveness',
      icon: <FileText size={20} />,
      lastUpdated: '2 weeks ago'
    }
  ];

  return (
    <div>
      <PageHeader 
        title="Reports & Exports" 
        subtitle="Access and download traffic data reports"
      />
      
      <FilterBar />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <ReportCard 
            key={index}
            title={report.title}
            description={report.description}
            icon={report.icon}
            lastUpdated={report.lastUpdated}
          />
        ))}
      </div>
    </div>
  );
};

export default Reports;