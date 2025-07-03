import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import * as tt from '@tomtom-international/web-sdk-services';

interface LocationSearchProps {
  onLocationSelect: (location: any) => void;
  apiKey: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, apiKey }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await tt.services.fuzzySearch({
        key: apiKey,
        query: searchQuery,
        language: 'en-GB',
        limit: 5,
        countrySet: 'KE'
      });
      setResults(response.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Search locations..."
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                onLocationSelect(result);
                setQuery(result.address.freeformAddress);
                setResults([]);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
            >
              <MapPin size={16} className="text-gray-400" />
              <div>
                <div className="text-sm font-medium">{result.address.freeformAddress}</div>
                <div className="text-xs text-gray-500">{result.address.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch; 