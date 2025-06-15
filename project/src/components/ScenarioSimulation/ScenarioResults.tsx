import React from 'react';
import { ArrowRight, ArrowDown, ArrowUp, AlertTriangle, ThumbsUp } from 'lucide-react';

const ScenarioResults: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-secondary-900">Simulation Results</h3>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 rounded-full bg-accent-100 text-accent-500">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="font-medium text-secondary-900">Road Closure: Ngong Road</h4>
            <p className="text-sm text-secondary-600">Jun 15, 2025 - Jun 20, 2025</p>
          </div>
        </div>
        
        {/* Map visualization placeholder - would be a real map in production */}
        <div className="h-48 bg-gray-100 rounded-lg overflow-hidden mb-6 relative">
          <div style={{ 
            backgroundImage: `url(https://images.pexels.com/photos/417023/pexels-photo-417023.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100%',
            opacity: 0.7
          }}></div>
          
          {/* Overlay showing impact zones */}
          <div className="absolute top-1/3 left-1/3 right-1/3 bottom-1/3 bg-accent-500/40 rounded-full animate-pulse"></div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-500 flex items-center justify-center mr-3">
                <ArrowUp size={16} />
              </div>
              <span className="font-medium text-secondary-800">Average Travel Time</span>
            </div>
            <div className="flex items-center">
              <span className="text-warning-500 font-medium">+15 min</span>
              <ArrowUp size={16} className="ml-1 text-warning-500" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-500 flex items-center justify-center mr-3">
                <ArrowUp size={16} />
              </div>
              <span className="font-medium text-secondary-800">Congestion Level</span>
            </div>
            <div className="flex items-center">
              <span className="text-accent-500 font-medium">+35%</span>
              <ArrowUp size={16} className="ml-1 text-accent-500" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-500 flex items-center justify-center mr-3">
                <ArrowUp size={16} />
              </div>
              <span className="font-medium text-secondary-800">Affected Areas</span>
            </div>
            <div>
              <span className="text-secondary-800 font-medium">CBD, Westlands, Kilimani</span>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <ThumbsUp size={18} className="text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-secondary-900 mb-1">AI Recommendations</h4>
              <ul className="space-y-2 text-sm text-secondary-800">
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2 mt-1 text-primary-500" />
                  <span>Re-route traffic through Mbagathi Way and Langata Road</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2 mt-1 text-primary-500" />
                  <span>Increase bus frequency on alternate routes by 30%</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2 mt-1 text-primary-500" />
                  <span>Adjust signal timing at Valley Road and Forest Road intersections</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 p-4 flex justify-end">
        <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          Apply Recommendations
        </button>
      </div>
    </div>
  );
};

export default ScenarioResults;