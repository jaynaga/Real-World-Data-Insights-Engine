import React, { useMemo } from 'react';

export default function ExploreSidebar({ isOpen, onClose, filters = {}, setFilters, datasets = [] }) {
  // Get all filterable fields and their unique values
  const filterableFields = useMemo(() => {
    if (!datasets.length) return {};
    
    // Define which fields should be filterable
    const fieldsToFilter = [
      { key: 'type', label: 'Data Type' },
      { key: 'geography', label: 'Region' },
      { key: 'tags', label: 'Tags' },
      { key: 'demographics', label: 'Demographics' }
    ];
    
    // Create an object with field names as keys and their unique values as values
    return fieldsToFilter.reduce((acc, { key, label }) => {
      const values = new Set();
      
      datasets.forEach(dataset => {
        if (!dataset || !dataset[key]) return;
        
        if (Array.isArray(dataset[key])) {
          dataset[key].forEach(value => values.add(value));
        } else {
          values.add(dataset[key]);
        }
      });
      
      if (values.size > 0) {
        acc[key] = {
          label,
          values: Array.from(values).sort()
        };
      }
      
      return acc;
    }, {});
  }, [datasets]);

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

  // eslint-disable-next-line no-unused-vars
  const handleCategoryToggle = (category) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (!newFilters.categories) {
        newFilters.categories = [];
      }
      
      if (newFilters.categories.includes(category)) {
        newFilters.categories = newFilters.categories.filter(c => c !== category);
      } else {
        newFilters.categories = [...newFilters.categories, category];
      }

      return newFilters;
    });
  };

  // eslint-disable-next-line no-unused-vars
  const dateRange = datasets.reduce((range, dataset) => {
    const date = new Date(dataset.date);
    if (!range.min || date < range.min) range.min = date;
    if (!range.max || date > range.max) range.max = date;
    return range;
  }, { min: null, max: null });

  // eslint-disable-next-line no-unused-vars
  const handleReset = () => {
    setFilters({});
  };

  // eslint-disable-next-line no-unused-vars
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

        {/* Data Source Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
            Data Source
          </h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!filters.source?.['Local']}
                onChange={() => handleFilterChange('source', 'Local')}
                className="h-4 w-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
              />
              <span className="ml-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                Local Datasets
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!filters.source?.['Kaggle']}
                onChange={() => handleFilterChange('source', 'Kaggle')}
                className="h-4 w-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
              />
              <span className="ml-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                Kaggle Datasets
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-100">
                  Psychiatric
                </span>
              </span>
            </label>
          </div>
        </div>

        {Object.entries(filterableFields).map(([key, { label, values }]) => (
          <div key={key} className="mb-6">
            <h3 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
              {label}
            </h3>
            <div className="space-y-2">
              {values.map(value => (
                <label key={value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!filters[key]?.[value]}
                    onChange={() => handleFilterChange(key, value)}
                    className="h-4 w-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
                  />
                  <span className="ml-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                    {value}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

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