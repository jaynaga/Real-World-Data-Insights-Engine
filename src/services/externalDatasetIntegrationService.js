/**
 * External Dataset Integration Service
 * Integrates externally stored datasets into the main dataset system
 * Makes external datasets appear the same as internal ones in the UI
 */

import { Storage } from 'aws-amplify';
import externalStorageService from './externalStorageService';

const EXTERNAL_DATASETS_PREFIX = 'external-datasets/';

/**
 * Register an external dataset to appear in the main dataset list
 * @param {Object} externalDataset - Dataset info from external storage
 * @param {string} connectionId - ID of the storage connection
 */
export const registerExternalDataset = async (externalDataset, connectionId) => {
  try {
    const connections = externalStorageService.getConnectedAccounts();
    const connection = connections.find(conn => conn.id === connectionId);
    
    if (!connection) {
      throw new Error('Storage connection not found');
    }

    // Create a dataset document that looks like internal datasets
    const datasetDocument = {
      id: `ext_${connectionId}_${externalDataset.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      name: externalDataset.name,
      source: 'External Dataset',
      type: 'external',
      size: externalDataset.size || 0,
      format: getFileFormat(externalDataset.name),
      uploadedAt: externalDataset.modifiedTime || new Date().toISOString(),
      lastModified: externalDataset.modifiedTime || new Date().toISOString(),
      
      // External-specific metadata
      external: {
        providerId: connection.providerId,
        providerName: connection.providerName,
        providerIcon: connection.providerIcon,
        connectionId: connectionId,
        externalFileId: externalDataset.id,
        externalPath: externalDataset.path || externalDataset.name,
        accountName: connection.accountName
      },
      
      // Make it compatible with existing dataset structure
      files: [{
        key: `external://${connectionId}/${externalDataset.id}`,
        name: externalDataset.name,
        size: externalDataset.size || 0,
        lastModified: externalDataset.modifiedTime || new Date().toISOString()
      }],
      
      // Standard dataset metadata
      tags: extractTagsFromName(externalDataset.name),
      description: `Dataset from ${connection.providerName}: ${connection.accountName}`,
      accessLevel: 'external',
      fileCount: 1,
      
      // For compatibility with existing components
      path: `external-datasets/${connectionId}`,
      key: `external-datasets/${connectionId}/${externalDataset.id}.json`
    };

    // Store the dataset reference in our system
    const datasetKey = `${EXTERNAL_DATASETS_PREFIX}${datasetDocument.id}.json`;
    await Storage.put(datasetKey, JSON.stringify(datasetDocument, null, 2), {
      level: 'protected',
      contentType: 'application/json',
      metadata: {
        type: 'external_dataset',
        providerId: connection.providerId,
        connectionId: connectionId,
        externalFileId: externalDataset.id
      }
    });

    return datasetDocument;
  } catch (error) {
    console.error('Error registering external dataset:', error);
    throw new Error(`Failed to register external dataset: ${error.message}`);
  }
};

/**
 * Load external datasets and integrate them with internal datasets
 * This function is called by the main dataset loading functions
 */
export const loadExternalDatasets = async () => {
  try {
    // Get all external dataset references
    const externalFiles = await Storage.list(EXTERNAL_DATASETS_PREFIX, {
      level: 'protected',
      pageSize: 1000
    });

    const datasetFiles = externalFiles.filter(file => 
      file.key.endsWith('.json') && file.size > 0
    );

    if (datasetFiles.length === 0) {
      return [];
    }

    // Load all external dataset documents
    const datasetPromises = datasetFiles.map(async (file) => {
      try {
        const content = await Storage.get(file.key, {
          level: 'protected',
          download: true
        });

        const datasetData = JSON.parse(await content.Body.text());
        
        // Verify the external connection is still valid
        const connections = externalStorageService.getConnectedAccounts();
        const connectionExists = connections.some(conn => conn.id === datasetData.external?.connectionId);
        
        if (!connectionExists) {
          console.warn(`External dataset ${datasetData.name} has invalid connection`);
          return null;
        }

        return {
          ...datasetData,
          // Ensure it has the right properties for UI compatibility
          isExternal: true,
          storageProvider: datasetData.external.providerName
        };
      } catch (error) {
        console.error(`Error loading external dataset ${file.key}:`, error);
        return null;
      }
    });

    const datasets = (await Promise.all(datasetPromises))
      .filter(dataset => dataset !== null)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return datasets;
  } catch (error) {
    console.error('Error loading external datasets:', error);
    return [];
  }
};

/**
 * Get content from an external dataset (for preview/download)
 * This function is called when users try to preview external datasets
 */
export const getExternalDatasetContent = async (dataset) => {
  if (!dataset.external) {
    throw new Error('Not an external dataset');
  }

  try {
    const connections = externalStorageService.getConnectedAccounts();
    const connection = connections.find(conn => conn.id === dataset.external.connectionId);
    
    if (!connection) {
      throw new Error('Storage connection no longer available');
    }

    // Use the external storage service to get file content
    const content = await getExternalFileContent(connection, dataset.external.externalFileId);
    
    return {
      content: content,
      contentType: getContentType(dataset.format),
      fileName: dataset.name,
      size: dataset.size
    };
  } catch (error) {
    console.error('Error accessing external dataset content:', error);
    throw new Error(`Failed to access external dataset: ${error.message}`);
  }
};

/**
 * Remove an external dataset from the system
 */
export const removeExternalDataset = async (datasetId) => {
  try {
    const datasetKey = `${EXTERNAL_DATASETS_PREFIX}${datasetId}.json`;
    await Storage.remove(datasetKey, { level: 'protected' });
    return true;
  } catch (error) {
    console.error('Error removing external dataset:', error);
    throw new Error('Failed to remove external dataset');
  }
};

/**
 * Batch register multiple external datasets
 */
export const registerMultipleExternalDatasets = async (externalDatasets, connectionId) => {
  const results = [];
  const errors = [];

  for (const dataset of externalDatasets) {
    try {
      const registered = await registerExternalDataset(dataset, connectionId);
      results.push(registered);
    } catch (error) {
      console.error(`Error registering ${dataset.name}:`, error);
      errors.push({ dataset: dataset.name, error: error.message });
    }
  }

  return { results, errors };
};

// Helper functions
const getFileFormat = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
  const formatMap = {
    'csv': 'CSV',
    'json': 'JSON',
    'xlsx': 'Excel',
    'xls': 'Excel',
    'tsv': 'TSV',
    'parquet': 'Parquet',
    'txt': 'Text',
    'xml': 'XML'
  };
  return formatMap[extension] || 'Unknown';
};

const extractTagsFromName = (fileName) => {
  const tags = [];
  const name = fileName.toLowerCase();
  
  // Extract common data type indicators
  if (name.includes('survey') || name.includes('questionnaire')) tags.push('survey');
  if (name.includes('experiment') || name.includes('trial')) tags.push('experimental');
  if (name.includes('demographic') || name.includes('demo')) tags.push('demographics');
  if (name.includes('longitudinal') || name.includes('time')) tags.push('longitudinal');
  if (name.includes('cross') && name.includes('section')) tags.push('cross-sectional');
  
  return tags;
};

const getContentType = (format) => {
  const typeMap = {
    'CSV': 'text/csv',
    'JSON': 'application/json',
    'Excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'TSV': 'text/tab-separated-values',
    'Text': 'text/plain',
    'XML': 'application/xml'
  };
  return typeMap[format] || 'text/plain';
};

// Provider-specific file content fetching (simplified versions)
const getExternalFileContent = async (connection, fileId) => {
  switch (connection.providerId) {
    case 'google_drive':
      return await getGoogleDriveFileContent(connection, fileId);
    case 'dropbox':
      return await getDropboxFileContent(connection, fileId);
    case 'onedrive':
      return await getOneDriveFileContent(connection, fileId);
    default:
      throw new Error(`Unsupported provider: ${connection.providerId}`);
  }
};

const getGoogleDriveFileContent = async (connection, fileId) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${connection.accessToken}` }
  });
  if (!response.ok) throw new Error('Failed to download Google Drive file');
  return await response.text();
};

const getDropboxFileContent = async (connection, fileId) => {
  const response = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: fileId })
    }
  });
  if (!response.ok) throw new Error('Failed to download Dropbox file');
  return await response.text();
};

const getOneDriveFileContent = async (connection, fileId) => {
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
    headers: { 'Authorization': `Bearer ${connection.accessToken}` }
  });
  if (!response.ok) throw new Error('Failed to download OneDrive file');
  return await response.text();
};

const externalDatasetIntegrationService = {
  registerExternalDataset,
  loadExternalDatasets,
  getExternalDatasetContent,
  removeExternalDataset,
  registerMultipleExternalDatasets
};

export default externalDatasetIntegrationService;
