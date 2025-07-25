import React, { useState, useEffect } from 'react';
import { FiShare2, FiLink, FiUsers, FiGlobe, FiEye, FiDownload, FiCopy, FiSettings, FiTrash2, FiX, FiCheck, FiClock } from 'react-icons/fi';
import datasetSharingService from '../services/datasetSharingService';

const DatasetSharingModal = ({ isOpen, onClose, dataset }) => {
  const [shareType, setShareType] = useState('private');
  const [allowedUsers, setAllowedUsers] = useState(['']);
  const [permissions, setPermissions] = useState({
    canView: true,
    canDownload: false,
    canCopy: false,
    canAnalyze: true
  });
  const [description, setDescription] = useState('');
  const [expirationDays, setExpirationDays] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState(null);
  const [myShares, setMyShares] = useState([]);
  const [isLoadingShares, setIsLoadingShares] = useState(true);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    if (isOpen) {
      loadMyShares();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyShares = async () => {
    try {
      setIsLoadingShares(true);
      const shares = await datasetSharingService.listMyShares();
      // Filter shares for this specific dataset
      const datasetShares = shares.filter(share => share.datasetId === dataset?.id);
      setMyShares(datasetShares);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleAddUser = () => {
    setAllowedUsers([...allowedUsers, '']);
  };

  const handleRemoveUser = (index) => {
    const updated = allowedUsers.filter((_, i) => i !== index);
    setAllowedUsers(updated.length === 0 ? [''] : updated);
  };

  const handleUserChange = (index, value) => {
    const updated = [...allowedUsers];
    updated[index] = value;
    setAllowedUsers(updated);
  };

  const handlePermissionChange = (permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const handleCreateShare = async () => {
    try {
      setIsSharing(true);
      
      const shareConfig = {
        datasetId: dataset.id,
        dataset: dataset,
        shareType,
        allowedUsers: shareType === 'private' ? allowedUsers.filter(email => email.trim()) : [],
        permissions,
        description,
        expiresAt: expirationDays ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000) : null
      };

      const result = await datasetSharingService.shareDataset(shareConfig);
      setShareResult(result);
      await loadMyShares(); // Refresh the shares list
    } catch (error) {
      console.error('Error creating share:', error);
      alert(`Error creating share: ${error.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this share? Users will no longer be able to access the dataset.')) {
      return;
    }

    try {
      await datasetSharingService.revokeShare(shareId);
      await loadMyShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      alert(`Error revoking share: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const resetForm = () => {
    setShareType('private');
    setAllowedUsers(['']);
    setPermissions({
      canView: true,
      canDownload: false,
      canCopy: false,
      canAnalyze: true
    });
    setDescription('');
    setExpirationDays('');
    setShareResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiShare2 className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Share Dataset
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dataset?.name || 'Untitled Dataset'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'create'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Create Share
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'manage'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Manage Shares ({myShares.length})
            </button>
          </div>
        </div>

        {activeTab === 'create' && (
          <div className="p-6">
            {shareResult ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FiCheck className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-800 dark:text-green-300">
                    Dataset Shared Successfully!
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700 dark:text-green-400">Share URL:</span>
                    <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-sm flex-1">
                      {shareResult.shareUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(shareResult.shareUrl)}
                      className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Another Share
                    </button>
                    <button
                      onClick={() => setActiveTab('manage')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Manage Shares
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Share Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Share Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setShareType('private')}
                      className={`p-4 border rounded-lg text-left ${
                        shareType === 'private'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FiUsers className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Private</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Share with specific users by email
                      </p>
                    </button>

                    <button
                      onClick={() => setShareType('link')}
                      className={`p-4 border rounded-lg text-left ${
                        shareType === 'link'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FiLink className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Link</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Anyone with the link can access
                      </p>
                    </button>

                    <button
                      onClick={() => setShareType('public')}
                      className={`p-4 border rounded-lg text-left ${
                        shareType === 'public'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FiGlobe className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">Public</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Discoverable by everyone
                      </p>
                    </button>
                  </div>
                </div>

                {/* User List for Private Sharing */}
                {shareType === 'private' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Allowed Users
                    </label>
                    <div className="space-y-2">
                      {allowedUsers.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleUserChange(index, e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                          {allowedUsers.length > 1 && (
                            <button
                              onClick={() => handleRemoveUser(index)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddUser}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + Add another user
                      </button>
                    </div>
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.canView}
                        onChange={(e) => handlePermissionChange('canView', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <FiEye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.canDownload}
                        onChange={(e) => handlePermissionChange('canDownload', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <FiDownload className="w-4 h-4" />
                        <span className="text-sm">Download</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.canCopy}
                        onChange={(e) => handlePermissionChange('canCopy', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <FiCopy className="w-4 h-4" />
                        <span className="text-sm">Copy</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.canAnalyze}
                        onChange={(e) => handlePermissionChange('canAnalyze', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <FiSettings className="w-4 h-4" />
                        <span className="text-sm">Analyze</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this share..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiration (Optional)
                  </label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Never expires</option>
                    <option value="1">1 day</option>
                    <option value="7">1 week</option>
                    <option value="30">1 month</option>
                    <option value="90">3 months</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                {/* Create Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShare}
                    disabled={isSharing || (shareType === 'private' && !allowedUsers.some(email => email.trim()))}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSharing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiShare2 className="w-4 h-4" />
                        Create Share
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Existing Shares
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage all shares for "{dataset?.name}"
              </p>
            </div>

            {isLoadingShares ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : myShares.length === 0 ? (
              <div className="text-center py-8">
                <FiShare2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No shares created for this dataset yet.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Share
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myShares.map((share) => (
                  <div key={share.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {share.shareType === 'public' && <FiGlobe className="w-4 h-4 text-orange-600" />}
                          {share.shareType === 'link' && <FiLink className="w-4 h-4 text-green-600" />}
                          {share.shareType === 'private' && <FiUsers className="w-4 h-4 text-blue-600" />}
                          <span className="font-medium capitalize">{share.shareType} Share</span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {share.accessCount || 0} accesses
                          </span>
                        </div>
                        
                        {share.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {share.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Created {new Date(share.createdAt).toLocaleDateString()}</span>
                          {share.expiresAt && (
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              Expires {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                          {share.lastAccessedAt && (
                            <span>Last accessed {new Date(share.lastAccessedAt).toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs flex-1">
                            {window.location.origin}/shared/{share.id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/shared/${share.id}`)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeShare(share.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Revoke Share"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetSharingModal;
