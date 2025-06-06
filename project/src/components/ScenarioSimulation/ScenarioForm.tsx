import React, { useState } from 'react';
import { Calendar, Clock, Map, AlertTriangle } from 'lucide-react';

const ScenarioForm: React.FC = () => {
  const [scenarioType, setScenarioType] = useState('closure');
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="text-lg font-medium text-secondary-900 mb-4">Create Scenario</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Scenario Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              className={`py-2 px-3 rounded-lg border ${
                scenarioType === 'closure' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setScenarioType('closure')}
            >
              <div className="flex flex-col items-center">
                <AlertTriangle size={18} />
                <span className="text-xs mt-1">Road Closure</span>
              </div>
            </button>
            <button
              className={`py-2 px-3 rounded-lg border ${
                scenarioType === 'event' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setScenarioType('event')}
            >
              <div className="flex flex-col items-center">
                <Calendar size={18} />
                <span className="text-xs mt-1">Major Event</span>
              </div>
            </button>
            <button
              className={`py-2 px-3 rounded-lg border ${
                scenarioType === 'signal' 
                  ? 'bg-primary-50 border-primary-500 text-primary-700' 
                  : 'border-gray-200 text-secondary-600 hover:bg-gray-50'
              }`}
              onClick={() => setScenarioType('signal')}
            >
              <div className="flex flex-col items-center">
                <Clock size={18} />
                <span className="text-xs mt-1">Signal Change</span>
              </div>
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Location</label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Map size={18} className="text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search for location"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button className="bg-gray-100 p-2.5 rounded-lg border border-gray-200 text-secondary-700 hover:bg-gray-200">
              <Map size={18} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={18} className="text-secondary-400" />
              </div>
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">End Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={18} className="text-secondary-400" />
              </div>
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Time Period</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock size={18} className="text-secondary-400" />
              </div>
              <input
                type="time"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock size={18} className="text-secondary-400" />
              </div>
              <input
                type="time"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
          <textarea
            placeholder="Describe the scenario details..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          ></textarea>
        </div>
        
        <div className="pt-2">
          <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
            Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioForm;