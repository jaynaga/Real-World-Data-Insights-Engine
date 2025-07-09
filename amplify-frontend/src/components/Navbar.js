import React from 'react';
import { FiBell, FiSettings } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Navbar() {
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
      <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-600 dark:text-gray-300">
        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Home</a>
        <Link to="/explore" className="hover:text-blue-600 dark:hover:text-blue-400">Explore</Link>
        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Projects</a>
      </nav>

      {/* Right: Icons */}
      <div className="flex items-center space-x-4">
        <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300 cursor-pointer" />
        <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300 cursor-pointer" />
        <FaUserCircle className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer" />
      </div>
    </header>
  );
}