import React, { useState } from 'react';
import { Search, Car, Truck, Bus, Bike } from 'lucide-react';

const RouteForm: React.FC = () => {
  const [vehicleType, setVehicleType] = useState('car');

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="text-lg font-medium text-secondary-900 mb-4">Find Optimal Route</h3>
      
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-secondary-400" />
          </div>
          <input
            type="text"
            placeholder="Starting point"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-secondary-400" />
          </div>
          <input
            type="text"
            placeholder="Destination"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Vehicle Type</label>
          <div className="flex space-x-2">
            <button
              className={`flex-1 py-2 px-3 rounded-lg border ${
                vehicleType === 'car' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setVehicleType('car')}
            >
              <div className="flex flex-col items-center">
                <Car size={18} />
                <span className="text-xs mt-1">Car</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg border ${
                vehicleType === 'bus' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setVehicleType('bus')}
            >
              <div className="flex flex-col items-center">
                <Bus size={18} />
                <span className="text-xs mt-1">Bus</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg border ${
                vehicleType === 'truck' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setVehicleType('truck')}
            >
              <div className="flex flex-col items-center">
                <Truck size={18} />
                <span className="text-xs mt-1">Truck</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg border ${
                vehicleType === 'bike' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setVehicleType('bike')}
            >
              <div className="flex flex-col items-center">
                <Bike size={18} />
                <span className="text-xs mt-1">Bike</span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="pt-2">
          <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
            Find Optimal Route
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteForm;