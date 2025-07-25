import React, { useState } from 'react';
import { FiUpload, FiLink, FiCloud, FiHardDrive, FiX } from 'react-icons/fi';
import ExternalStorageManager from './ExternalStorageManager';
import ExternalDatasetBrowser from './ExternalDatasetBrowser';

const UploadMethodSelector = ({ isOpen, onClose, onInternalUpload, onDatasetRegistered }) => {
  const [showExternalManager, setShowExternalManager] = useState(false);
  const [showExternalBrowser, setShowExternalBrowser] = useState(false);

  const handleInternalUpload = () => {
    onClose();
    onInternalUpload?.();
  };

  const handleExternalUpload = () => {
    setShowExternalManager(true);
  };

  const handleBrowseExternal = () => {
    setShowExternalBrowser(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Dataset
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose how you'd like to add your dataset to the platform
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Internal Upload Option */}
              <button
                onClick={handleInternalUpload}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FiUpload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Upload Files
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Traditional file upload
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <FiHardDrive className="w-4 h-4" />
                    <span>Upload from your computer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCloud className="w-4 h-4" />
                    <span>Stored in platform storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>Full platform features available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>File size limits apply</span>
                  </div>
                </div>
              </button>

              {/* External Storage Option */}
              <button
                onClick={handleExternalUpload}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FiLink className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Connect External Storage
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Link your cloud storage
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>📁</span>
                    <span>Google Drive, Dropbox, OneDrive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔷</span>
                    <span>Azure, AWS S3, FTP servers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>Data stays in your storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>•</span>
                    <span>No file size limits</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Browse Existing External Datasets */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleBrowseExternal}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiCloud className="w-5 h-5" />
                  <span>Browse existing external datasets</span>
                </div>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Which option should I choose?
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p><strong>Upload Files:</strong> Best for smaller datasets (&lt;100MB) that you want to store on our platform for maximum performance.</p>
                <p><strong>External Storage:</strong> Ideal for large datasets, sensitive data, or when you want to maintain control over your data storage.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Storage Manager Modal */}
      <ExternalStorageManager
        isOpen={showExternalManager}
        onClose={() => setShowExternalManager(false)}
        onDatasetRegistered={onDatasetRegistered}
      />

      {/* External Dataset Browser Modal */}
      <ExternalDatasetBrowser
        isOpen={showExternalBrowser}
        onClose={() => setShowExternalBrowser(false)}
      />
    </>
  );
};

export default UploadMethodSelector;
