import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listDatasets } from '../utils/storageUtils';
import AIDatasetAssistant from '../components/AIDatasetAssistant';
import { FaRobot } from 'react-icons/fa';

export default function Explore() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI Dataset Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const handleOpenAIAssistant = () => setShowAIAssistant(true);
  const handleCloseAIAssistant = () => setShowAIAssistant(false);

  const loadDatasets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading dataset folders from raw directory...');

      const rawDatasets = await listDatasets();
      console.log('Loaded datasets:', rawDatasets);

      if (rawDatasets.length === 0) {
        console.warn('No dataset folders found in S3');
        // Set empty datasets array if no real dataset folders are found
        setDatasets([]);
        return;
      }

      // Transform the data to match the expected format
      const transformedDatasets = rawDatasets.map(dataset => ({
        id: dataset.id,
        name: dataset.name,
        description: `Dataset from ${dataset.path} (${dataset.source})`,
        tags: ['Synthea', 'Healthcare', 'CSV'],
        date: dataset.lastModified.toISOString().split('T')[0],
        type: dataset.format.toUpperCase(),
        size: formatFileSize(dataset.size),
        key: dataset.key
      }));

      setDatasets(transformedDatasets);
    } catch (err) {
      console.error('Failed to load datasets:', err);
      setError(err.message);

      // Show a more helpful error message
      if (err.message.includes('not authorized')) {
        setError('S3 permissions are still being configured. Please check back later.');
        // Set empty datasets array on permission error
        setDatasets([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
              Explore Datasets
            </h1>
            <button
              onClick={handleOpenAIAssistant}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <FaRobot /> AI Dataset Assistant
            </button>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-textSecondary-light dark:text-textSecondary-dark">
              Loading datasets...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
              Explore Datasets
            </h1>
            <button
              onClick={handleOpenAIAssistant}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <FaRobot /> AI Dataset Assistant
            </button>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">
              Failed to load datasets: {error}
            </p>
            <button
              onClick={loadDatasets}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
            Explore Datasets
          </h1>
          <button
            onClick={handleOpenAIAssistant}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <FaRobot /> AI Dataset Assistant
          </button>
        </div>

        {datasets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-textSecondary-light dark:text-textSecondary-dark mb-4">
              No dataset folders found in the raw directory.
            </p>
            <button
              onClick={loadDatasets}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
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
                <div className="mt-2 text-xs text-textSecondary-light dark:text-textSecondary-dark">
                  Updated: {dataset.date}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* AI Dataset Assistant Modal */}
        {showAIAssistant && (
          <AIDatasetAssistant
            isOpen={showAIAssistant}
            onClose={handleCloseAIAssistant}
            availableDatasets={datasets}
            onDatasetSelect={() => {}} // No dataset selection functionality needed on explore page
            currentProjectDatasets={[]}
          />
        )}
      </div>
    </div>
  );
}