import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Using the same mock data as SingleDatasetOverview
const mockDatasets = [
  {
    id: 1,
    name: 'Census Data 2020',
    description: 'Comprehensive demographic data from the 2020 US Census',
    tags: ['Demographics', 'Census', 'Population'],
    date: '2023-01-15',
    type: 'CSV',
    size: '2.5 GB'
  },
  {
    id: 2,
    name: 'Climate Change Indicators',
    description: 'Global temperature and climate indicators from 1950-2023',
    tags: ['Climate', 'Environment', 'Temperature'],
    date: '2023-03-20',
    type: 'JSON',
    size: '1.8 GB'
  }
];

export default function Explore() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-6">
          Explore Datasets
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDatasets.map((dataset) => (
            <Link
              key={dataset.id}
              to={`/explore/${dataset.id}`}
              className="block bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                {dataset.name}
              </h2>
              <p className="text-textSecondary-light dark:text-textSecondary-dark mb-4 line-clamp-2">
                {dataset.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {dataset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-sm text-textSecondary-light dark:text-textSecondary-dark">
                <span>{dataset.type}</span>
                <span>{dataset.size}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}