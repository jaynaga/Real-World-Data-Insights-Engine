import React from 'react';

export default function ChartTypeSelector({ types, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onChange(type)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${selected.id === type.id
              ? 'bg-accent-light dark:bg-accent-dark text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {type.name}
        </button>
      ))}
    </div>
  );
}
