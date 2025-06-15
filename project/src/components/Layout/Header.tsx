import React, { useState, useEffect } from 'react';
import { Menu, LogOut, BellRing, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    alert("You've been successfully signed out. See you again soon!");
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/95'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-3 p-2 rounded-full hover:bg-gray-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white mr-3">
              <MapPin size={20} strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold text-secondary-900">MoveSmart <span className="text-primary-500">KE</span></h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-full hover:bg-gray-100 relative"
              aria-label="Notifications"
            >
              <BellRing size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent-500"></span>
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-40 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-medium text-sm text-secondary-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50 border-l-2 border-warning-500">
                    <p className="text-sm font-medium text-secondary-900">Traffic alert: Mombasa Rd</p>
                    <p className="text-xs text-gray-500">10 minutes ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 border-l-2 border-error-500">
                    <p className="text-sm font-medium text-secondary-900">System update completed</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 border-l-2 border-primary-500">
                    <p className="text-sm font-medium text-secondary-900">New area data available</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center ml-2 cursor-pointer">
              <div className="mr-3 text-right hidden sm:block">
                <p className="text-sm font-medium text-secondary-900">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  Authenticated User
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center overflow-hidden border-2 border-white">
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-semibold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-40 border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-secondary-900 truncate">{user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;