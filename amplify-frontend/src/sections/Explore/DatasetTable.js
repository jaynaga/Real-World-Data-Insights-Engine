import React from 'react';
import DatasetCard from './DatasetCard';

export default function DatasetTable({ datasets }) {
  return (
    <div className="bg-card-light dark:bg-card-dark border border-default rounded-lg shadow-sm">
      {/* Header Row */}
        <div className="grid grid-cols-6 items-center gap-4 p-4 border-b border-default text-base font-bold text-textPrimary-light dark:text-textPrimary-dark">
        <div className="col-span-2 text-left">Name</div>
        <div className="text-left">Source</div>
        <div className="text-left">Last Updated</div>
        <div className="text-left">Variables</div>
        <div className="text-left">Actions</div>
        </div>

      {/* Dataset Rows */}
      {datasets.map((_, index) => (
        <DatasetCard key={index} index={index} />
      ))}
    </div>
  );
}