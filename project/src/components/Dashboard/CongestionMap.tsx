import React, { useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, Layers } from 'lucide-react';

const CongestionMap: React.FC = () => {
  const [mapView, setMapView] = useState('traffic');

  // This would be replaced with a real map component in production
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[400px] relative">
      <div className="absolute top-3 left-3 z-10 bg-white rounded-md shadow-sm p-1.5">
        <div className="flex space-x-1">
          <button 
            className={`p-1.5 rounded-md ${mapView === 'traffic' ? 'bg-primary-50 text-primary-500' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setMapView('traffic')}
          >
            <MapPin size={18} />
          </button>
          <button 
            className={`p-1.5 rounded-md ${mapView === 'satellite' ? 'bg-primary-50 text-primary-500' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setMapView('satellite')}
          >
            <Layers size={18} />
          </button>
        </div>
      </div>
      
      <div className="absolute top-3 right-3 z-10 bg-white rounded-md shadow-sm p-1.5">
        <div className="flex flex-col space-y-1">
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
            <ZoomIn size={18} />
          </button>
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
            <ZoomOut size={18} />
          </button>
        </div>
      </div>
      
      {/* Placeholder for the map - in a real app this would use a mapping library */}
      <div className="w-full h-full bg-[#f2f6fa] flex items-center justify-center relative">
        <div className="absolute inset-0 w-full h-full" style={{ 
          backgroundImage: `url(https://images.pexels.com/photos/417023/pexels-photo-417023.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.8
        }}></div>
        
        {/* Overlay showing congestion levels */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/30 to-transparent pointer-events-none"></div>
        
        {/* Map pins */}
        <div className="absolute top-1/4 left-1/3 z-10">
          <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse-slow">
            <MapPin size={18} />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 z-10">
          <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <MapPin size={18} />
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/4 z-10">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <MapPin size={18} />
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-sm z-10">
          <h4 className="text-xs font-medium mb-2 text-secondary-900">Congestion Level</h4>
          <div className="flex items-center space-x-2">
            <span className="block w-3 h-3 rounded-full bg-primary-500"></span>
            <span className="text-xs text-secondary-700">Low</span>
            
            <span className="block w-3 h-3 rounded-full bg-warning-500 ml-2"></span>
            <span className="text-xs text-secondary-700">Medium</span>
            
            <span className="block w-3 h-3 rounded-full bg-accent-500 ml-2"></span>
            <span className="text-xs text-secondary-700">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CongestionMap;