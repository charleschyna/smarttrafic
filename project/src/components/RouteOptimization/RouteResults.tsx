import React from 'react';
import { Clock, ArrowRight, Navigation, AlertTriangle } from 'lucide-react';
import { RouteData } from '../../types';

interface RouteResultsProps {
  route: RouteData;
  alternativeRoutes?: RouteData[];
}

const RouteResults: React.FC<RouteResultsProps> = ({ route, alternativeRoutes }) => {
  const getCongestionColor = (level: number) => {
    if (level < 40) return 'bg-success-500';
    if (level < 70) return 'bg-warning-500';
    return 'bg-accent-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-secondary-900">Route Details</h3>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-secondary-700">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mr-2"></div>
            <span className="font-medium">{route.origin}</span>
          </div>
          <ArrowRight size={16} className="text-secondary-400" />
          <div className="flex items-center text-secondary-700">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-500 mr-2"></div>
            <span className="font-medium">{route.destination}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center">
            <Navigation size={16} className="text-secondary-500 mr-2" />
            <span className="text-secondary-900">{route.distance}</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="text-secondary-500 mr-2" />
            <span className="text-secondary-900">{route.duration}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${getCongestionColor(route.congestionLevel)} mr-2`}></div>
            <span className="text-secondary-900">{route.congestionLevel}% Congestion</span>
          </div>
        </div>
        
        {/* Map visualization placeholder - would be a real map in production */}
        <div className="h-48 bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
          <div style={{ 
            backgroundImage: `url(https://images.pexels.com/photos/417023/pexels-photo-417023.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100%',
            opacity: 0.7
          }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-[80%] h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
        
        {/* Traffic alerts */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4">
          <div className="flex">
            <AlertTriangle size={18} className="text-warning-500 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-secondary-800">Construction on Ngong Road may cause delays of 10-15 minutes.</p>
            </div>
          </div>
        </div>
      </div>
      
      {alternativeRoutes && alternativeRoutes.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="text-sm font-medium text-secondary-900 mb-3">Alternative Routes</h4>
          <div className="space-y-3">
            {alternativeRoutes.map((altRoute) => (
              <div key={altRoute.id} className="p-3 border border-gray-100 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-secondary-800">
                    {altRoute.origin} to {altRoute.destination}
                  </span>
                  <span className="text-xs text-secondary-500">{altRoute.distance}</span>
                </div>
                <div className="flex items-center text-xs text-secondary-600">
                  <Clock size={14} className="mr-1" />
                  <span>{altRoute.duration}</span>
                  <div className={`ml-3 w-2 h-2 rounded-full ${getCongestionColor(altRoute.congestionLevel)}`}></div>
                  <span className="ml-1">{altRoute.congestionLevel}% Congestion</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteResults;