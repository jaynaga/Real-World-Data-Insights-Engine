import React from 'react';
import { FaArrowLeft, FaShareAlt, FaDownload, FaDatabase, FaHospitalAlt, FaChartBar, FaPills, FaMapMarkerAlt } from 'react-icons/fa';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import { MdOutlineDashboard } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function SingleProject() {
  const navigate = useNavigate();

  const datasets = [
    {
      name: 'National Mental Health Survey 2023',
      rows: '15,847',
      columns: 23,
      updated: '2 days ago',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      icon: <FaDatabase className="text-blue-600" />,
    },
    {
      name: 'Regional Treatment Centers Data',
      rows: '8,234',
      columns: 18,
      updated: '1 week ago',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
      icon: <FaHospitalAlt className="text-green-600" />,
    },
    {
      name: 'Demographics & Mental Health Correlation',
      rows: '25,691',
      columns: 31,
      updated: '3 days ago',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
      icon: <FaChartBar className="text-purple-600" />,
    },
    {
      name: 'Hospital Admission Rates',
      rows: '12,456',
      columns: 15,
      updated: '5 days ago',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600',
      icon: <FaMapMarkerAlt className="text-orange-600" />,
    },
    {
      name: 'Medication Effectiveness Study',
      rows: '7,892',
      columns: 12,
      updated: '1 week ago',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      icon: <FaPills className="text-red-600" />,
    },
  ];

  const stats = [
    { label: 'Total Records', value: '70,120', icon: '🗃️' },
    { label: 'Data Sources', value: '12', icon: '🧩' },
    { label: 'Last Updated', value: '2 hrs ago', icon: '⏰' },
    { label: 'Dashboards', value: '3', icon: '📊' },
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

      <h1 className="text-2xl font-semibold mb-1">Mental Health Analysis</h1>
      <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
        Comprehensive analysis of mental health trends across different demographics and regions
      </p>
      <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-4">
        Created on March 15, 2024 · Last updated 2 hours ago
        <span className="ml-2 text-green-600 text-xs font-medium bg-green-100 px-2 py-0.5 rounded">Active</span>
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
        {datasets.map((d, i) => (
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
        ))}
      </div>
    </div>
  );
}
