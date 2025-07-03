import React, { useState, useEffect } from 'react';
import { Battery, MapPin, Search, Filter } from 'lucide-react';
import * as tt from '@tomtom-international/web-sdk-services';
import LocationSearch from '../Search/LocationSearch';

interface ChargingStationsProps {
  apiKey: string;
  onStationSelect: (station: any) => void;
}

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  connectors: {
    type: string;
    power: number;
    available: boolean;
  }[];
  location: {
    lat: number;
    lon: number;
  };
  distance?: number;
}

const ChargingStations: React.FC<ChargingStationsProps> = ({ apiKey, onStationSelect }) => {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [filters, setFilters] = useState({
    minPower: 0,
    availableOnly: false,
    radius: 5000 // 5km
  });

  const fetchChargingStations = async () => {
    if (!selectedLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await tt.services.chargingAvailability({
        key: apiKey,
        center: [selectedLocation.position.lon, selectedLocation.position.lat],
        radius: filters.radius,
        connectorTypes: 'ALL',
        minPowerKW: filters.minPower,
        availableOnly: filters.availableOnly
      });

      setStations(response.results || []);
    } catch (err) {
      console.error('Error fetching charging stations:', err);
      setError('Failed to load charging stations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetchChargingStations();
    }
  }, [selectedLocation, filters]);

  const getConnectorIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ccs': return '🔌';
      case 'chademo': return '⚡';
      case 'type2': return '🔋';
      default: return '🔌';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">EV Charging Stations</h2>

      <div className="space-y-4">
        <LocationSearch
          apiKey={apiKey}
          onLocationSelect={(location) => {
            setSelectedLocation(location);
          }}
        />

        <div className="flex items-center space-x-4 py-2">
          <select
            value={filters.radius}
            onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
          </select>

          <select
            value={filters.minPower}
            onChange={(e) => setFilters({ ...filters, minPower: Number(e.target.value) })}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value={0}>Any power</option>
            <option value={50}>50+ kW</option>
            <option value={150}>150+ kW</option>
          </select>

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
              className="rounded text-primary-600"
            />
            <span>Available only</span>
          </label>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Battery size={24} className="mx-auto mb-2" />
            <p>No charging stations found in this area</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => onStationSelect(station)}
                className="w-full text-left bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <Battery
                    size={20}
                    className={station.connectors.some(c => c.available)
                      ? 'text-green-500'
                      : 'text-gray-400'
                    }
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{station.name}</h4>
                    <p className="text-sm text-gray-600">{station.address}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {station.connectors.map((connector, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs
                            ${connector.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {getConnectorIcon(connector.type)}
                          {connector.type} • {connector.power}kW
                        </span>
                      ))}
                    </div>

                    {station.distance && (
                      <div className="mt-2 text-sm text-gray-500">
                        {(station.distance / 1000).toFixed(1)} km away
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargingStations; 