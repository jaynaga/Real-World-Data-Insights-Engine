/**
 * Dataset Sharing Service
 * Handles sharing datasets while keeping them in the owner's cloud storage
 */

import { Storage, Auth } from 'aws-amplify';

const SHARES_PREFIX = 'dataset-shares/';

/**
 * Share a dataset with specific users or make it public
 * @param {Object} shareConfig - Configuration for sharing
 * @param {string} shareConfig.datasetId - The dataset ID to share
 * @param {Object} shareConfig.dataset - The full dataset object
 * @param {string} shareConfig.shareType - 'public', 'private', or 'link'
 * @param {Array} shareConfig.allowedUsers - Array of user emails (for private sharing)
 * @param {Object} shareConfig.permissions - Object defining what users can do
 * @param {string} shareConfig.description - Optional description for the share
 * @param {Date} shareConfig.expiresAt - Optional expiration date
 */
export const shareDataset = async (shareConfig) => {
  try {
    const currentUser = await Auth.currentAuthenticatedUser();
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shareDocument = {
      id: shareId,
      datasetId: shareConfig.datasetId,
      datasetName: shareConfig.dataset.name,
      datasetKey: shareConfig.dataset.key, // Original S3 path
      datasetPath: shareConfig.dataset.path,
      ownerId: currentUser.username,
      ownerEmail: currentUser.attributes.email,
      shareType: shareConfig.shareType || 'private',
      allowedUsers: shareConfig.allowedUsers || [],
      permissions: {
        canView: shareConfig.permissions?.canView !== false,
        canDownload: shareConfig.permissions?.canDownload || false,
        canCopy: shareConfig.permissions?.canCopy || false,
        canAnalyze: shareConfig.permissions?.canAnalyze !== false,
        ...shareConfig.permissions
      },
      description: shareConfig.description || '',
      createdAt: new Date().toISOString(),
      expiresAt: shareConfig.expiresAt?.toISOString() || null,
      accessCount: 0,
      lastAccessedAt: null,
      isActive: true,
      metadata: {
        datasetSize: shareConfig.dataset.size,
        fileCount: shareConfig.dataset.fileCount,
        format: shareConfig.dataset.format,
        source: shareConfig.dataset.source
      }
    };

    // Store the share configuration
    const shareKey = `${SHARES_PREFIX}${shareId}.json`;
    await Storage.put(shareKey, JSON.stringify(shareDocument, null, 2), {
      level: 'protected',
      contentType: 'application/json',
      metadata: {
        shareId: shareId,
        datasetId: shareConfig.datasetId,
        shareType: shareConfig.shareType,
        ownerId: currentUser.username
      }
    });

    console.log('Dataset shared successfully:', shareDocument);
    return {
      shareId,
      shareUrl: generateShareUrl(shareId),
      shareDocument
    };
  } catch (error) {
    console.error('Error sharing dataset:', error);
    throw new Error(`Failed to share dataset: ${error.message}`);
  }
};

/**
 * Get all shares created by the current user
 */
export const listMyShares = async () => {
  try {
    const files = await Storage.list(SHARES_PREFIX, {
      level: 'protected',
      pageSize: 100
    });

    const shareFiles = files.filter(file =>
      file.key.endsWith('.json') && file.size > 0
    );

    if (shareFiles.length === 0) {
      return [];
    }

    const sharePromises = shareFiles.map(async (file) => {
      try {
        const content = await Storage.get(file.key, {
          level: 'protected',
          download: true
        });

        const shareData = JSON.parse(await content.Body.text());
        return {
          ...shareData,
          key: file.key,
          size: file.size,
          lastModified: file.lastModified
        };
      } catch (error) {
        console.error(`Error loading share ${file.key}:`, error);
        return null;
      }
    });

    const shares = (await Promise.all(sharePromises))
      .filter(share => share !== null && share.isActive)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return shares;
  } catch (error) {
    console.error('Error listing shares:', error);
    throw new Error(`Failed to list shares: ${error.message}`);
  }
};

/**
 * Get a shared dataset by share ID
 * @param {string} shareId - The share ID
 * @param {string} requesterId - ID of the user requesting access (optional)
 */
export const getSharedDataset = async (shareId, requesterId = null) => {
  try {
    // Try to get the share document from various possible owners
    // This is a simplified approach - in production, you'd want a shared index
    const shareKey = `${SHARES_PREFIX}${shareId}.json`;
    
    // First try to get it as if we're the owner
    let shareContent;
    try {
      shareContent = await Storage.get(shareKey, {
        level: 'protected',
        download: true
      });
    } catch (error) {
      // If not found, it might be owned by someone else
      // In a real implementation, you'd query a shared index or database
      throw new Error('Shared dataset not found or access denied');
    }

    const shareDocument = JSON.parse(await shareContent.Body.text());

    // Check if share is still active and not expired
    if (!shareDocument.isActive) {
      throw new Error('This share has been deactivated');
    }

    if (shareDocument.expiresAt && new Date() > new Date(shareDocument.expiresAt)) {
      throw new Error('This share has expired');
    }

    // Check access permissions
    const currentUser = requesterId ? { username: requesterId } : await Auth.currentAuthenticatedUser();
    const hasAccess = checkShareAccess(shareDocument, currentUser);

    if (!hasAccess) {
      throw new Error('Access denied to this shared dataset');
    }

    // Update access tracking
    await updateShareAccess(shareKey, shareDocument);

    return {
      share: shareDocument,
      accessUrl: generateDatasetAccessUrl(shareDocument)
    };
  } catch (error) {
    console.error('Error accessing shared dataset:', error);
    throw new Error(`Failed to access shared dataset: ${error.message}`);
  }
};

/**
 * Update share settings
 */
export const updateShare = async (shareId, updates) => {
  try {
    const shareKey = `${SHARES_PREFIX}${shareId}.json`;
    
    // Get current share
    const content = await Storage.get(shareKey, {
      level: 'protected',
      download: true
    });

    const shareDocument = JSON.parse(await content.Body.text());
    
    // Verify ownership
    const currentUser = await Auth.currentAuthenticatedUser();
    if (shareDocument.ownerId !== currentUser.username) {
      throw new Error('Not authorized to update this share');
    }

    // Apply updates
    const updatedShare = {
      ...shareDocument,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save updated share
    await Storage.put(shareKey, JSON.stringify(updatedShare, null, 2), {
      level: 'protected',
      contentType: 'application/json'
    });

    return updatedShare;
  } catch (error) {
    console.error('Error updating share:', error);
    throw new Error(`Failed to update share: ${error.message}`);
  }
};

/**
 * Revoke/delete a share
 */
export const revokeShare = async (shareId) => {
  try {
    const shareKey = `${SHARES_PREFIX}${shareId}.json`;
    
    // Verify ownership before deletion
    const content = await Storage.get(shareKey, {
      level: 'protected',
      download: true
    });

    const shareDocument = JSON.parse(await content.Body.text());
    const currentUser = await Auth.currentAuthenticatedUser();
    
    if (shareDocument.ownerId !== currentUser.username) {
      throw new Error('Not authorized to revoke this share');
    }

    // Instead of deleting, deactivate the share
    await updateShare(shareId, { isActive: false });
    
    return true;
  } catch (error) {
    console.error('Error revoking share:', error);
    throw new Error(`Failed to revoke share: ${error.message}`);
  }
};

/**
 * Get dataset content through a share (with access control)
 */
export const getSharedDatasetContent = async (shareId, fileName = null) => {
  try {
    const { share } = await getSharedDataset(shareId);
    
    if (!share.permissions.canView) {
      throw new Error('View permission denied for this dataset');
    }

    // Get the dataset files using the original owner's path
    const files = await Storage.list(share.datasetPath + '/', {
      level: 'protected' // This will try to access from current user's storage
      // Note: In production, you'd need cross-account access or a proxy service
    });

    const dataFiles = files.filter(file => 
      !file.key.includes('/metadata/') && 
      !file.key.endsWith('/') &&
      (file.key.endsWith('.csv') || file.key.endsWith('.json') || file.key.endsWith('.txt'))
    );

    if (dataFiles.length === 0) {
      throw new Error('No accessible data files found');
    }

    // Get the requested file or the first available file
    const targetFile = fileName 
      ? dataFiles.find(f => f.key.includes(fileName))
      : dataFiles[0];

    if (!targetFile) {
      throw new Error('Requested file not found');
    }

    const content = await Storage.get(targetFile.key, {
      level: 'protected',
      download: true
    });

    return {
      content,
      fileName: targetFile.key.split('/').pop(),
      size: targetFile.size,
      share: share
    };
  } catch (error) {
    console.error('Error accessing shared dataset content:', error);
    throw new Error(`Failed to access shared dataset content: ${error.message}`);
  }
};

// Helper functions
const checkShareAccess = (shareDocument, user) => {
  // Public shares are accessible to everyone
  if (shareDocument.shareType === 'public') {
    return true;
  }

  // Link shares are accessible to anyone with the link
  if (shareDocument.shareType === 'link') {
    return true;
  }

  // Private shares require explicit permission
  if (shareDocument.shareType === 'private') {
    return shareDocument.allowedUsers.includes(user.attributes?.email || user.email);
  }

  return false;
};

const updateShareAccess = async (shareKey, shareDocument) => {
  try {
    const updatedShare = {
      ...shareDocument,
      accessCount: (shareDocument.accessCount || 0) + 1,
      lastAccessedAt: new Date().toISOString()
    };

    await Storage.put(shareKey, JSON.stringify(updatedShare, null, 2), {
      level: 'protected',
      contentType: 'application/json'
    });
  } catch (error) {
    console.error('Error updating share access:', error);
    // Don't throw error for access tracking failures
  }
};

const generateShareUrl = (shareId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shareId}`;
};

const generateDatasetAccessUrl = (shareDocument) => {
  return generateShareUrl(shareDocument.id);
};

const datasetSharingService = {
  shareDataset,
  listMyShares,
  getSharedDataset,
  updateShare,
  revokeShare,
  getSharedDatasetContent
};

export default datasetSharingService;
