import React, { useState } from 'react';
import { MapPin, Square, Circle, Hexagon, Plus, Trash2 } from 'lucide-react';
import LocationSearch from '../Search/LocationSearch';
import * as tt from '@tomtom-international/web-sdk-services';

interface GeofenceManagerProps {
  apiKey: string;
  onGeofenceCreated: (geofence: Geofence) => void;
}

interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: [number, number][];
  radius?: number;
}

const GeofenceManager: React.FC<GeofenceManagerProps> = ({ apiKey, onGeofenceCreated }) => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [currentGeofence, setCurrentGeofence] = useState<{
    name?: string;
    type: 'circle' | 'polygon';
    coordinates: [number, number][];
    radius?: number;
  }>({
    type: 'circle',
    coordinates: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPoint = (location: any) => {
    const newCoordinates = [...currentGeofence.coordinates, [
      location.position.lon,
      location.position.lat
    ] as [number, number]];

    setCurrentGeofence({
      ...currentGeofence,
      coordinates: newCoordinates
    });
  };

  const createGeofence = async () => {
    if (!currentGeofence.name || currentGeofence.coordinates.length === 0) {
      setError('Please provide a name and at least one point');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const id = `geofence-${Date.now()}`;
      const newGeofence: Geofence = {
        id,
        name: currentGeofence.name,
        type: currentGeofence.type,
        coordinates: currentGeofence.coordinates,
        radius: currentGeofence.radius
      };

      setGeofences([...geofences, newGeofence]);
      onGeofenceCreated(newGeofence);
      
      setCurrentGeofence({
        type: 'circle',
        coordinates: []
      });
    } catch (err) {
      console.error('Geofence creation error:', err);
      setError('Failed to create geofence');
    } finally {
      setIsCreating(false);
    }
  };

  const removeGeofence = (id: string) => {
    setGeofences(geofences.filter(g => g.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Geofence Manager</h2>
        <div className="text-sm text-gray-500">
          Create and manage virtual boundaries
        </div>
      </div>

      {/* Create New Geofence */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Geofence Name
          </label>
          <input
            type="text"
            value={currentGeofence.name || ''}
            onChange={(e) => setCurrentGeofence({ ...currentGeofence, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter geofence name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentGeofence({ ...currentGeofence, type: 'circle' })}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md
                ${currentGeofence.type === 'circle'
                  ? 'bg-primary-50 text-primary-600 border-primary-200'
                  : 'bg-white border-gray-200'
                } border`}
            >
              <Circle size={16} />
              <span>Circle</span>
            </button>
            <button
              onClick={() => setCurrentGeofence({ ...currentGeofence, type: 'polygon' })}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md
                ${currentGeofence.type === 'polygon'
                  ? 'bg-primary-50 text-primary-600 border-primary-200'
                  : 'bg-white border-gray-200'
                } border`}
            >
              <Hexagon size={16} />
              <span>Polygon</span>
            </button>
          </div>
        </div>

        {currentGeofence.type === 'circle' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius (meters)
            </label>
            <input
              type="number"
              value={currentGeofence.radius || 100}
              onChange={(e) => setCurrentGeofence({ ...currentGeofence, radius: Number(e.target.value) })}
              className="w-32 px-3 py-2 border rounded-md"
              min="1"
              max="10000"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Points
          </label>
          <LocationSearch
            apiKey={apiKey}
            onLocationSelect={addPoint}
          />
        </div>

        {currentGeofence.coordinates.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Added Points</h4>
            <div className="space-y-2">
              {currentGeofence.coordinates.map((coord, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <span>Point {index + 1}: [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]</span>
                  <button
                    onClick={() => {
                      const newCoords = [...currentGeofence.coordinates];
                      newCoords.splice(index, 1);
                      setCurrentGeofence({ ...currentGeofence, coordinates: newCoords });
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={createGeofence}
          disabled={isCreating || !currentGeofence.name || currentGeofence.coordinates.length === 0}
          className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2
            ${isCreating || !currentGeofence.name || currentGeofence.coordinates.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
        >
          <Plus size={18} />
          <span>{isCreating ? 'Creating...' : 'Create Geofence'}</span>
        </button>
      </div>

      {/* Existing Geofences */}
      {geofences.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Geofences</h3>
          <div className="space-y-3">
            {geofences.map((geofence) => (
              <div
                key={geofence.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {geofence.type === 'circle' ? <Circle size={16} /> : <Hexagon size={16} />}
                  <div>
                    <div className="font-medium text-gray-900">{geofence.name}</div>
                    <div className="text-sm text-gray-500">
                      {geofence.type === 'circle'
                        ? `Radius: ${geofence.radius}m`
                        : `${geofence.coordinates.length} points`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeGeofence(geofence.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofenceManager; 