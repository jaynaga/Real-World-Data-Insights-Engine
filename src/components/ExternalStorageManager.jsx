import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiX, FiDatabase } from 'react-icons/fi';
import externalStorageService from '../services/externalStorageService';
import ExternalDatasetRegistration from './ExternalDatasetRegistration';

const ExternalStorageManager = ({ isOpen, onClose, onDatasetRegistered }) => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(null);
  const [credentialForm, setCredentialForm] = useState({});
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setConnectedAccounts(externalStorageService.getConnectedAccounts());
    setAvailableProviders(externalStorageService.getStorageProviders());
  };

  const isProviderConfigured = (provider) => {
    if (provider.requiresCredentials) return true;
    // Check if OAuth provider has valid client ID
    return provider.clientId && !provider.clientId.startsWith('DEMO_');
  };

  const handleConnectProvider = async (provider) => {
    if (provider.requiresCredentials) {
      setShowCredentialForm(provider);
      setCredentialForm({});
      return;
    }

    try {
      setIsConnecting(true);
      const connection = await externalStorageService.initiateOAuthFlow(provider.id);
      
      const savedConnection = {
        ...connection,
        providerId: provider.id,
        providerName: provider.name,
        providerIcon: provider.icon
      };
      
      externalStorageService.saveStorageConnection(savedConnection);
      loadData();
    } catch (error) {
      console.error('Error connecting provider:', error);
      
      // Show user-friendly error message
      let errorMessage = error.message;
      if (error.message.includes('not configured')) {
        errorMessage = `${provider.name} integration requires setup. Please configure OAuth credentials in the .env file. See .env.example for instructions.`;
      }
      
      alert(`Failed to connect ${provider.name}: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCredentialSubmit = () => {
    const provider = showCredentialForm;
    
    const connection = {
      providerId: provider.id,
      providerName: provider.name,
      providerIcon: provider.icon,
      accountName: credentialForm.accountName || `${provider.name} Account`,
      credentials: credentialForm,
      accessToken: credentialForm.accessToken || credentialForm.connectionString,
      userId: 'manual_user'
    };

    try {
      externalStorageService.saveStorageConnection(connection);
      setShowCredentialForm(null);
      setCredentialForm({});
      loadData();
    } catch (error) {
      console.error('Error saving credentials:', error);
      alert('Failed to save connection credentials');
    }
  };

  const handleRemoveConnection = (connectionId) => {
    if (window.confirm('Are you sure you want to remove this storage connection?')) {
      try {
        externalStorageService.removeStorageConnection(connectionId);
        loadData();
      } catch (error) {
        console.error('Error removing connection:', error);
        alert('Failed to remove connection');
      }
    }
  };

  const renderCredentialForm = (provider) => {
    switch (provider.id) {
      case 'azure_blob':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Name</label>
              <input
                type="text"
                value={credentialForm.accountName || ''}
                onChange={(e) => setCredentialForm({...credentialForm, accountName: e.target.value})}
                placeholder="My Azure Storage"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Connection String</label>
              <textarea
                value={credentialForm.connectionString || ''}
                onChange={(e) => setCredentialForm({...credentialForm, connectionString: e.target.value})}
                placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Container Name</label>
              <input
                type="text"
                value={credentialForm.containerName || ''}
                onChange={(e) => setCredentialForm({...credentialForm, containerName: e.target.value})}
                placeholder="datasets"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>
        );

      case 'aws_s3':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Name</label>
              <input
                type="text"
                value={credentialForm.accountName || ''}
                onChange={(e) => setCredentialForm({...credentialForm, accountName: e.target.value})}
                placeholder="My S3 Bucket"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Access Key ID</label>
              <input
                type="text"
                value={credentialForm.accessKeyId || ''}
                onChange={(e) => setCredentialForm({...credentialForm, accessKeyId: e.target.value})}
                placeholder="AKIA..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secret Access Key</label>
              <input
                type="password"
                value={credentialForm.secretAccessKey || ''}
                onChange={(e) => setCredentialForm({...credentialForm, secretAccessKey: e.target.value})}
                placeholder="Secret key..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bucket Name</label>
              <input
                type="text"
                value={credentialForm.bucketName || ''}
                onChange={(e) => setCredentialForm({...credentialForm, bucketName: e.target.value})}
                placeholder="my-datasets-bucket"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <input
                type="text"
                value={credentialForm.region || ''}
                onChange={(e) => setCredentialForm({...credentialForm, region: e.target.value})}
                placeholder="us-east-1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>
        );

      case 'ftp':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Name</label>
              <input
                type="text"
                value={credentialForm.accountName || ''}
                onChange={(e) => setCredentialForm({...credentialForm, accountName: e.target.value})}
                placeholder="My FTP Server"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Host</label>
              <input
                type="text"
                value={credentialForm.host || ''}
                onChange={(e) => setCredentialForm({...credentialForm, host: e.target.value})}
                placeholder="ftp.example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Port</label>
              <input
                type="number"
                value={credentialForm.port || ''}
                onChange={(e) => setCredentialForm({...credentialForm, port: e.target.value})}
                placeholder="21"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={credentialForm.username || ''}
                onChange={(e) => setCredentialForm({...credentialForm, username: e.target.value})}
                placeholder="username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={credentialForm.password || ''}
                onChange={(e) => setCredentialForm({...credentialForm, password: e.target.value})}
                placeholder="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>
        );

      default:
        return <div>Unsupported provider configuration</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                External Storage Connections
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your cloud storage accounts to share datasets without uploading them to our platform
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

        <div className="p-6">
          {/* Connected Accounts */}
          {connectedAccounts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Connected Accounts
              </h3>
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{account.providerIcon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {account.accountName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {account.providerName} • Connected {new Date(account.connectedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCheck className="w-5 h-5 text-green-600" />
                      <button
                        onClick={() => handleRemoveConnection(account.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Register Datasets Button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowRegistration(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiDatabase className="w-5 h-5" />
                  Register Datasets from Connected Storage
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                  Select datasets from your connected storage accounts to add to the platform
                </p>
              </div>
            </div>
          )}

          {/* Available Providers */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Available Storage Providers
            </h3>
            
            {/* Configuration Notice */}
            {availableProviders.some(p => !isProviderConfigured(p)) && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 dark:text-blue-400 mt-1">ℹ️</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">OAuth Setup Required</p>
                    <p>Some providers require OAuth configuration. See <code>.env.example</code> for setup instructions.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableProviders.map((provider) => {
                const isConnected = connectedAccounts.some(acc => acc.providerId === provider.id);
                const isConfigured = isProviderConfigured(provider);
                
                return (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      !isConfigured
                        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 cursor-not-allowed'
                        : isConnected
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
                    }`}
                    onClick={() => isConfigured && !isConnected && handleConnectProvider(provider)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{provider.icon}</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </div>
                    </div>
                    
                    {!isConfigured ? (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠️ Requires OAuth setup
                      </div>
                    ) : isConnected ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <FiCheck className="w-4 h-4" />
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <FiPlus className="w-4 h-4" />
                        {provider.requiresCredentials ? 'Setup Credentials' : 'Connect Account'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credential Form Modal */}
          {showCredentialForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full m-4">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Connect {showCredentialForm.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your credentials to connect this storage provider
                  </p>
                </div>
                
                <div className="p-6">
                  {renderCredentialForm(showCredentialForm)}
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCredentialForm(null)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCredentialSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* External Dataset Registration Modal */}
      <ExternalDatasetRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onDatasetRegistered={(datasets) => {
          console.log('Datasets registered:', datasets);
          onDatasetRegistered?.(datasets);
          setShowRegistration(false);
        }}
      />
    </div>
  );
};

export default ExternalStorageManager;
