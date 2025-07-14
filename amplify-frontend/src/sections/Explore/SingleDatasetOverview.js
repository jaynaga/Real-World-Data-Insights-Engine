import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiDownload, FiShare2, FiBarChart2, FiMap, FiCalendar, FiUsers, FiTag, FiArrowLeft } from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineGlobe } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import '../../styles/tokens.css';

export default function SingleDatasetOverview({ datasets }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const dataset = useMemo(() => {
    return datasets?.find(d => d.id === parseInt(datasetId)) || null;
  }, [datasets, datasetId]);

  if (!dataset) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
            Dataset not found
          </h2>
          <button
            onClick={() => navigate('/explore')}
            className="text-accent-light dark:text-accent-dark hover:underline"
          >
            Return to Datasets
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <Navbar />

      {/* Header */}
      <div className="bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center text-sm text-textSecondary-light dark:text-textSecondary-dark hover:text-accent-light dark:hover:text-accent-dark mb-4"
          >
            <FiArrowLeft className="mr-2" /> Back to Datasets
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                {dataset.name}
              </h1>
              <p className="text-textSecondary-light dark:text-textSecondary-dark max-w-2xl">
                {dataset.description}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90">
                <FiDownload /> Download Dataset
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark">
                <FiShare2 /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Stats and Metadata */}
          <div className="md:col-span-2 space-y-6">
            {/* Key Stats */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Dataset Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <HiOutlineDocumentText className="mr-2" /> Type
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset.type}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <FiBarChart2 className="mr-2" /> Records
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset.records}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <HiOutlineGlobe className="mr-2" /> Size
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset.size}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <FiCalendar className="mr-2" /> Last Updated
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset.lastUpdated}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Data Preview
              </h2>
              <div className="bg-gray-50 dark:bg-surface-dark rounded-lg p-4 h-64 flex items-center justify-center">
                <span className="text-textSecondary-light dark:text-textSecondary-dark">
                  Data preview will be displayed here
                </span>
              </div>
            </div>

            {/* Data Schema */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Data Schema
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-surface-dark">
                      <th className="px-4 py-2 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">
                        Column Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    <tr>
                      <td className="px-4 py-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                        Example Column
                      </td>
                      <td className="px-4 py-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                        String
                      </td>
                      <td className="px-4 py-2 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                        Example description
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Metadata and Tags */}
          <div className="space-y-6">
            {/* Geographic Coverage */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Geographic Coverage
              </h2>
              <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark">
                <FiMap className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                {dataset.geography}
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Demographics
              </h2>
              <div className="space-y-2">
                {dataset.demographics.map((demo, index) => (
                  <div
                    key={index}
                    className="flex items-center text-textPrimary-light dark:text-textPrimary-dark"
                  >
                    <FiUsers className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                    {demo}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {dataset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                  >
                    <FiTag className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Additional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    Date Added
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark">
                    {formatDate(dataset.date)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    License
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark">
                    Open Data License
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}