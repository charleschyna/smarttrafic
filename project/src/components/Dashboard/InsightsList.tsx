import React, { useState } from 'react';
import { MapPin, Search, RefreshCw, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { db } from '../../db';
import { generateTrafficInsights } from '../../AI/services';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

const InsightsList: React.FC = () => {
  // State now holds the string summary
  const [trafficSummary, setTrafficSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const searchRadius = 5; // Radius is fixed at 5km as there's no UI to change it.
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
            const address = data.display_name || 'Current Location';
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address: address
            });
            setSearchAddress(address);
          } catch (err) {
            console.error('Error getting address:', err);
            setUserLocation({ lat: latitude, lng: longitude, address: 'Current Location' });
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
    setTrafficSummary(null); // Clear previous summary

    try {
      const response = await generateTrafficInsights(userLocation, searchRadius);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate insights');
      }
      
      // The data is now a string
      setTrafficSummary(response.data);

      // Save the report to the database
      await db.reports.add({
        content: response.data,
        location: userLocation,
        createdAt: new Date(),
      });

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
            {isAutoDetecting ? <RefreshCw size={18} className="animate-spin" /> : <MapPin size={18} />}
          </button>
        </div>
        <div className="flex items-center">
            <button
              onClick={generateInsights}
              disabled={isLoading || !userLocation}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Generate Traffic Report</span>
                </>
              )}
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {isLoading && (
          <div className="text-center">
            <p className="text-gray-500">Generating traffic report...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">Error Generating Report</p>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {!isLoading && !error && !trafficSummary && (
          <div className="text-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 font-semibold">Ready to Start</p>
            <p className="text-blue-600 mt-2">Set a location and click "Generate Traffic Report" to get a detailed summary.</p>
          </div>
        )}

        {trafficSummary && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Live Traffic Report</h2>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{trafficSummary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsList;