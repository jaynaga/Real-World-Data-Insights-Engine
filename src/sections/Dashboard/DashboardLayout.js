import React from 'react';

export default function DashboardLayout({ children, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title || 'Dashboard'}
                </h1>
                {subtitle && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
