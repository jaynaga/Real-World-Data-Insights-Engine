import React, { useState } from 'react';
import { FiX, FiFile, FiCloud, FiCheck, FiEye, FiGlobe } from 'react-icons/fi';

const FileSelectionModal = ({ 
  isOpen, 
  onClose, 
  provider, 
  files, 
  onFilesSelected,
  loading 
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [shareSettings, setShareSettings] = useState({
    isPublic: true,
    allowDownload: true,
    expiresAt: null
  });

  if (!isOpen) return null;

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

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...files]);
    }
  };

  const handleConfirm = () => {
    const filesWithSettings = selectedFiles.map(file => ({
      ...file,
      shareSettings,
      cloudProvider: provider.id,
      isCloudFile: true
    }));
    onFilesSelected(filesWithSettings);
    setSelectedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-card-dark rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`${provider.color} p-2 rounded-lg`}>
              <provider.icon className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                Select Files from {provider.name}
              </h2>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                Choose files to import and configure sharing settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* File List */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    ({selectedFiles.length} of {files.length} selected)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {files.map((file) => {
                const isSelected = selectedFiles.find(f => f.id === file.id);
                
                return (
                  <div
                    key={file.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleFileToggle(file)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 border-2 rounded ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}>
                        {isSelected && <FiCheck className="text-white" size={12} />}
                      </div>
                      
                      <FiFile className="text-gray-400" size={20} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark truncate">
                          {file.name}
                        </div>
                        <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                          {formatFileSize(file.size)} • {file.type}
                        </div>
                        {file.path && (
                          <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark truncate">
                            {file.path}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Preview file logic here
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Preview file"
                      >
                        <FiEye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sharing Settings Sidebar */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
              Sharing Settings
            </h3>

            <div className="space-y-4">
              {/* Public Access */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiGlobe size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark">
                    Public Access
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareSettings.isPublic}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                {shareSettings.isPublic 
                  ? 'Anyone on the platform can view and use these datasets'
                  : 'Only you can access these datasets'
                }
              </p>

              {/* Download Permission */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCloud size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark">
                    Allow Download
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareSettings.allowDownload}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                {shareSettings.allowDownload 
                  ? 'Users can download the original files'
                  : 'Users can only view data through the platform'
                }
              </p>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
                  Access Expiration (Optional)
                </label>
                <input
                  type="date"
                  value={shareSettings.expiresAt || ''}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">
                  Leave empty for permanent access
                </p>
              </div>

              {/* Selected Files Summary */}
              {selectedFiles.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map(file => (
                      <div key={file.id} className="text-xs text-textSecondary-light dark:text-textSecondary-dark truncate">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-textPrimary-light dark:text-textPrimary-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0 || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : `Import ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSelectionModal;
