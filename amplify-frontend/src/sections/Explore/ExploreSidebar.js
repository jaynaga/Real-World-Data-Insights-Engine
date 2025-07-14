import React from 'react';

export default function ExploreSidebar({ isOpen, onClose, filters = {}, setFilters, datasets = [] }) {
  // Dynamically extract unique values from datasets
  const getUniqueValues = (field) => {
    const values = new Set();
    if (!Array.isArray(datasets)) return [];
    
    datasets.forEach(dataset => {
      if (!dataset) return;
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

      // Remove category if no filters are selected
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-card-dark border-l border-border-light dark:border-border-dark shadow-xl z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark"
          >
            ✕
          </button>
        </div>

        {/* Geography Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
            Geography
          </h3>
          <div className="space-y-2">
            {regions.map(region => (
              <label key={region} className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!filters.geography?.[region]}
                  onChange={() => handleFilterChange('geography', region)}
                  className="h-4 w-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
                />
                <span className="ml-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                  {region}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Data Type Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
            Data Type
          </h3>
          <div className="space-y-2">
            {dataTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!filters.type?.[type]}
                  onChange={() => handleFilterChange('type', type)}
                  className="h-4 w-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
                />
                <span className="ml-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Demographics Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
            Demographics
          </h3>
          <div className="space-y-2">
            {demographics.map(demo => (
              <label key={demo} className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!filters.demographics?.[demo]}
                  onChange={() => handleFilterChange('demographics', demo)}
                  className="h-4 w-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
                />
                <span className="ml-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                  {demo}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {Object.keys(filters).length > 0 && (
          <button
            onClick={() => setFilters({})}
            className="w-full px-4 py-2 text-sm text-accent-light dark:text-accent-dark border border-accent-light dark:border-accent-dark rounded-lg hover:bg-accent-light hover:text-white dark:hover:bg-accent-dark transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}