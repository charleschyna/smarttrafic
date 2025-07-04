import React, { useState } from 'react';
import { Navigation, Plus, X, RotateCcw } from 'lucide-react';
import LocationSearch from '../Search/LocationSearch';
import { getDirections } from '../../services/routingService';

interface RoutePlannerProps {
  onRouteCalculated: (route: any) => void;
}

interface Waypoint {
  position: { lat: number; lng: number };
  address: string;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ onRouteCalculated }) => {
  const [startPoint, setStartPoint] = useState<Waypoint | null>(null);
  const [endPoint, setEndPoint] = useState<Waypoint | null>(null);
  const [viaPoints, setViaPoints] = useState<Waypoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = async () => {
    if (!startPoint || !endPoint) {
      setError('Please select both start and end points');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const locations = [
        startPoint.position,
        ...viaPoints.map(point => point.position),
        endPoint.position
      ].filter(p => p.lat !== 0 && p.lng !== 0); // Filter out unassigned via points

      if (locations.length < 2) {
        setError('Please set valid start and end points.');
        setIsCalculating(false);
        return;
      }

      const waypoints = locations.map(pos => ({ 
        latitude: pos.lat, 
        longitude: pos.lng 
      }));

      // TODO: The original implementation used `computeBestOrder: true`.
      // The standard Mapbox Directions API does not optimize waypoint order.
      // To add this feature, we would need to use the Mapbox Optimization API.
      const result = await getDirections(waypoints);

      onRouteCalculated(result);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate route. Please try again.');
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const addViaPoint = () => {
    if (viaPoints.length < 5) {
      // Initialize with a placeholder that can be identified and filtered out if not set
      setViaPoints([...viaPoints, { position: { lat: 0, lng: 0 }, address: '' }]);
    }
  };

  const removeViaPoint = (index: number) => {
    setViaPoints(viaPoints.filter((_, i) => i !== index));
  };

  const resetRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setViaPoints([]);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Route Planner</h2>
        <button
          onClick={resetRoute}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <LocationSearch
            onLocationSelect={(location) => {
              setStartPoint({
                position: location.position,
                address: location.address.freeformAddress
              });
            }}
          />
        </div>

        {viaPoints.map((_, index) => (
          <div key={index} className="relative flex items-center space-x-2">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <LocationSearch
              onLocationSelect={(location) => {
                const newViaPoints = [...viaPoints];
                newViaPoints[index] = {
                  position: location.position,
                  address: location.address.freeformAddress
                };
                setViaPoints(newViaPoints);
              }}
            />
            <button
              onClick={() => removeViaPoint(index)}
              className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        ))}

        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <LocationSearch
            onLocationSelect={(location) => {
              setEndPoint({
                position: location.position,
                address: location.address.freeformAddress
              });
            }}
          />
        </div>

        {viaPoints.length < 5 && (
          <button
            onClick={addViaPoint}
            className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus size={16} />
            <span>Add stop</span>
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 mt-2">
          {error}
        </div>
      )}

      <button
        onClick={calculateRoute}
        disabled={isCalculating || !startPoint || !endPoint}
        className={`w-full mt-4 px-4 py-2 rounded-lg flex items-center justify-center space-x-2
          ${isCalculating || !startPoint || !endPoint
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
      >
        <Navigation size={18} />
        <span>{isCalculating ? 'Calculating...' : 'Calculate Route'}</span>
      </button>
    </div>
  );
};

export default RoutePlanner; 