import React from 'react';
import { 
  FileText, 
  Download, 
  BarChart, 
  ArrowRight 
} from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  lastUpdated: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ 
  title, 
  description, 
  icon,
  lastUpdated 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-xs text-secondary-500">Last updated: {lastUpdated}</span>
        </div>
        
        <h3 className="font-medium text-secondary-900 mb-1">{title}</h3>
        <p className="text-sm text-secondary-600 mb-4">{description}</p>
        
        <div className="flex items-center justify-between">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
            <span>View Report</span>
            <ArrowRight size={16} className="ml-1" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button className="p-1.5 rounded-md text-secondary-600 hover:text-primary-600 hover:bg-gray-50">
              <BarChart size={18} />
            </button>
            <button className="p-1.5 rounded-md text-secondary-600 hover:text-primary-600 hover:bg-gray-50">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;