import React from 'react';

export default function ExploreSidebar() {
  return (
    <aside className="w-64 h-screen min-h-screen p-4 bg-card-light dark:bg-card-dark border-r border-default flex flex-col">
      <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">Filters</h2>
      <input type="text" placeholder="Search datasets..." className="w-full mb-4 p-2 rounded border-default bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark" />

      <div className="mb-4">
        <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark">Geography</h3>
        {['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Australia/Oceania'].map(region => (
          <label key={region} className="block text-sm text-textSecondary-light dark:text-textSecondary-dark">
            <input type="checkbox" className="mr-2" />{region}
          </label>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark">Data Type</h3>
        {['Survey Data', 'Clinical Trials', 'Longitudinal Studies', 'Census Data', 'Administrative Data'].map(type => (
          <label key={type} className="block text-sm text-textSecondary-light dark:text-textSecondary-dark">
            <input type="checkbox" className="mr-2" />{type}
          </label>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark">Date Range</h3>
        <input type="date" className="w-full mb-2 border-default p-1 rounded bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark" />
        <input type="date" className="w-full border-default p-1 rounded bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark" />
      </div>

      <div className="mb-4">
        <h3 className="font-medium text-textSecondary-light dark:text-textSecondary-dark">Demographics</h3>
        {['Children (0-12)', 'Adolescents (13-17)', 'Young Adults (18-25)', 'Adults (26-64)', 'Seniors (65+)'].map(demo => (
          <label key={demo} className="block text-sm text-textSecondary-light dark:text-textSecondary-dark">
            <input type="checkbox" className="mr-2" />{demo}
          </label>
        ))}
      </div>

      <button className="btn-accent w-full mt-2">Apply Filters</button>
      <button className="text-sm text-blue-600 mt-2 hover:underline">Reset All</button>
    </aside>
  );
}