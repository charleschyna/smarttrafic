import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon: Icon,
  trend,
  color
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-secondary-600 mb-1">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-secondary-900">{value}</p>
            {unit && <span className="ml-1 text-sm text-secondary-500">{unit}</span>}
          </div>
          
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${
              trend.isPositive ? 'text-success-500' : 'text-accent-500'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="ml-1 text-secondary-500">vs last week</span>
            </div>
          )}
        </div>
        
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default KpiCard;