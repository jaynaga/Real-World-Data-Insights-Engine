import React, { useState } from 'react';
import { FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

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
  const { user, logout, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
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
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/explore">Explore</NavLink>
        <NavLink to="/projects">Projects</NavLink>
      </nav>

      {/* Right: Icons */}
      <div className="flex items-center space-x-4">
        <NavLink to="/notifications">
          <FiBell className="w-5 h-5" />
        </NavLink>
        
        {/* User menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 group"
          >
            <FaUserCircle className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-accent-light dark:group-hover:text-accent-dark transition-colors" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-accent-light dark:group-hover:text-accent-dark transition-colors">
              {user?.name || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
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
    </header>
  );
}