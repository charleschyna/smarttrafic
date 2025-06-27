import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Route, 
  LineChart, 
  GitCompare, 
  FileBarChart, 
  Settings, 
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navItems = [
    { id: 'dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Overview' },
    { id: 'route', path: '/route-optimization', icon: <Route size={20} />, label: 'Route Optimization' },
    { id: 'analytics', path: '/predictive-analytics', icon: <LineChart size={20} />, label: 'Predictive Analytics' },
    { id: 'simulation', path: '/scenario-simulation', icon: <GitCompare size={20} />, label: 'Scenario Simulation' },
    { id: 'reports', path: '/reports', icon: <FileBarChart size={20} />, label: 'Reports & Exports' },
    { id: 'settings', path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 pt-16 transition-all duration-300 ease-in-out z-20 ${
        isOpen ? 'w-64' : 'w-0 lg:w-20'
      } overflow-hidden`}
    >
      <div className="h-full flex flex-col justify-between py-6">
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink 
              key={item.id}
              to={item.path} 
              className={({ isActive }) => 
                `flex items-center py-3 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-secondary-700 hover:bg-gray-100'
                } ${!isOpen && 'lg:justify-center'}`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`ml-3 font-medium text-sm ${!isOpen && 'lg:hidden'}`}>
                {item.label}
              </span>
              {isOpen && (
                <ChevronRight 
                  size={16} 
                  className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                />
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className={`px-4 ${!isOpen && 'lg:px-0 lg:text-center'}`}>
          <div className={`bg-gray-50 rounded-lg p-4 ${!isOpen && 'lg:p-3'}`}>
            <div className="mb-2 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 mx-auto">
              <LineChart size={16} />
            </div>
            {isOpen && (
              <>
                <h4 className="text-sm font-medium text-secondary-900 mb-1">AI Insights</h4>
                <p className="text-xs text-secondary-600 mb-3">
                  Get AI-powered traffic recommendations
                </p>
                <button className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;