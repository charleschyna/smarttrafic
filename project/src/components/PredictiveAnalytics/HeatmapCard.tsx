import React from 'react';
import { Clock } from 'lucide-react';

interface HeatmapCardProps {
  title: string;
  period: string;
  data: Array<{ area: string; level: number }>;
}

const HeatmapCard: React.FC<HeatmapCardProps> = ({ title, period, data }) => {
  const getColorClass = (level: number) => {
    if (level < 40) return 'bg-green-500';
    if (level < 60) return 'bg-yellow-500';
    if (level < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-secondary-900">{title}</h3>
        <div className="flex items-center text-xs text-secondary-500">
          <Clock size={14} className="mr-1" />
          <span>{period}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {data.map((item) => (
            <div 
              key={item.area} 
              className="border border-gray-100 rounded-lg p-3 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-secondary-800">{item.area}</span>
              <div className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${getColorClass(item.level)}`}
                ></div>
                <span className="text-sm text-secondary-700">{item.level}%</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
              <span className="text-xs text-secondary-600">Low</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
              <span className="text-xs text-secondary-600">Medium</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-1.5"></div>
              <span className="text-xs text-secondary-600">High</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
              <span className="text-xs text-secondary-600">Severe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapCard;