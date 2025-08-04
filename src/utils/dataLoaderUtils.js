import { loadCsvDataset } from './storageUtils';
import { streamKaggleCsvData } from '../services/kaggleService';

/**
 * Universal data loader that handles both S3 and Kaggle datasets
 * @param {Object} file - File object with metadata
 * @param {string} accessLevel - Access level for S3 files ('public', 'protected', 'private')
 * @param {number} maxRows - Maximum rows for preview (default: 100)
 * @returns {Promise<Object>} Loaded dataset with headers and data
 */
export const loadDatasetFile = async (file, accessLevel = 'protected', maxRows = 100) => {
  try {
    // Check if this is a Kaggle file
    if (file.isKaggleFile || file.key?.startsWith('kaggle://')) {
      console.log('Loading Kaggle dataset file:', file);
      
      // Extract Kaggle metadata
      const ownerSlug = file.ownerSlug;
      const datasetSlug = file.datasetSlug;
      const fileName = file.fileName || file.name;
      
      if (!ownerSlug || !datasetSlug || !fileName) {
        throw new Error('Missing Kaggle file metadata');
      }

      // Check if it's a CSV file
      if (fileName.toLowerCase().endsWith('.csv')) {
        return await streamKaggleCsvData(ownerSlug, datasetSlug, fileName, maxRows);
      } else {
        throw new Error('Only CSV files are supported for preview from Kaggle datasets');
      }
    } else {
      // Handle S3 datasets using existing utility
      console.log('Loading S3 dataset file:', file);
      return await loadCsvDataset(file.key, accessLevel);
    }
  } catch (error) {
    console.error('Error loading dataset file:', error);
    throw new Error(`Failed to load dataset file: ${error.message}`);
  }
};

/**
 * Get download URL for a dataset file
 * @param {Object} file - File object with metadata
 * @returns {string} Download URL
 */
export const getFileDownloadUrl = (file) => {
  if (file.isKaggleFile || file.key?.startsWith('kaggle://')) {
    // For Kaggle files, return the Kaggle dataset page URL since direct downloads require authentication
    const ownerSlug = file.ownerSlug;
    const datasetSlug = file.datasetSlug;
    return `https://www.kaggle.com/datasets/${ownerSlug}/${datasetSlug}`;
  } else {
    // For S3 files, return the S3 URL
    return `https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${file.key}`;
  }
};

/**
 * Check if a file can be previewed
 * @param {Object} file - File object with metadata
 * @returns {boolean} Whether the file can be previewed
 */
export const canPreviewFile = (file) => {
  const fileName = file.fileName || file.name || file.key || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Support CSV files from both sources
  return ['csv'].includes(extension);
};

/**
 * Get file type display name
 * @param {Object} file - File object with metadata
 * @returns {string} File type display name
 */
export const getFileTypeDisplay = (file) => {
  const fileName = file.fileName || file.name || file.key || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const typeMap = {
    'csv': 'CSV',
    'json': 'JSON',
    'xlsx': 'Excel',
    'xls': 'Excel',
    'txt': 'Text',
    'pdf': 'PDF',
    'parquet': 'Parquet',
    'tsv': 'TSV',
    'zip': 'Archive',
    'tar': 'Archive',
    'gz': 'Archive'
  };
  
  return typeMap[extension] || extension?.toUpperCase() || 'Unknown';
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
