import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CongestionForecast } from '../../AI/types';

export type TimeFrame = 'today' | 'week' | 'month';

interface CongestionChartProps {
  data: CongestionForecast[];
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  activeTimeFrame: TimeFrame;
}

const CongestionChart: React.FC<CongestionChartProps> = ({ data, onTimeFrameChange, activeTimeFrame }) => {
  // Prepare data for dual-line rendering (historical vs. forecast)
  const chartData = data.map((d, i) => {
    const isLastHistorical = !d.isForecast && (i + 1 === data.length || data[i + 1].isForecast);
    return {
      ...d,
      historical: !d.isForecast ? d.congestion : undefined,
      forecast: d.isForecast || isLastHistorical ? d.congestion : undefined,
    };
  });
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-base font-medium text-secondary-900 mb-4">Daily Congestion Trends</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2F9E44" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2F9E44" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
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
            <Area 
              type="monotone" 
              dataKey="historical"
              stroke="#2F9E44" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCongestion)" 
              connectNulls
            />
            <Area 
              type="monotone" 
              dataKey="forecast"
              stroke="#2F9E44" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorCongestion)" 
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-secondary-600">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-primary-500 mr-1.5"></span>
          <span>Congestion Level</span>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
          {(['today', 'week', 'month'] as TimeFrame[]).map((frame) => (
            <button 
              key={frame}
              onClick={() => onTimeFrameChange(frame)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 ${ 
                activeTimeFrame === frame 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-200'
              }`}>
              {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CongestionChart;