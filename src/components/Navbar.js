import React, { useState, useRef } from 'react';
import { FiBell, FiSettings, FiLogOut, FiUploadCloud } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationModal from './NotificationModal';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || 
                  (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`transition-colors ${
        isActive
          ? 'text-accent-light dark:text-accent-dark font-bold'
          : 'text-gray-600 dark:text-gray-300 hover:text-accent-light dark:hover:text-accent-dark'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationButtonRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="navbar flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Left: Logo */}
      <div className="flex items-center space-x-3">
        <img src="/images/logo.jpeg" alt="RWDE Logo" className="h-8 w-auto rounded-full" />
        <span className="text-lg font-semibold text-gray-800 dark:text-white">
          Real World Insights Engine
        </span>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/explore">Explore</NavLink>
        <NavLink to="/projects">Projects</NavLink>
      </nav>

      {/* Right: Icons */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            ref={notificationButtonRef}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1 text-gray-600 dark:text-gray-300 hover:text-accent-light dark:hover:text-accent-dark transition-colors"
          >
            <FiBell className="w-5 h-5" />
            {/* Dynamic notification badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        
        {/* User menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 group"
          >
            <FaUserCircle className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-accent-light dark:group-hover:text-accent-dark transition-colors" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-accent-light dark:group-hover:text-accent-dark transition-colors">
              {settings?.profile?.firstName || user?.attributes?.given_name || user?.attributes?.name?.split(' ')[0] || user?.username || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
              <Link
                to="/upload"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <FiUploadCloud className="mr-2" />
                Upload Dataset
              </Link>
              <Link
                to="/settings"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <FiSettings className="mr-2" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiLogOut className="mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        triggerRef={notificationButtonRef}
      />
    </header>
  );
}