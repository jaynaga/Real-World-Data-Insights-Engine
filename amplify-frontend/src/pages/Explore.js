import React, { useState } from 'react';
import { FiFilter, FiDownload, FiEye, FiPlus } from 'react-icons/fi';
import { FaThumbtack } from 'react-icons/fa';
import { HiOutlineSortAscending } from 'react-icons/hi';
import { FaRobot } from 'react-icons/fa';

export default function DatasetExplorerPage() {
  const [filters, setFilters] = useState({});
  const [datasets, setDatasets] = useState(Array(7).fill({})); // Placeholder array for UI

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filters</h2>
        <input type="text" placeholder="Search datasets..." className="w-full mb-4 p-2 rounded border" />

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Geography</h3>
          {['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Australia/Oceania'].map(region => (
            <label key={region} className="block text-sm">
              <input type="checkbox" className="mr-2" />{region}
            </label>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Data Type</h3>
          {['Survey Data', 'Clinical Trials', 'Longitudinal Studies', 'Census Data', 'Administrative Data'].map(type => (
            <label key={type} className="block text-sm">
              <input type="checkbox" className="mr-2" />{type}
            </label>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Date Range</h3>
          <input type="date" className="w-full mb-2 border p-1 rounded" />
          <input type="date" className="w-full border p-1 rounded" />
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Demographics</h3>
          {['Children (0-12)', 'Adolescents (13-17)', 'Young Adults (18-25)', 'Adults (26-64)', 'Seniors (65+)'].map(demo => (
            <label key={demo} className="block text-sm">
              <input type="checkbox" className="mr-2" />{demo}
            </label>
          ))}
        </div>

        <button className="btn-accent w-full mt-2">Apply Filters</button>
        <button className="text-sm text-blue-600 mt-2 hover:underline">Reset All</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Datasets</h1>
          <div className="flex gap-2">
            <button className="btn-outline flex items-center gap-1"><FiFilter /> Filter</button>
            <button className="btn-outline flex items-center gap-1"><HiOutlineSortAscending /> Sort</button>
            <button className="btn-accent">+ Request Dataset</button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">Total Datasets<br/><span className="font-bold text-xl">128</span></div>
          <div className="card">Pinned Datasets<br/><span className="font-bold text-xl">7</span></div>
          <div className="card">Recently Updated<br/><span className="font-bold text-xl">23</span></div>
          <div className="card">Total Variables<br/><span className="font-bold text-xl">4,582</span></div>
        </div>

        {/* Dataset Table */}
        <div className="bg-white dark:bg-gray-800 border rounded shadow-sm">
          <div className="p-4 border-b font-semibold text-gray-700 dark:text-gray-200">Name</div>
          {datasets.map((_, index) => (
            <div key={index} className="grid grid-cols-6 items-center gap-4 p-4 border-b text-sm">
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <FiThumbtack className="text-yellow-500" />
                  <div>
                    <p className="font-semibold">Example Dataset {index + 1}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">This is a short description</p>
                  </div>
                </div>
              </div>
              <div>Source Org</div>
              <div>Jun 1, 2023</div>
              <div>247</div>
              <div className="flex gap-2">
                <FiPlus className="cursor-pointer" />
                <FiEye className="cursor-pointer" />
                <FiDownload className="cursor-pointer" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-1">
          {[1, 2, 3, 4, 5].map(page => (
            <button key={page} className="px-3 py-1 rounded border text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {page}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}