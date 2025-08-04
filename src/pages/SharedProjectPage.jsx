import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiUser, FiCalendar, FiDatabase, FiAlertCircle, FiEye, FiEdit, 
  FiDownload, FiCopy, FiFolderPlus 
} from 'react-icons/fi';
import projectSharingService from '../services/projectSharingService';

const SharedProjectPage = () => {
  const { shareId } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSharedProject();
  }, [shareId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSharedProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await projectSharingService.getSharedProject(shareId);
      setShareData(data);
    } catch (error) {
      console.error('Error loading shared project:', error);
      setError(error.message || 'Failed to load shared project');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'canView':
        return <FiEye className="w-4 h-4" />;
      case 'canEdit':
        return <FiEdit className="w-4 h-4" />;
      case 'canDownload':
        return <FiDownload className="w-4 h-4" />;
      case 'canCopy':
        return <FiCopy className="w-4 h-4" />;
      case 'canManageDatasets':
        return <FiFolderPlus className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'canView':
        return 'View Project';
      case 'canEdit':
        return 'Edit Project';
      case 'canDownload':
        return 'Download Files';
      case 'canCopy':
        return 'Copy Project';
      case 'canManageDatasets':
        return 'Manage Datasets';
      default:
        return permission;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared project...</p>
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FiDatabase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {share?.projectTitle}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      share?.shareType === 'public' 
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                        : share?.shareType === 'link'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                      {share?.shareType} share
                    </span>
                    {share?.metadata?.projectStatus && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize">
                        {share.metadata.projectStatus}
                      </span>
                    )}
                  </div>
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
                    Shared {share?.createdAt ? formatDate(share.createdAt) : 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FiDatabase className="w-4 h-4" />
                  <span>
                    {share?.metadata?.datasetCount || 0} datasets
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 ml-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Permissions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {share?.permissions && Object.entries(share.permissions).map(([permission, granted]) => (
              <div
                key={permission}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  granted
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <div className={`${granted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {getPermissionIcon(permission)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${
                    granted 
                      ? 'text-green-800 dark:text-green-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getPermissionLabel(permission)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Content
            </h2>
            {share?.permissions?.canView && (
              <Link
                to={`/projects/${share.projectId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEye className="w-4 h-4" />
                View Full Project
              </Link>
            )}
          </div>

          {share?.permissions?.canView ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {share?.metadata?.datasetCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Datasets</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {share?.accessCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {share?.metadata?.createdAt ? formatDate(share.metadata.createdAt) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {share?.metadata?.lastModified ? formatDate(share.metadata.lastModified) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Last Modified</div>
                </div>
              </div>

              {share?.permissions?.canView && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    <strong>Note:</strong> This is a shared view of the project. Your available actions depend on the permissions granted by the project owner.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiAlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Limited Access
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to view the full project content. Contact the project owner for additional access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedProjectPage;
