import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { City } from '../../data/cities';

interface FilterBarProps {
  cities: City[];
  selectedCity: City;
  onCityChange: (city: City) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ cities, selectedCity, onCityChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center">
        <Filter size={18} className="text-secondary-500 mr-2" />
        <h3 className="text-sm font-medium text-secondary-900">Filters</h3>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative">
          <select 
            className="appearance-none bg-gray-50 border border-gray-200 text-secondary-800 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={selectedCity.name}
            onChange={(e) => {
              const city = cities.find(c => c.name === e.target.value);
              if (city) {
                onCityChange(city);
              }
            }}
          >
            {cities.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-500 pointer-events-none" />
        </div>
        
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-secondary-800 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option>Morning (6AM-12PM)</option>
            <option>Afternoon (12PM-5PM)</option>
            <option>Evening (5PM-8PM)</option>
            <option>Night (8PM-6AM)</option>
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-500 pointer-events-none" />
        </div>
        
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-secondary-800 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option>All Vehicles</option>
            <option>Private Cars</option>
            <option>Public Transport</option>
            <option>Commercial</option>
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-500 pointer-events-none" />
        </div>
        
        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 ml-1">
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterBar;