import React from 'react';
import { FaArrowLeft, FaBookmark, FaDownload } from 'react-icons/fa';
import { BsFillPlayFill } from 'react-icons/bs';
import { HiOutlineChartBar, HiOutlineDocumentReport } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import '../../styles/tokens.css';

export default function SingleDatasetOverview() {
  return (
    <div className="min-h-screen page-bg text-textPrimary-light dark:text-textPrimary-dark">
      <Navbar />

      {/* Header */}
      <div className="flex justify-between items-start gap-6 p-6 border-b border-default bg-card-light dark:bg-card-dark shadow-sm">
        <div className="flex gap-4 items-start">
          <div className="p-3 rounded-full bg-accent-light dark:bg-accent-dark text-white">
            <BsFillPlayFill size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">National Mental Health Survey 2023</h1>
            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Comprehensive survey data on mental health trends across demographics
            </p>
            <p className="text-xs mt-1 text-textSecondary-light dark:text-textSecondary-dark">
              Created on January 10, 2024 · Last updated 2 days ago
              <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Active</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-outline text-sm"><FaDownload className="mr-1" /> Preview Data</button>
          <button className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded flex items-center gap-1">
            <HiOutlineChartBar /> Create Visualization
          </button>
          <button className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded flex items-center gap-1">
            <HiOutlineDocumentReport /> Prebuilt Dashboard
          </button>
        </div>
      </div>

      {/* Body Grid */}
      <div className="grid grid-cols-12 gap-6 p-6">
        {/* Left Navigation */}
        <div className="col-span-2">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 text-sm font-medium text-accent-light dark:text-accent-dark bg-accent-light/10 dark:bg-accent-dark/20 p-2 rounded">
              <FaArrowLeft /> Overview
            </button>
            <button className="w-full text-left text-sm p-2 rounded hover:bg-card-hover-dark">Data Preview</button>
            <button className="w-full text-left text-sm p-2 rounded hover:bg-card-hover-dark">Export</button>
          </div>
        </div>

        {/* Middle Content */}
        <div className="col-span-7 space-y-6">
          {/* Dataset Info */}
          <div className="bg-card-light dark:bg-card-dark p-5 rounded-lg border border-default shadow-sm">
            <h2 className="text-md font-semibold mb-4">Dataset Information</h2>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <p><strong>Source:</strong> National Health Institute</p>
              <p><strong>Format:</strong> CSV</p>
              <p><strong>File Size:</strong> 12.4 MB</p>
              <p><strong>License:</strong> Open Data License</p>
              <p><strong>Collection Period:</strong> Jan 2023 - Dec 2023</p>
              <p><strong>Geographic Coverage:</strong> United States</p>
            </div>
          </div>

          {/* Variables */}
          <div className="bg-card-light dark:bg-card-dark p-5 rounded-lg border border-default shadow-sm">
            <h2 className="text-md font-semibold mb-4">Variables (23 columns)</h2>
            <div className="space-y-4 text-sm">
              {[{
                name: 'participant_id', description: 'Unique identifier for survey participants', type: 'Integer', color: 'blue'
              }, {
                name: 'age', description: 'Age of participant in years', type: 'Numeric', color: 'green'
              }, {
                name: 'gender', description: 'Gender identity (Male, Female, Other, Prefer not to say)', type: 'Categorical', color: 'purple'
              }, {
                name: 'state', description: 'US State abbreviation', type: 'Categorical', color: 'purple'
              }, {
                name: 'depression_score', description: 'PHQ-9 depression assessment score (0–27)', type: 'Numeric', color: 'green'
              }, {
                name: 'anxiety_score', description: 'GAD-7 anxiety assessment score (0–21)', type: 'Numeric', color: 'green'
              }].map(({ name, description, type, color }) => (
                <div key={name} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{description}</div>
                  </div>
                  <span className={`ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full border border-${color}-400 text-${color}-600 bg-${color}-100 dark:bg-${color}-900 dark:text-${color}-300`}>
                    {type}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <a href="#" className="text-sm text-accent-light dark:text-accent-dark hover:underline">
                  View All 23 Variables
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-3 space-y-6">
          {/* Quick Stats */}
          <div className="bg-card-light dark:bg-card-dark p-5 rounded-lg border border-default shadow-sm text-sm">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <p>Total Rows: <strong>15,847</strong></p>
            <p>Columns: <strong>23</strong></p>
            <p>Missing Values: <span className="text-red-500 font-medium">2.3%</span></p>
            <p>Duplicates: <span className="text-green-600 font-medium">0</span></p>
          </div>

          {/* Data Quality */}
          <div className="bg-card-light dark:bg-card-dark p-5 rounded-lg border border-default shadow-sm text-sm">
            <h3 className="font-semibold mb-3">Data Quality</h3>
            {[{ label: 'Completeness', value: 97.7, color: 'bg-green-400' }, { label: 'Consistency', value: 95.2, color: 'bg-blue-500' }, { label: 'Validity', value: 98.9, color: 'bg-green-600' }].map(({ label, value, color }) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span>{label}</span><span>{value}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-light dark:bg-surface-dark">
                  <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="bg-card-light dark:bg-card-dark p-5 rounded-lg border border-default shadow-sm text-sm">
            <h3 className="font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {['Mental Health', 'Survey', 'Demographics', 'Healthcare', '2023'].map(tag => (
                <span key={tag} className="bg-surface-light dark:bg-surface-dark text-xs px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button className="text-sm flex items-center gap-1 text-accent-light dark:text-accent-dark hover:underline">
              <FaBookmark /> Bookmark
            </button>
            <button className="text-sm flex items-center gap-1 text-accent-light dark:text-accent-dark hover:underline">
              <FaDownload /> Download
            </button>
          </div>
        </div>
      </div> {/* End of grid-cols-12 gap-6 p-6 */}
    </div>
  );
}