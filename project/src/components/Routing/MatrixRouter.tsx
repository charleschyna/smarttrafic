import React, { useState } from 'react';
import { Grid, Plus, Trash2, Calculator } from 'lucide-react';
import LocationSearch from '../Search/LocationSearch';
import * as tt from '@tomtom-international/web-sdk-services';

interface MatrixRouterProps {
  apiKey: string;
  onMatrixCalculated: (matrix: any) => void;
}

interface Location {
  position: [number, number];
  address: string;
}

const MatrixRouter: React.FC<MatrixRouterProps> = ({ apiKey, onMatrixCalculated }) => {
  const [origins, setOrigins] = useState<Location[]>([]);
  const [destinations, setDestinations] = useState<Location[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrigin = () => {
    if (origins.length < 5) { // TomTom has limits on matrix size
      setOrigins([...origins, { position: [0, 0], address: '' }]);
    }
  };

  const addDestination = () => {
    if (destinations.length < 5) {
      setDestinations([...destinations, { position: [0, 0], address: '' }]);
    }
  };

  const removeOrigin = (index: number) => {
    setOrigins(origins.filter((_, i) => i !== index));
  };

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const calculateMatrix = async () => {
    if (origins.length === 0 || destinations.length === 0) {
      setError('Please add at least one origin and destination');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const result = await tt.services.matrixRouting({
        key: apiKey,
        origins: origins.map(o => ({ 
          latitude: o.position[1], 
          longitude: o.position[0] 
        })),
        destinations: destinations.map(d => ({ 
          latitude: d.position[1], 
          longitude: d.position[0] 
        })),
        traffic: true
      });

      onMatrixCalculated(result);
    } catch (err) {
      console.error('Matrix calculation error:', err);
      setError('Failed to calculate route matrix');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Route Matrix</h2>
        <div className="text-sm text-gray-500">
          Calculate multiple routes at once
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Origins Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Origins</h3>
            <button
              onClick={addOrigin}
              disabled={origins.length >= 5}
              className="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {origins.map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <LocationSearch
                  apiKey={apiKey}
                  onLocationSelect={(location) => {
                    const newOrigins = [...origins];
                    newOrigins[index] = {
                      position: [location.position.lon, location.position.lat],
                      address: location.address.freeformAddress
                    };
                    setOrigins(newOrigins);
                  }}
                />
                <button
                  onClick={() => removeOrigin(index)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Destinations Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Destinations</h3>
            <button
              onClick={addDestination}
              disabled={destinations.length >= 5}
              className="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {destinations.map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <LocationSearch
                  apiKey={apiKey}
                  onLocationSelect={(location) => {
                    const newDestinations = [...destinations];
                    newDestinations[index] = {
                      position: [location.position.lon, location.position.lat],
                      address: location.address.freeformAddress
                    };
                    setDestinations(newDestinations);
                  }}
                />
                <button
                  onClick={() => removeDestination(index)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        onClick={calculateMatrix}
        disabled={isCalculating || origins.length === 0 || destinations.length === 0}
        className={`mt-6 w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2
          ${isCalculating || origins.length === 0 || destinations.length === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
      >
        <Calculator size={18} />
        <span>{isCalculating ? 'Calculating...' : 'Calculate Matrix'}</span>
      </button>

      {/* Matrix Results Preview */}
      {origins.length > 0 && destinations.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-50"></th>
                {destinations.map((dest, i) => (
                  <th key={i} className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-500">
                    {dest.address.split(',')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {origins.map((origin, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-500">
                    {origin.address.split(',')[0]}
                  </td>
                  {destinations.map((_, j) => (
                    <td key={j} className="px-4 py-2 text-center text-sm text-gray-500">
                      --
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MatrixRouter; 