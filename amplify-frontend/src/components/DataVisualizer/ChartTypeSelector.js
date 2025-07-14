import React from 'react';

const chartTypes = [
  { id: 'line', label: 'Line Chart', icon: '📈' },
  { id: 'bar', label: 'Bar Chart', icon: '📊' },
  { id: 'area', label: 'Area Chart', icon: '🌊' },
  { id: 'scatter', label: 'Scatter Plot', icon: '⚡' },
  { id: 'pie', label: 'Pie Chart', icon: '🥧' }
];

const ChartTypeSelector = ({ selectedType, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Chart Type</h3>
      <div className="space-y-2">
        {chartTypes.map(type => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedType === type.id
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartTypeSelector;
