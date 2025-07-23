import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import DataVisualizer from '../../components/DataVisualizer';

export default function ProjectVisualization() {
  // Example dataset - replace with your actual data
  const [dataset] = useState([
    { age: 25, income: 50000, satisfaction: 8, region: 'North' },
    { age: 30, income: 65000, satisfaction: 7, region: 'South' },
    { age: 35, income: 75000, satisfaction: 9, region: 'East' },
    { age: 40, income: 90000, satisfaction: 6, region: 'West' },
    // Add more data points as needed
  ]);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <div className="mb-6">
        <Link 
          to="/projects"
          className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2 hover:opacity-80"
        >
          <FaArrowLeft /> Back to Project
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
          Data Visualization
        </h1>
        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
          Create and customize visualizations by dragging variables onto the chart
        </p>
      </div>

      <div className="bg-white dark:bg-card-dark rounded-lg shadow-sm">
        <DataVisualizer dataset={dataset} />
      </div>
    </div>
  );
}
