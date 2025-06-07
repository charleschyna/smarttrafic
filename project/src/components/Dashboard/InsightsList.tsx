import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, MapPin, Search, RefreshCw } from 'lucide-react';
import { generateTrafficInsights } from '../../AI/services';
import type { TrafficInsight } from '../../AI/types';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface Insight extends TrafficInsight {
  id: string;
  timestamp: string;
}

const InsightsList: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState(5); // in kilometers
  const [searchAddress, setSearchAddress] = useState('');
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Get user's current location
  const detectUserLocation = () => {
    setIsAutoDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address: data.display_name
            });
            setSearchAddress(data.display_name);
          } catch (err) {
            console.error('Error getting address:', err);
            setUserLocation({ lat: latitude, lng: longitude });
          }
          setIsAutoDetecting(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to detect location. Please enter manually.');
          setIsAutoDetecting(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setIsAutoDetecting(false);
    }
  };

  // Generate insights using the AI service
  const generateInsights = async () => {
    if (!userLocation) {
      setError('Please set a location first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await generateTrafficInsights(userLocation, searchRadius);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate insights');
      }

      // Format insights with additional metadata
      const formattedInsights = response.data.map((insight: TrafficInsight): Insight => ({
        ...insight,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleString()
      }));

      setInsights(formattedInsights);
    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle address search
  const handleAddressSearch = async () => {
    if (!searchAddress) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        setUserLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        });
      } else {
        setError('Location not found. Please try a different address.');
      }
    } catch (err) {
      console.error('Error searching address:', err);
      setError('Failed to search address. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Location and Radius Controls */}
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter location or address"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button
            onClick={handleAddressSearch}
            className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Search size={18} />
          </button>
          <button
            onClick={detectUserLocation}
            disabled={isAutoDetecting}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isAutoDetecting ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <MapPin size={18} />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">Search Radius:</label>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={1}>1 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
          <button
            onClick={generateInsights}
            disabled={isLoading || !userLocation}
            className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Get Live Insights</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {userLocation && (
          <div className="text-sm text-gray-600">
            Selected Location: {userLocation.address || `${userLocation.lat}, ${userLocation.lng}`}
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {insights.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating insights...</span>
              </div>
            ) : (
              'No insights available. Set a location and click "Get Live Insights" to start.'
            )}
          </div>
        ) : (
          insights.map((insight) => (
          <div 
            key={insight.id} 
            className="px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {getSeverityIcon(insight.severity)}
              </div>
                <div className="flex-1">
                <p className="text-sm text-secondary-800">{insight.message}</p>
                  {insight.details && (
                    <p className="text-xs text-gray-600 mt-1">{insight.details}</p>
                  )}
                  {insight.location && (
                    <p className="text-xs text-gray-500 mt-1">
                      Location: {insight.location.address || `${insight.location.lat}, ${insight.location.lng}`}
                    </p>
                  )}
                <p className="text-xs text-secondary-500 mt-1">{insight.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to get severity icon
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <AlertCircle size={16} className="text-accent-500" />;
    case 'warning':
      return <AlertTriangle size={16} className="text-warning-500" />;
    case 'info':
    default:
      return <Info size={16} className="text-primary-500" />;
  }
};

export default InsightsList;