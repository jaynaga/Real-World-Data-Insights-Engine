import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiFolder, FiFile, FiPlus, FiLoader } from 'react-icons/fi';
import externalStorageService from '../services/externalStorageService';
import externalDatasetIntegrationService from '../services/externalDatasetIntegrationService';

const ExternalDatasetRegistration = ({ isOpen, onClose, onDatasetRegistered }) => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadConnectedAccounts();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnectedAccounts = () => {
    const accounts = externalStorageService.getConnectedAccounts();
    setConnectedAccounts(accounts);
    
    if (accounts.length === 1) {
      setSelectedAccount(accounts[0]);
      loadFiles(accounts[0]);
    }
  };

  const loadFiles = async (account) => {
    try {
      setIsLoading(true);
      setError(null);
      const files = await externalStorageService.listExternalFiles(account.id);
      
      // Filter for dataset files only
      const datasetFiles = files.filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.csv') || 
               fileName.endsWith('.json') || 
               fileName.endsWith('.xlsx') || 
               fileName.endsWith('.tsv') || 
               fileName.endsWith('.txt');
      });
      
      setAvailableFiles(datasetFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setSelectedFiles([]);
    loadFiles(account);
  };

  const handleFileToggle = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleRegisterDatasets = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one dataset to register');
      return;
    }

    try {
      setIsRegistering(true);
      
      const { results, errors } = await externalDatasetIntegrationService.registerMultipleExternalDatasets(
        selectedFiles,
        selectedAccount.id
      );
      
      setRegistrationResult({ results, errors });
      
      if (results.length > 0) {
        onDatasetRegistered?.(results);
      }
      
    } catch (error) {
      console.error('Error registering datasets:', error);
      alert(`Failed to register datasets: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Register External Datasets
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select datasets from your external storage to add to the platform
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {connectedAccounts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <FiFolder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No external storage accounts connected
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Connect your cloud storage accounts first to register datasets
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Account Selector */}
            {connectedAccounts.length > 1 && (
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Storage Accounts
                </h3>
                <div className="space-y-2">
                  {connectedAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        selectedAccount?.id === account.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
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
              </div>
            )}

            {/* File Selection */}
            <div className="flex-1 flex flex-col">
              {selectedAccount && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedAccount.providerIcon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedAccount.accountName}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFiles.length} of {availableFiles.length} selected
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading datasets...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
                    <button
                      onClick={() => loadFiles(selectedAccount)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : availableFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FiFile className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No dataset files found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Supported formats: CSV, JSON, Excel, TSV, TXT
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableFiles.map((file) => {
                      const isSelected = selectedFiles.some(f => f.id === file.id);
                      
                      return (
                        <div
                          key={file.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => handleFileToggle(file)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                            </div>
                            
                            <FiFile className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)} • Modified {new Date(file.modifiedTime).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {availableFiles.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegisterDatasets}
                      disabled={selectedFiles.length === 0 || isRegistering}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegistering ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <FiPlus className="w-4 h-4" />
                          Register {selectedFiles.length} Dataset{selectedFiles.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration Result Modal */}
        {registrationResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full m-4">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registration Complete
                </h3>
              </div>
              
              <div className="p-6">
                {registrationResult.results.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <p className="text-green-800 dark:text-green-300">
                      Successfully registered {registrationResult.results.length} dataset(s)
                    </p>
                  </div>
                )}
                
                {registrationResult.errors.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-red-800 dark:text-red-300 mb-2">
                      Failed to register {registrationResult.errors.length} dataset(s):
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {registrationResult.errors.map((error, index) => (
                        <li key={index}>• {error.dataset}: {error.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    setRegistrationResult(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalDatasetRegistration;
