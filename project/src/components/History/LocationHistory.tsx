import React, { useState, useEffect } from 'react';
import { History, MapPin, Calendar, Clock, Trash2 } from 'lucide-react';
import * as tt from '@tomtom-international/web-sdk-services';

interface LocationHistoryProps {
  apiKey: string;
  onHistoryUpdate?: (history: LocationRecord[]) => void;
}

interface LocationRecord {
  id: string;
  timestamp: Date;
  position: [number, number];
  address?: string;
  accuracy?: number;
}

const LocationHistory: React.FC<LocationHistoryProps> = ({ apiKey, onHistoryUpdate }) => {
  const [history, setHistory] = useState<LocationRecord[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  useEffect(() => {
    let watchId: number;
    
    const startTracking = () => {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              const response = await tt.services.reverseGeocode({
                key: apiKey,
                position: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }
              });

              const address = response.addresses[0]?.address?.freeformAddress;
              
              const newRecord: LocationRecord = {
                id: `loc-${Date.now()}`,
                timestamp: new Date(),
                position: [position.coords.longitude, position.coords.latitude],
                address,
                accuracy: position.coords.accuracy
              };

              setHistory(prev => {
                const updated = [...prev, newRecord];
                onHistoryUpdate?.(updated);
                return updated;
              });
            } catch (err) {
              console.error('Reverse geocoding error:', err);
            }
          },
          (err) => {
            setError(`Location tracking error: ${err.message}`);
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setIsTracking(false);
      }
    };

    if (isTracking) {
      startTracking();
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, apiKey, onHistoryUpdate]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
    onHistoryUpdate?.([]);
  };

  const filteredHistory = dateFilter
    ? history.filter(record => 
        record.timestamp.toDateString() === dateFilter.toDateString())
    : history;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Location History</h2>
        <button
          onClick={toggleTracking}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2
            ${isTracking
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
        >
          <History size={18} className={isTracking ? 'animate-pulse' : ''} />
          <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Date
        </label>
        <input
          type="date"
          onChange={(e) => setDateFilter(e.target.value ? new Date(e.target.value) : null)}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No location history available
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {filteredHistory.length} location{filteredHistory.length !== 1 ? 's' : ''} recorded
              </div>
              <button
                onClick={clearHistory}
                className="text-red-500 hover:text-red-600 flex items-center space-x-1"
              >
                <Trash2 size={14} />
                <span>Clear History</span>
              </button>
            </div>
            <div className="space-y-2">
              {filteredHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <MapPin className="text-primary-600 mt-1" size={16} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {record.address || 'Unknown Location'}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span>
                          {record.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={14} />
                        <span>
                          {record.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {record.accuracy && (
                        <div className="text-xs text-gray-400">
                          Accuracy: ±{Math.round(record.accuracy)}m
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationHistory; 