import React, { useState, useEffect, useRef } from 'react';
import { getGeocode } from '../../services/routingService';

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Interface for Mapbox API geocoding results (features)
interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

interface LocationInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onLocationSelect: (coords: [number, number] | null) => void;
  placeholder: string;
  Icon: React.ElementType;
}

const LocationInput: React.FC<LocationInputProps> = ({ value, onValueChange, onLocationSelect, placeholder, Icon }) => {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(value, 300);

  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      const fetchSuggestions = async () => {
        try {
          const data = await getGeocode(debouncedSearchTerm);
          if (data && data.features) {
            setSuggestions(data.features);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error('Error fetching geocode suggestions:', error);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);

  // Handle clicks outside the component to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => setIsActive(true)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        placeholder={placeholder}
      />
      {isActive && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onValueChange(suggestion.place_name);
                  onLocationSelect(suggestion.center as [number, number]);
                  setSuggestions([]);
                  setIsActive(false);
                }}
              >
                {suggestion.place_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationInput;
