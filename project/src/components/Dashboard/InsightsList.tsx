import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Insight } from '../../types';

interface InsightsListProps {
  insights: Insight[];
}

const InsightsList: React.FC<InsightsListProps> = ({ insights }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={16} className="text-accent-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-warning-500" />;
      case 'info':
      default:
        return <Info size={16} className="text-primary-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-medium text-secondary-900">Live AI Insights</h3>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {insights.map((insight) => (
          <div 
            key={insight.id} 
            className="px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {getSeverityIcon(insight.severity)}
              </div>
              <div>
                <p className="text-sm text-secondary-800">{insight.message}</p>
                <p className="text-xs text-secondary-500 mt-1">{insight.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All Insights
        </button>
      </div>
    </div>
  );
};

export default InsightsList;