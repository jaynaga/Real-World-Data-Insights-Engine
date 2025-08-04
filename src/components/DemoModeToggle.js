import React from 'react';
import { FaDesktop, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useDemoMode } from '../context/DemoContext';

export default function DemoModeToggle({ className = '' }) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <button
      onClick={toggleDemoMode}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
        isDemoMode
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
      } ${className}`}
      title={`${isDemoMode ? 'Disable' : 'Enable'} demo mode`}
    >
      <FaDesktop className="w-4 h-4" />
      <span className="text-sm font-medium">
        {isDemoMode ? 'Demo Mode' : 'Dev Mode'}
      </span>
      {isDemoMode ? (
        <FaEye className="w-4 h-4" />
      ) : (
        <FaEyeSlash className="w-4 h-4" />
      )}
    </button>
  );
}
