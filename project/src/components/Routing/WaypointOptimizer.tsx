import React, { useState } from 'react';
import { Truck, Plus, Trash2, RefreshCw } from 'lucide-react';
import LocationSearch from '../Search/LocationSearch';
import * as tt from '@tomtom-international/web-sdk-services';

interface WaypointOptimizerProps {
  apiKey: string;
  onRouteOptimized: (route: any) => void;
}

interface Waypoint {
  position: [number, number];
  address: string;
  timeWindows?: {
    start: string;
    end: string;
  }[];
  serviceTime?: number; // in seconds
}

const WaypointOptimizer: React.FC<WaypointOptimizerProps> = ({ apiKey, onRouteOptimized }) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [depot, setDepot] = useState<Waypoint | null>(null);
  const [vehicles, setVehicles] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWaypoint = () => {
    if (waypoints.length < 20) { // TomTom has limits
      setWaypoints([...waypoints, {
        position: [0, 0],
        address: '',
        serviceTime: 300 // 5 minutes default
      }]);
    }
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const updateWaypointTime = (index: number, serviceTime: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = { ...newWaypoints[index], serviceTime };
    setWaypoints(newWaypoints);
  };

  const optimizeRoute = async () => {
    if (!depot || waypoints.length === 0) {
      setError('Please set a depot and add at least one waypoint');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const result = await tt.services.routeOptimization({
        key: apiKey,
        locations: [
          {
            point: {
              latitude: depot.position[1],
              longitude: depot.position[0]
            },
            isDepot: true
          },
          ...waypoints.map(wp => ({
            point: {
              latitude: wp.position[1],
              longitude: wp.position[0]
            },
            serviceTime: wp.serviceTime
          }))
        ],
        options: {
          fleet: {
            vehicles: Array(vehicles).fill({
              profile: 'car',
              maxLocations: 25
            })
          },
          traffic: true
        }
      });

      onRouteOptimized(result);
    } catch (err) {
      console.error('Route optimization error:', err);
      setError('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Route Optimizer</h2>
        <div className="text-sm text-gray-500">
          Optimize delivery routes
        </div>
      </div>

      {/* Depot Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Depot Location</h3>
        </div>
        <LocationSearch
          apiKey={apiKey}
          onLocationSelect={(location) => {
            setDepot({
              position: [location.position.lon, location.position.lat],
              address: location.address.freeformAddress
            });
          }}
        />
      </div>

      {/* Vehicle Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Vehicles
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={vehicles}
          onChange={(e) => setVehicles(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
          className="w-24 px-3 py-2 border rounded-md"
        />
      </div>

      {/* Waypoints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Delivery Points</h3>
          <button
            onClick={addWaypoint}
            disabled={waypoints.length >= 20}
            className="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {waypoints.map((waypoint, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-1">
                <LocationSearch
                  apiKey={apiKey}
                  onLocationSelect={(location) => {
                    const newWaypoints = [...waypoints];
                    newWaypoints[index] = {
                      ...newWaypoints[index],
                      position: [location.position.lon, location.position.lat],
                      address: location.address.freeformAddress
                    };
                    setWaypoints(newWaypoints);
                  }}
                />
              </div>
              <input
                type="number"
                min="0"
                step="60"
                value={waypoint.serviceTime}
                onChange={(e) => updateWaypointTime(index, parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 border rounded-md"
                placeholder="Time (s)"
              />
              <button
                onClick={() => removeWaypoint(index)}
                className="p-2 text-red-500 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        onClick={optimizeRoute}
        disabled={isOptimizing || !depot || waypoints.length === 0}
        className={`mt-6 w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2
          ${isOptimizing || !depot || waypoints.length === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
      >
        <RefreshCw size={18} className={isOptimizing ? 'animate-spin' : ''} />
        <span>{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
      </button>

      {/* Summary */}
      {depot && waypoints.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Truck size={16} />
            <span>{vehicles} vehicle(s)</span>
            <span>•</span>
            <span>{waypoints.length} stops</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaypointOptimizer; 