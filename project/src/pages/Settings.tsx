import React, { useState } from 'react';
import { Bell, MapPin, Users, Shield, Save } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <div>
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account and system preferences"
      />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <div className="w-64 border-r border-gray-200">
            <nav className="py-4">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                  activeTab === 'general'
                    ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-500'
                    : 'text-secondary-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <MapPin size={18} className="mr-3" />
                  <span>General Settings</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                  activeTab === 'notifications'
                    ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-500'
                    : 'text-secondary-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Bell size={18} className="mr-3" />
                  <span>Notifications</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                  activeTab === 'team'
                    ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-500'
                    : 'text-secondary-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Users size={18} className="mr-3" />
                  <span>Team Management</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                  activeTab === 'security'
                    ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-500'
                    : 'text-secondary-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Shield size={18} className="mr-3" />
                  <span>Security & Privacy</span>
                </div>
              </button>
            </nav>
          </div>
          
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-4">General Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Default City
                    </label>
                    <select className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                      <option>Nairobi</option>
                      <option>Mombasa</option>
                      <option>Kisumu</option>
                      <option>Nakuru</option>
                      <option>Eldoret</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Map Display
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          id="map-traffic" 
                          type="radio" 
                          name="map-type"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor="map-traffic" className="ml-2 text-sm text-secondary-700">
                          Traffic view
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="map-satellite" 
                          type="radio" 
                          name="map-type"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="map-satellite" className="ml-2 text-sm text-secondary-700">
                          Satellite view
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Time Format
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          id="time-24h" 
                          type="radio" 
                          name="time-format"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor="time-24h" className="ml-2 text-sm text-secondary-700">
                          24-hour (14:30)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="time-12h" 
                          type="radio" 
                          name="time-format"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="time-12h" className="ml-2 text-sm text-secondary-700">
                          12-hour (2:30 PM)
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      <Save size={16} className="mr-2" />
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">Traffic Alerts</h4>
                      <p className="text-xs text-secondary-500">
                        Receive alerts about major traffic incidents
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">AI Insights</h4>
                      <p className="text-xs text-secondary-500">
                        Get notifications for new AI traffic predictions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">Report Updates</h4>
                      <p className="text-xs text-secondary-500">
                        Notifications when new reports are available
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">System Updates</h4>
                      <p className="text-xs text-secondary-500">
                        Get notified about new features and improvements
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      <Save size={16} className="mr-2" />
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Other tab contents would be implemented similarly */}
            {activeTab === 'team' && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-secondary-300 mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Team Management</h3>
                <p className="text-secondary-600 mb-6">Manage team members and permissions</p>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Add Team Member
                </button>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="text-center py-12">
                <Shield size={48} className="mx-auto text-secondary-300 mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Security & Privacy</h3>
                <p className="text-secondary-600 mb-6">Manage security settings and data privacy</p>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;