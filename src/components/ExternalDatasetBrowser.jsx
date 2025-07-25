import React, { useState, useEffect } from 'react';
import { FiFolder, FiFile, FiShare2, FiCopy, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import externalStorageService from '../services/externalStorageService';

const ExternalDatasetBrowser = ({ isOpen, onClose }) => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [error, setError] = useState(null);
  const [shareResult, setShareResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadConnectedAccounts();
    }
  }, [isOpen]);

  const loadConnectedAccounts = () => {
    const accounts = externalStorageService.getConnectedAccounts();
    setConnectedAccounts(accounts);
    
    if (accounts.length === 1) {
      setSelectedAccount(accounts[0]);
    }
  };

  const loadFiles = async (accountId, path = '/') => {
    try {
      setIsLoading(true);
      setError(null);
      const fileList = await externalStorageService.listExternalFiles(accountId, path);
      setFiles(fileList);
      setCurrentPath(path);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setFiles([]);
    setCurrentPath('/');
    setError(null);
    loadFiles(account.id);
  };

  const handleRefresh = () => {
    if (selectedAccount) {
      loadFiles(selectedAccount.id, currentPath);
    }
  };

  const handleShareFile = async (file) => {
    try {
      const result = await externalStorageService.getExternalFileShareLink(
        selectedAccount.id,
        file.id,
        file.name
      );
      
      setShareResult({
        ...result,
        fileName: file.name,
        provider: selectedAccount.providerName
      });
    } catch (error) {
      console.error('Error sharing file:', error);
      alert(`Failed to share file: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const isDatasetFile = (fileName) => {
    const datasetExtensions = ['.csv', '.json', '.xlsx', '.tsv', '.parquet', '.txt'];
    return datasetExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Browse External Datasets
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse and share datasets from your connected storage accounts
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Account Selector Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Storage Accounts
            </h3>
            
            {connectedAccounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No connected accounts. Connect storage providers first.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{account.providerIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {account.accountName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {account.providerName}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Browser */}
          <div className="flex-1 flex flex-col">
            {selectedAccount && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedAccount.providerIcon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedAccount.accountName}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentPath === '/' ? 'Root' : currentPath}
                    </span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedAccount ? (
                <div className="text-center py-12">
                  <FiFolder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a storage account to browse files
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading files...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12">
                  <FiFile className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No files found in this location
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FiFile className={`w-5 h-5 flex-shrink-0 ${
                          isDatasetFile(file.name) ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)} • Modified {formatDate(file.modifiedTime)}
                          </div>
                        </div>
                      </div>

                      {isDatasetFile(file.name) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShareFile(file)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <FiShare2 className="w-4 h-4" />
                            Share
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Result Modal */}
        {shareResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full m-4">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dataset Shared Successfully!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {shareResult.fileName} from {shareResult.provider}
                </p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share URL
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm">
                      {shareResult.shareUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(shareResult.shareUrl)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> This dataset is shared directly from your {shareResult.provider} account. 
                    The platform accesses it through your connected storage without copying the data to our servers.
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                <button
                  onClick={() => setShareResult(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    copyToClipboard(shareResult.shareUrl);
                    setShareResult(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalDatasetBrowser;
