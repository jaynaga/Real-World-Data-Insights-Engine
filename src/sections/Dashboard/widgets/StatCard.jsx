import React from 'react';

export default function StatCard({ label, value, icon, colorClass = 'blue' }) {
  const colorVariants = {
    blue: {
      iconBg: 'bg-blue-500 dark:bg-blue-600',
      iconText: 'text-white',
      valueText: 'text-blue-600 dark:text-blue-400',
      cardBg: 'bg-blue-50 dark:bg-blue-900/20',
      cardBorder: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      iconBg: 'bg-green-500 dark:bg-green-600',
      iconText: 'text-white',
      valueText: 'text-green-600 dark:text-green-400',
      cardBg: 'bg-green-50 dark:bg-green-900/20',
      cardBorder: 'border-green-200 dark:border-green-800'
    },
    purple: {
      iconBg: 'bg-purple-500 dark:bg-purple-600',
      iconText: 'text-white',
      valueText: 'text-purple-600 dark:text-purple-400',
      cardBg: 'bg-purple-50 dark:bg-purple-900/20',
      cardBorder: 'border-purple-200 dark:border-purple-800'
    },
    orange: {
      iconBg: 'bg-orange-500 dark:bg-orange-600',
      iconText: 'text-white',
      valueText: 'text-orange-600 dark:text-orange-400',
      cardBg: 'bg-orange-50 dark:bg-orange-900/20',
      cardBorder: 'border-orange-200 dark:border-orange-800'
    }
  };

  const colors = colorVariants[colorClass] || colorVariants.blue;

  return (
    <div className={`flex items-center p-4 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${colors.cardBg} ${colors.cardBorder}`}>
      {icon && (
        <div className={`mr-4 w-12 h-12 rounded-full flex items-center justify-center text-xl ${colors.iconBg} ${colors.iconText}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${colors.valueText}`}>{value}</p>
      </div>
    </div>
  );
}