import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import * as tt from '@tomtom-international/web-sdk-services';

interface TrafficFlowProps {
  apiKey: string;
  center: [number, number];
  radius?: number;
  onFlowDataUpdate?: (data: TrafficFlowData[]) => void;
}

interface TrafficFlowData {
  id: string;
  roadName: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  confidence: number;
  coordinates: [number, number][];
  timestamp: Date;
}

const TrafficFlow: React.FC<TrafficFlowProps> = ({ 
  apiKey, 
  center, 
  radius = 1000, // Default 1km radius
  onFlowDataUpdate 
}) => {
  const [flowData, setFlowData] = useState<TrafficFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTrafficFlow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tt.services.flowSegmentData({
        key: apiKey,
        point: {
          latitude: center[1],
          longitude: center[0]
        },
        radius,
        unit: 'kilometers',
        style: 'relative' // Compare current vs free-flow speeds
      });

      const processedData: TrafficFlowData[] = response.flowSegmentData.map((segment: any) => ({
        id: `flow-${segment.id || Date.now()}`,
        roadName: segment.roadName || 'Unknown Road',
        currentSpeed: segment.currentSpeed,
        freeFlowSpeed: segment.freeFlowSpeed,
        confidence: segment.confidence,
        coordinates: segment.coordinates.map((coord: any) => [coord.longitude, coord.latitude]),
        timestamp: new Date()
      }));

      setFlowData(processedData);
      setLastUpdate(new Date());
      onFlowDataUpdate?.(processedData);
    } catch (err) {
      console.error('Traffic flow fetch error:', err);
      setError('Failed to fetch traffic flow data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficFlow();
    
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchTrafficFlow, 300000); // Refresh every 5 minutes
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [center, radius, autoRefresh]);

  const getSpeedRatio = (current: number, freeFlow: number) => {
    const ratio = current / freeFlow;
    if (ratio >= 0.9) return 'text-green-500';
    if (ratio >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Traffic Flow</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-sm flex items-center space-x-1
              ${autoRefresh ? 'text-primary-600' : 'text-gray-400'}`}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
            <span>Auto-refresh</span>
          </button>
          <button
            onClick={fetchTrafficFlow}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center space-x-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {lastUpdate && (
        <div className="text-sm text-gray-500 mb-4 flex items-center space-x-2">
          <Clock size={14} />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}

      <div className="space-y-4">
        {flowData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isLoading ? 'Loading traffic data...' : 'No traffic flow data available'}
          </div>
        ) : (
          <div className="grid gap-4">
            {flowData.map((segment) => (
              <div
                key={segment.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{segment.roadName}</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Current Speed</div>
                        <div className={`text-lg font-medium ${getSpeedRatio(
                          segment.currentSpeed,
                          segment.freeFlowSpeed
                        )}`}>
                          {Math.round(segment.currentSpeed)} km/h
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Normal Speed</div>
                        <div className="text-lg font-medium text-gray-700">
                          {Math.round(segment.freeFlowSpeed)} km/h
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity size={18} className={getSpeedRatio(
                      segment.currentSpeed,
                      segment.freeFlowSpeed
                    )} />
                    <span className="text-sm text-gray-500">
                      {Math.round(segment.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficFlow; 