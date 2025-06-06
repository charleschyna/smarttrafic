import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AreaData } from '../../types';

interface AreaComparisonChartProps {
  data: AreaData[];
}

const AreaComparisonChart: React.FC<AreaComparisonChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-base font-medium text-secondary-900 mb-4">Area Comparison</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e0e0e0' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value: number) => [`${value}%`, 'Congestion']}
              contentStyle={{ 
                borderRadius: '4px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar 
              dataKey="congestionLevel" 
              name="Congestion" 
              fill="#2F9E44" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-secondary-600">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-primary-500 mr-1.5"></span>
          <span>Congestion Level</span>
        </div>
        
        <select className="text-xs border border-gray-200 rounded-md px-2 py-1">
          <option>By Congestion</option>
          <option>By Trip Time</option>
        </select>
      </div>
    </div>
  );
};

export default AreaComparisonChart;