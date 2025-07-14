import React from 'react';

export default function ExploreSidebar({ isOpen, onClose, filters, setFilters, datasets }) {
  // Dynamically extract unique values from datasets
  const getUniqueValues = (field) => {
    const values = new Set();
    datasets.forEach(dataset => {
      if (Array.isArray(dataset[field])) {
        dataset[field].forEach(value => values.add(value));
      } else if (dataset[field]) {
        values.add(dataset[field]);
      }
    });
    return Array.from(values).sort();
  };

  // Get unique values for each filter category
  const regions = getUniqueValues('geography');
  const dataTypes = getUniqueValues('type');
  const demographics = getUniqueValues('demographics');

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [category]: {
          ...prev[category],
          [value]: !prev[category]?.[value]
        }
      };

      // If all filters in a category are unchecked, remove the category
      if (Object.values(newFilters[category]).every(v => !v)) {
        delete newFilters[category];
      }

      return newFilters;
    });
  };

  const handleDateChange = (type, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [type]: value
        }
      };

      // If both date fields are empty, remove the dateRange
      if (!newFilters.dateRange.from && !newFilters.dateRange.to) {
        delete newFilters.dateRange;
      }

      return newFilters;
    });
  };

  // Get min and max dates from datasets
  const dateRange = datasets.reduce((range, dataset) => {
    const date = new Date(dataset.date);
    if (!range.min || date < range.min) range.min = date;
    if (!range.max || date > range.max) range.max = date;
    return range;
  }, { min: null, max: null });

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <div className={`fixed inset-y-0 right-0 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-50`}>
      <aside className="w-64 h-screen min-h-screen p-4 bg-card-light dark:bg-card-dark border-l border-default flex flex-col shadow-lg overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">Filters</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-surface-dark rounded-full"
          >
            ×
          </button>
        </div>

        {regions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">Geography</h3>
            {regions.map(region => (
              <label key={region} className="flex items-center text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={filters.geography?.[region] || false}
                  onChange={() => handleFilterChange('geography', region)}
                />
                {region}
              </label>
            ))}
          </div>
        )}

        {dataTypes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">Data Type</h3>
            {dataTypes.map(type => (
              <label key={type} className="flex items-center text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={filters.dataType?.[type] || false}
                  onChange={() => handleFilterChange('dataType', type)}
                />
                {type}
              </label>
            ))}
          </div>
        )}

        <div className="mb-4">
          <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">Date Range</h3>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1 block">From</label>
              <input 
                type="date" 
                value={filters.dateRange?.from || ''}
                min={dateRange.min?.toISOString().split('T')[0]}
                max={dateRange.max?.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="w-full border-default p-1 rounded bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark" 
              />
            </div>
            <div>
              <label className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1 block">To</label>
              <input 
                type="date" 
                value={filters.dateRange?.to || ''}
                min={dateRange.min?.toISOString().split('T')[0]}
                max={dateRange.max?.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="w-full border-default p-1 rounded bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark" 
              />
            </div>
          </div>
        </div>

        {demographics.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">Demographics</h3>
            {demographics.map(demo => (
              <label key={demo} className="flex items-center text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={filters.demographics?.[demo] || false}
                  onChange={() => handleFilterChange('demographics', demo)}
                />
                {demo}
              </label>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark">
          <button 
            onClick={handleApply}
            className="w-full px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:bg-accent-dark dark:hover:opacity-90 transition-colors mb-2"
          >
            Apply Filters
          </button>
          <button 
            onClick={handleReset}
            className="w-full px-4 py-2 text-sm text-accent-light dark:text-accent-dark hover:underline"
          >
            Reset All
          </button>
        </div>
      </aside>
    </div>
  );
}