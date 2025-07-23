import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiDownload,
  FiShare2,
  FiBarChart2,
  FiMap,
  FiCalendar,
  FiUsers,
  FiTag,
  FiArrowLeft,
  FiZap,
  FiDatabase,
  FiFileText,
  FiEye
} from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineGlobe } from 'react-icons/hi';
import { loadCsvDataset } from '../../utils/storageUtils';
import DataViewer from '../../components/DataViewer';
import AINotebookGenerator from '../../components/AINotebookGenerator';
import '../../styles/tokens.css';

export default function SingleDatasetOverview({ datasets = [], loading = false }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  // ✅ Memoized dataset lookup
  const dataset = useMemo(() => {
    return datasets.find((d) => String(d.id) === String(datasetId));
  }, [datasets, datasetId]);

  // State for file management and preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);

  // AI Notebook Generator state
  const [showNotebookGenerator, setShowNotebookGenerator] = useState(false);

  // ✅ Auto-select first file when dataset loads
  useEffect(() => {
    if (dataset?.files?.length > 0 && !selectedFile) {
      setSelectedFile(dataset.files[0]);
    }
  }, [dataset, selectedFile]);

  // ✅ Load CSV data when a file is selected
  useEffect(() => {
    if (selectedFile?.key) {
      setCsvLoading(true);
      setCsvError(null);
      loadCsvDataset(selectedFile.key, dataset?.accessLevel || 'protected')
        .then((result) => setCsvPreview(result))
        .catch((err) => setCsvError(err.message))
        .finally(() => setCsvLoading(false));
    }
  }, [selectedFile, dataset?.accessLevel]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setCsvPreview(null);
  };

  const handleGenerateNotebook = () => {
    setShowNotebookGenerator(true);
  };

  const handleDownloadDataset = () => {
    if (!selectedFile) {
      alert('Please select a file to download');
      return;
    }
    const fileUrl = `https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${selectedFile.key}`;
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
            Loading dataset...
          </h2>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center text-sm text-textSecondary-light dark:text-textSecondary-dark hover:text-accent-light dark:hover:text-accent-dark mb-4"
          >
            <FiArrowLeft className="mr-2" /> Back to Datasets
          </button>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <FiDatabase className="text-blue-500 text-xl" />
                <h1 className="text-xl sm:text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                  {dataset.name}
                </h1>
              </div>
              <p className="text-textSecondary-light dark:text-textSecondary-dark text-sm sm:text-base">
                {dataset.description}
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleDownloadDataset}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90 text-sm"
              >
                <FiDownload /> {selectedFile ? `Download ${selectedFile.name}` : 'Download Dataset'}
              </button>
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark text-sm">
                <FiShare2 /> Share
              </button>
              <button
                onClick={handleGenerateNotebook}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiZap className="text-sm" />
                <span>Generate AI Notebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {/* Left Column - Stats and Data */}
          <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-4 space-y-6">

            {/* Key Stats */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Dataset Overview
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <HiOutlineDocumentText className="mr-2" /> Type
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    Dataset Folder
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <FiBarChart2 className="mr-2" /> Data Files
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset?.dataFileCount || dataset?.files?.length || 0}
                    {dataset?.metadataFileCount > 0 && (
                      <span className="text-sm text-purple-600 dark:text-purple-400 ml-2">
                        +{dataset.metadataFileCount} metadata
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <HiOutlineGlobe className="mr-2" /> Size
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset?.size}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <FiCalendar className="mr-2" /> Last Updated
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset?.lastUpdated}
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset Files List */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                  Data Files ({dataset?.dataFileCount || dataset?.files?.length || 0})
                </h2>
                <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                  {dataset?.metadataFileCount > 0 && (
                    <span>{dataset.metadataFileCount} metadata file(s) available</span>
                  )}
                </div>
              </div>
              {dataset?.files && dataset.files.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {dataset.files.map((file, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedFile?.key === file.key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-surface-dark'
                        }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FiFileText className={`text-lg ${selectedFile?.key === file.key ? 'text-blue-600' : 'text-textSecondary-light dark:text-textSecondary-dark'
                            }`} />
                          <div>
                            <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                              {file.name}
                            </h3>
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                              {formatFileSize(file.size)} • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedFile?.key === file.key && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              Selected
                            </span>
                          )}
                          <FiEye className="text-textSecondary-light dark:text-textSecondary-dark" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-textSecondary-light dark:text-textSecondary-dark">No data files found in this dataset folder.</p>
              )}
            </div>

            {/* Metadata Files List */}
            {dataset?.metadataFiles && dataset.metadataFiles.length > 0 && (
              <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                  Metadata Files ({dataset.metadataFiles.length})
                </h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dataset.metadataFiles.map((file, index) => (
                    <div
                      key={`metadata-${index}`}
                      className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FiFileText className="text-lg text-purple-600 dark:text-purple-400" />
                          <div>
                            <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                              {file.name}
                            </h3>
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 mr-2">
                                Metadata
                              </span>
                              {formatFileSize(file.size)} • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Download metadata file
                              const fileUrl = `https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${file.key}`;
                              window.open(fileUrl, '_blank');
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                            title="Download metadata file"
                          >
                            <FiDownload />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Data Preview */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                  Data Preview
                </h2>
                {selectedFile && (
                  <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    Viewing: {selectedFile.name}
                  </span>
                )}
              </div>
              {selectedFile ? (
                <DataViewer
                  csvData={csvPreview}
                  isLoading={csvLoading}
                  error={csvError}
                />
              ) : (
                <div className="text-center py-8">
                  <FiFileText className="mx-auto text-4xl text-textSecondary-light dark:text-textSecondary-dark mb-4" />
                  <p className="text-textSecondary-light dark:text-textSecondary-dark">
                    Select a file from the list above to preview its contents
                  </p>
                </div>
              )}
            </div>

            {/* Data Schema Summary */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                File Summary
              </h2>
              {csvPreview && csvPreview.columns && csvPreview.columns.length > 0 && selectedFile ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">
                      Currently viewing: {selectedFile.name}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Total Columns</div>
                      <div className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">{csvPreview.columns.length}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Total Rows</div>
                      <div className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">{csvPreview.rowCount.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">File Format</div>
                      <div className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">CSV</div>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-textSecondary-light dark:text-textSecondary-dark">
                  {selectedFile ? 'Loading file information...' : 'Select a file to view its schema information.'}
                </span>
              )}
            </div>
          </div>

          {/* Right Column - Metadata and Tags */}
          <div className="lg:col-span-1 space-y-6 order-first lg:order-last">

            {/* Dataset Info */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Dataset Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                  <FiDatabase className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                  <span className="font-medium">Folder:</span>
                  <span className="ml-1">{dataset?.name}</span>
                </div>
                <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                  <FiFileText className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                  <span className="font-medium">Data Files:</span>
                  <span className="ml-1">{dataset?.dataFileCount || dataset?.files?.length || 0}</span>
                </div>
                {dataset?.metadataFileCount > 0 && (
                  <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    <FiFileText className="mr-2 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">Metadata Files:</span>
                    <span className="ml-1">{dataset.metadataFileCount}</span>
                  </div>
                )}
                <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                  <FiMap className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                  <span className="font-medium">Path:</span>
                  <span className="ml-1 text-xs font-mono bg-gray-100 dark:bg-surface-dark px-1 rounded">{dataset?.key}</span>
                </div>
              </div>
            </div>

            {/* Geographic Coverage */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Geographic Coverage
              </h2>
              <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                <FiMap className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                {dataset?.geography || 'Not specified'}
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Demographics
              </h2>
              <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                <FiUsers className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                {dataset?.demographics ? dataset.demographics.join(', ') : 'Not specified'}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {dataset?.tags && dataset.tags.length > 0 ? dataset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                  >
                    <FiTag className="mr-1" />
                    {tag}
                  </span>
                )) : (
                  <span className="text-textSecondary-light dark:text-textSecondary-dark text-sm">No tags available</span>
                )}
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Additional Information
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    Date Added
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    {dataset?.date ? formatDate(dataset.date) : 'Not available'}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    Access Level
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    {dataset?.accessLevel || 'Protected'}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    License
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    Open Data License
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Notebook Generator Modal */}
      {showNotebookGenerator && (
        <AINotebookGenerator
          isOpen={showNotebookGenerator}
          onClose={() => setShowNotebookGenerator(false)}
          availableFiles={dataset?.files ? [dataset] : []} // Pass the dataset folder instead of individual files
          projectId={dataset?.id || dataset?.key}
        />
      )}
    </div>
  );
}