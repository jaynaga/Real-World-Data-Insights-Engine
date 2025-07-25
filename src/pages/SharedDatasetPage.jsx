import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShare2, FiUser, FiCalendar, FiEye, FiDownload, FiArrowLeft, FiAlertCircle, FiDatabase, FiUsers, FiLink, FiGlobe } from 'react-icons/fi';
import datasetSharingService from '../services/datasetSharingService';

const SharedDatasetPage = () => {
  const { shareId } = useParams();
  const [shareData, setShareData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datasetContent, setDatasetContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSharedDataset();
  }, [shareId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSharedDataset = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await datasetSharingService.getSharedDataset(shareId);
      setShareData(result);
    } catch (error) {
      console.error('Error loading shared dataset:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatasetContent = async () => {
    if (!shareData?.share?.permissions?.canView) {
      setError('You do not have permission to view this dataset');
      return;
    }

    try {
      setIsLoadingContent(true);
      const content = await datasetSharingService.getSharedDatasetContent(shareId);
      setDatasetContent(content);
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading dataset content:', error);
      setError(error.message);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleDownload = async () => {
    if (!shareData?.share?.permissions?.canDownload) {
      alert('Download permission not granted for this dataset');
      return;
    }

    try {
      const content = await datasetSharingService.getSharedDatasetContent(shareId);
      const blob = new Blob([content.content.Body], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = content.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading dataset:', error);
      alert(`Error downloading dataset: ${error.message}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getShareTypeIcon = (shareType) => {
    switch (shareType) {
      case 'public':
        return <FiGlobe className="w-5 h-5 text-orange-600" />;
      case 'link':
        return <FiLink className="w-5 h-5 text-green-600" />;
      case 'private':
        return <FiUsers className="w-5 h-5 text-blue-600" />;
      default:
        return <FiShare2 className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared dataset...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const share = shareData?.share;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {getShareTypeIcon(share?.shareType)}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {share?.datasetName || 'Shared Dataset'}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {share?.shareType} Share
                    </p>
                  </div>
                </div>

                {share?.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {share.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiUser className="w-4 h-4" />
                    <span>Shared by {share?.ownerEmail}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiCalendar className="w-4 h-4" />
                    <span>
                      Shared {share?.createdAt ? new Date(share.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiDatabase className="w-4 h-4" />
                    <span>
                      {formatFileSize(share?.metadata?.datasetSize)} • {share?.metadata?.fileCount || 'Unknown'} files
                    </span>
                  </div>
                </div>

                {/* Permissions Display */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Permissions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {share?.permissions?.canView && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                        <FiEye className="w-3 h-3" />
                        View
                      </span>
                    )}
                    {share?.permissions?.canDownload && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                        <FiDownload className="w-3 h-3" />
                        Download
                      </span>
                    )}
                    {share?.permissions?.canCopy && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 text-xs rounded-full">
                        Copy
                      </span>
                    )}
                    {share?.permissions?.canAnalyze && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 text-xs rounded-full">
                        Analyze
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {share?.permissions?.canView && (
                    <button
                      onClick={loadDatasetContent}
                      disabled={isLoadingContent}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingContent ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <FiEye className="w-4 h-4" />
                          Preview Dataset
                        </>
                      )}
                    </button>
                  )}

                  {share?.permissions?.canDownload && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FiDownload className="w-4 h-4" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Preview */}
        {showPreview && datasetContent && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dataset Preview
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {datasetContent.fileName} • {formatFileSize(datasetContent.size)}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {datasetContent.content.Body ? 
                  datasetContent.content.Body.slice(0, 5000) + 
                  (datasetContent.content.Body.length > 5000 ? '\n\n... (truncated)' : '')
                  : 'Content not available'
                }
              </pre>
            </div>

            {datasetContent.content.Body && datasetContent.content.Body.length > 5000 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Showing first 5,000 characters. {share?.permissions?.canDownload && 'Download the full dataset to see all content.'}
              </p>
            )}
          </div>
        )}

        {/* Expiration Warning */}
        {share?.expiresAt && new Date(share.expiresAt) > new Date() && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-300">
                This share will expire on {new Date(share.expiresAt).toLocaleDateString()} at {new Date(share.expiresAt).toLocaleTimeString()}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedDatasetPage;
