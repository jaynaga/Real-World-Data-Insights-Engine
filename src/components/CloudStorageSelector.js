import React, { useState, useEffect } from 'react';
import { FiCloud, FiDatabase, FiHardDrive, FiServer, FiFolder, FiCheck, FiX, FiRefreshCw, FiEye, FiUpload, FiFile } from 'react-icons/fi';

const cloudProviders = [
  {
    id: 'googledrive',
    name: 'Google Drive',
    icon: FiCloud,
    color: 'bg-blue-500',
    description: 'Connect to your Google Drive files',
    authUrl: 'https://accounts.google.com/oauth/authorize',
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  },
  {
    id: 's3',
    name: 'Amazon S3',
    icon: FiDatabase,
    color: 'bg-orange-500',
    description: 'Connect to your AWS S3 buckets',
    requiresConfig: true
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: FiFolder,
    color: 'bg-blue-600',
    description: 'Connect to your Dropbox files',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    scopes: ['files.metadata.read', 'files.content.read']
  },
  {
    id: 'azure',
    name: 'Azure Storage',
    icon: FiServer,
    color: 'bg-blue-700',
    description: 'Connect to Azure Blob Storage',
    requiresConfig: true
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: FiHardDrive,
    color: 'bg-blue-400',
    description: 'Connect to your Microsoft OneDrive',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scopes: ['https://graph.microsoft.com/Files.Read']
  }
];

const CloudStorageSelector = ({ onFilesSelected, onError }) => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [connectedProviders, setConnectedProviders] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Check for existing connections on component mount
  const checkExistingConnections = async () => {
    try {
      // Check localStorage for stored tokens/connections
      const connections = {};
      cloudProviders.forEach(provider => {
        const token = localStorage.getItem(`${provider.id}_access_token`);
        const expiry = localStorage.getItem(`${provider.id}_token_expiry`);
        
        if (token && (!expiry || new Date(expiry) > new Date())) {
          connections[provider.id] = true;
        }
      });
      
      setConnectedProviders(connections);
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  useEffect(() => {
    checkExistingConnections();
  }, []);

  const handleProviderConnect = async (provider) => {
    setLoading(true);
    setSelectedProvider(provider.id);

    try {
      if (provider.requiresConfig) {
        // For S3 and Azure, show configuration form
        await showConfigurationModal(provider);
      } else {
        // For OAuth providers (Google Drive, Dropbox, OneDrive)
        await initiateOAuth(provider);
      }
    } catch (error) {
      console.error(`Error connecting to ${provider.name}:`, error);
      onError(`Failed to connect to ${provider.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = (provider) => {
    return new Promise((resolve, reject) => {
      const clientIds = {
        googledrive: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        dropbox: process.env.REACT_APP_DROPBOX_CLIENT_ID,
        onedrive: process.env.REACT_APP_MICROSOFT_CLIENT_ID
      };

      const clientId = clientIds[provider.id];
      if (!clientId) {
        reject(new Error(`${provider.name} client ID not configured`));
        return;
      }

      const redirectUri = `${window.location.origin}/oauth-callback`;
      const state = `${provider.id}_${Date.now()}`;
      
      let authUrl = '';
      switch (provider.id) {
        case 'googledrive':
          authUrl = `https://accounts.google.com/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(provider.scopes.join(' '))}&` +
            `response_type=code&` +
            `state=${state}`;
          break;
        case 'dropbox':
          authUrl = `https://www.dropbox.com/oauth2/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `state=${state}`;
          break;
        case 'onedrive':
          authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(provider.scopes.join(' '))}&` +
            `response_type=code&` +
            `state=${state}`;
          break;
        default:
          reject(new Error(`Unknown provider: ${provider.id}`));
          return;
      }

      // Store state for verification
      localStorage.setItem('oauth_state', state);
      
      // Open OAuth window
      const popup = window.open(authUrl, 'oauth', 'width=500,height=600');
      
      // Listen for oauth completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check if we got a token
          const token = localStorage.getItem(`${provider.id}_access_token`);
          if (token) {
            setConnectedProviders(prev => ({ ...prev, [provider.id]: true }));
            loadProviderFiles(provider.id);
            resolve();
          } else {
            reject(new Error('OAuth authorization cancelled or failed'));
          }
        }
      }, 1000);
    });
  };

  const showConfigurationModal = async (provider) => {
    // This would show a modal for S3/Azure configuration
    // For now, we'll simulate the connection
    return new Promise((resolve) => {
      const config = prompt(`Enter your ${provider.name} configuration (simplified for demo):`);
      if (config) {
        localStorage.setItem(`${provider.id}_config`, config);
        setConnectedProviders(prev => ({ ...prev, [provider.id]: true }));
        loadProviderFiles(provider.id);
        resolve();
      }
    });
  };

  const loadProviderFiles = async (providerId) => {
    setLoading(true);
    try {
      // Mock file loading - in production, this would call the respective APIs
      const mockFiles = [
        { id: '1', name: 'dataset1.csv', size: 1024000, type: 'text/csv', path: '/data/dataset1.csv' },
        { id: '2', name: 'patient_data.xlsx', size: 2048000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', path: '/medical/patient_data.xlsx' },
        { id: '3', name: 'survey_results.json', size: 512000, type: 'application/json', path: '/surveys/survey_results.json' },
        { id: '4', name: 'sensor_data.csv', size: 3072000, type: 'text/csv', path: '/iot/sensor_data.csv' },
        { id: '5', name: 'financial_records.csv', size: 1536000, type: 'text/csv', path: '/finance/financial_records.csv' }
      ];

      setAvailableFiles(mockFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      onError(`Failed to load files from ${providerId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileToggle = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.find(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleImportSelected = async () => {
    if (selectedFiles.length === 0) {
      onError('Please select at least one file to import');
      return;
    }

    setLoading(true);
    try {
      // In production, this would download/proxy the files from the cloud provider
      const fileObjects = selectedFiles.map(file => ({
        ...file,
        cloudProvider: selectedProvider,
        isCloudFile: true,
        downloadUrl: `cloud://${selectedProvider}/${file.path}`
      }));

      onFilesSelected(fileObjects);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error importing files:', error);
      onError('Failed to import selected files');
    } finally {
      setLoading(false);
    }
  };

  const disconnectProvider = (providerId) => {
    localStorage.removeItem(`${providerId}_access_token`);
    localStorage.removeItem(`${providerId}_token_expiry`);
    localStorage.removeItem(`${providerId}_config`);
    
    setConnectedProviders(prev => {
      const updated = { ...prev };
      delete updated[providerId];
      return updated;
    });

    if (selectedProvider === providerId) {
      setSelectedProvider(null);
      setAvailableFiles([]);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FiCloud className="text-accent-light dark:text-accent-dark" />
        <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
          Import from Cloud Storage
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cloudProviders.map((provider) => {
          const Icon = provider.icon;
          const isConnected = connectedProviders[provider.id];
          
          return (
            <div key={provider.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${provider.color} p-2 rounded-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                    {provider.name}
                  </h3>
                  {isConnected && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <FiCheck size={14} />
                      Connected
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-3">
                {provider.description}
              </p>
              
              <div className="flex gap-2">
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        loadProviderFiles(provider.id);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <FiEye size={14} />
                      Browse
                    </button>
                    <button
                      type="button"
                      onClick={() => disconnectProvider(provider.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleProviderConnect(provider)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-textPrimary-light dark:text-textPrimary-dark text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loading && selectedProvider === provider.id ? (
                      <FiRefreshCw className="animate-spin mx-auto" size={14} />
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* File Browser */}
      {selectedProvider && availableFiles.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
              Available Files ({availableFiles.length})
            </h3>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiUpload size={14} />
                Import {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {availableFiles.map((file) => {
              const isSelected = selectedFiles.find(f => f.id === file.id);
              
              return (
                <div
                  key={file.id}
                  className={`p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleFileToggle(file)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } flex items-center justify-center`}>
                      {isSelected && <FiCheck className="text-white" size={10} />}
                    </div>
                    
                    <FiFile className="text-gray-400" size={16} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark truncate">
                        {file.name}
                      </div>
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                        {formatFileSize(file.size)} • {file.type}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && !availableFiles.length && (
        <div className="text-center py-8">
          <FiRefreshCw className="animate-spin mx-auto mb-2 text-gray-400" size={24} />
          <p className="text-textSecondary-light dark:text-textSecondary-dark">
            Loading files...
          </p>
        </div>
      )}
    </div>
  );
};

export default CloudStorageSelector;
