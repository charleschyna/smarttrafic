import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Info } from 'lucide-react';
import * as tt from '@tomtom-international/web-sdk-services';

interface TrafficIncidentsProps {
  apiKey: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface Incident {
  id: string;
  type: string;
  severity: number;
  description: string;
  startTime: string;
  endTime?: string;
  location: {
    lat: number;
    lon: number;
  };
}

const TrafficIncidents: React.FC<TrafficIncidentsProps> = ({ apiKey, bounds }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tt.services.incidentDetails({
        key: apiKey,
        bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
        fields: 'incidentDetails,geometry',
        language: 'en-GB'
      });

      if (response.incidents) {
        setIncidents(response.incidents);
      }
    } catch (err) {
      console.error('Error fetching traffic incidents:', err);
      setError('Failed to load traffic incidents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [bounds]);

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-red-500';
      case 4: return 'text-red-700';
      default: return 'text-gray-500';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center space-x-2">
        <AlertTriangle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Traffic Incidents</h3>
        <button
          onClick={fetchIncidents}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Info size={24} className="mx-auto mb-2" />
          <p>No traffic incidents reported in this area</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle
                  size={20}
                  className={getSeverityColor(incident.severity)}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {incident.type}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {incident.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>
                        {formatTime(incident.startTime)}
                        {incident.endTime ? ` - ${formatTime(incident.endTime)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrafficIncidents; 