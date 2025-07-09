import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';
import { HiOutlineSortAscending } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import DatasetTable from './DatasetTable';
import ExploreSidebar from './ExploreSidebar';
import SingleDatasetOverview from './SingleDatasetOverview';
import '../../styles/tokens.css';

export default function DatasetExplorerPage() {
  const [filters, setFilters] = useState({});
  const [datasets, setDatasets] = useState(Array(7).fill({}));

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex min-h-screen h-screen page-bg">
              <ExploreSidebar filters={filters} setFilters={setFilters} />

              <main className="flex-1 p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">Datasets</h1>
                  <div className="flex gap-2">
                    <button className="btn-outline flex items-center gap-1 text-textPrimary-light dark:text-textPrimary-dark"><span>Filter</span></button>
                    <button className="btn-outline flex items-center gap-1 text-textPrimary-light dark:text-textPrimary-dark"><span>Sort</span></button>
                    <button className="btn-accent">+ Request Dataset</button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="card bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark">Total Datasets<br/><span className="font-bold text-xl">128</span></div>
                  <div className="card bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark">Pinned Datasets<br/><span className="font-bold text-xl">7</span></div>
                  <div className="card bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark">Recently Updated<br/><span className="font-bold text-xl">23</span></div>
                  <div className="card bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark">Total Variables<br/><span className="font-bold text-xl">4,582</span></div>
                </div>

                {/* Dataset Table */}
                <DatasetTable datasets={datasets} />

                {/* Pagination */}
                <div className="flex justify-end mt-4 gap-1">
                  {[1, 2, 3, 4, 5].map(page => (
                    <button
                      key={page}
                      className="px-3 py-1 rounded border border-default text-sm bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark"
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </main>
            </div>
          }
        />
        <Route path="dataset" element={<SingleDatasetOverview />} />
      </Routes>
    </>
  );
}
