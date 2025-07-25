import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShare2, FiUsers, FiLink, FiGlobe, FiEye, FiCopy, FiTrash2, FiCalendar, FiClock } from 'react-icons/fi';
import datasetSharingService from '../services/datasetSharingService';

const MySharesList = () => {
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allShares = await datasetSharingService.listMyShares();
      setShares(allShares);
    } catch (error) {
      console.error('Error loading shares:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this share?')) {
      return;
    }

    try {
      await datasetSharingService.revokeShare(shareId);
      await loadShares(); // Refresh the list
    } catch (error) {
      console.error('Error revoking share:', error);
      alert(`Error revoking share: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getShareTypeIcon = (shareType) => {
    switch (shareType) {
      case 'public':
        return <FiGlobe className="w-4 h-4 text-orange-600" />;
      case 'link':
        return <FiLink className="w-4 h-4 text-green-600" />;
      case 'private':
        return <FiUsers className="w-4 h-4 text-blue-600" />;
      default:
        return <FiShare2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">Error loading shares: {error}</p>
        <button
          onClick={loadShares}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="text-center py-8">
        <FiShare2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">No shared datasets yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Share datasets from the dataset overview page to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => (
        <div
          key={share.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getShareTypeIcon(share.shareType)}
                <Link
                  to={`/explore/${share.datasetId}`}
                  className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {share.datasetName}
                </Link>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                  {share.shareType}
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                  {share.accessCount || 0} accesses
                </span>
              </div>

              {share.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {share.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  Created {formatDate(share.createdAt)}
                </span>
                {share.expiresAt && (
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    Expires {formatDate(share.expiresAt)}
                  </span>
                )}
                {share.lastAccessedAt && (
                  <span>Last accessed {formatDate(share.lastAccessedAt)}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs flex-1 truncate">
                  {window.location.origin}/shared/{share.id}
                </code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/shared/${share.id}`)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Copy share link"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
                <Link
                  to={`/shared/${share.id}`}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="View shared dataset"
                >
                  <FiEye className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleRevokeShare(share.id)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Revoke share"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySharesList;
