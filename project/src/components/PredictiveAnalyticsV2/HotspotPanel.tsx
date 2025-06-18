// src/components/PredictiveAnalyticsV2/HotspotPanel.tsx
import React from 'react';
import type { HotspotAlert } from '../../AI/types';
import { AlertTriangle, Zap, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper to determine color and icon based on severity
const getSeverityStyle = (severity: 'High' | 'Medium' | 'Low') => {
  switch (severity) {
    case 'High':
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        textColor: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      };
    case 'Medium':
      return {
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
        textColor: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      };
    case 'Low':
      return {
        icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
        textColor: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      };
  }
};

interface HotspotPanelProps {
  alerts: HotspotAlert[];
  isLoading: boolean;
}

const HotspotPanel: React.FC<HotspotPanelProps> = ({ alerts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Traffic Hotspots</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded col-span-2"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded col-span-1"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Traffic Hotspots</h2>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No upcoming hotspots detected.</p>
        ) : (
          alerts.map((alert, index) => {
            const style = getSeverityStyle(alert.severity);
            const formattedTime = formatDistanceToNow(new Date(alert.expectedAt), { addSuffix: true });
            
            return (
              <div key={index} className={`p-3 rounded-md flex items-start space-x-4 ${style.bgColor}`}>
                <div className="flex-shrink-0">{style.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{alert.locationName}</p>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center mt-1">
                    <span>Expected: {formattedTime}</span>
                    <span className={`${style.textColor} font-medium`}>
                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HotspotPanel;
