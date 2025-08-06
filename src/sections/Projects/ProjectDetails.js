import React from 'react';
import { FaArrowLeft, FaShareAlt, FaDownload, FaDatabase } from 'react-icons/fa';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import { MdOutlineDashboard } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function SingleProject() {
  const navigate = useNavigate();

  const datasets = [];

  const stats = [
    { label: 'Total Records', value: '0', icon: '🗃️' },
    { label: 'Data Sources', value: '0', icon: '🧩' },
    { label: 'Last Updated', value: 'Never', icon: '⏰' },
    { label: 'Dashboards', value: '0', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-surface-light text-textPrimary-light dark:bg-surface-dark dark:text-textPrimary-dark p-6">
      <div className="flex items-center mb-6">
        <button
          className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2"
          onClick={() => navigate('/projects')}
        >
          <FaArrowLeft /> Back to Projects
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-1">New Project</h1>
      <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
        Create and configure your data analysis project
      </p>
      <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-4">
        No datasets added yet
        <span className="ml-2 text-gray-600 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">Draft</span>
      </p>

      <div className="flex gap-2 mb-6">
        <button className="bg-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2">
          <HiOutlinePlusCircle /> Add Dataset
        </button>
        <button className="bg-green-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2">
          <MdOutlineDashboard /> New Dashboard
        </button>
        <div className="ml-auto flex gap-2">
          <button className="btn-outline text-sm flex items-center gap-1">
            <FaShareAlt /> Share
          </button>
          <button className="btn-outline text-sm flex items-center gap-1">
            <FaDownload /> Export
          </button>
        </div>
      </div>

      {/* Metrics Grid - moved above datasets list */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center justify-center bg-white dark:bg-card-dark border border-default rounded-lg py-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-semibold">{s.value}</p>
            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Datasets List */}
      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-sm mb-6">
        <h2 className="p-4 font-semibold text-sm border-b border-default">Project Datasets</h2>
        {datasets.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FaDatabase className="mx-auto mb-4 text-4xl" />
            <h3 className="text-lg font-medium mb-2">No datasets added</h3>
            <p className="text-sm">Add your first dataset to start analyzing data.</p>
          </div>
        ) : (
          datasets.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-t border-default hover:bg-gray-50 dark:hover:bg-surface-dark">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${d.iconBg} ${d.iconText} flex items-center justify-center`}>
                  {d.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                    {d.rows} rows · {d.columns} columns · Updated {d.updated}
                  </p>
                </div>
              </div>
              <button className="text-xs font-medium bg-gray-100 dark:bg-surface-dark px-3 py-1 rounded">Preview</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
