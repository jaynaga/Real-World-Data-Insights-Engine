/**
 * Project Sharing Service
 * Handles sharing projects with other users while keeping them in the owner's cloud storage
 */

import { Storage, Auth } from 'aws-amplify';

const PROJECT_SHARES_PREFIX = 'project-shares/';

/**
 * Share a project with specific users or make it public
 * @param {Object} shareConfig - Configuration for sharing
 * @param {string} shareConfig.projectId - The project ID to share
 * @param {Object} shareConfig.project - The full project object
 * @param {string} shareConfig.shareType - 'public', 'private', or 'link'
 * @param {Array} shareConfig.allowedUsers - Array of user emails (for private sharing)
 * @param {Object} shareConfig.permissions - Object defining what users can do
 * @param {string} shareConfig.description - Optional description for the share
 * @param {Date} shareConfig.expiresAt - Optional expiration date
 */
export const shareProject = async (shareConfig) => {
  try {
    const currentUser = await Auth.currentAuthenticatedUser();
    const shareId = `project_share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shareDocument = {
      id: shareId,
      projectId: shareConfig.projectId,
      projectTitle: shareConfig.project.title,
      projectKey: shareConfig.project.key, // Original S3 path
      projectPath: shareConfig.project.path,
      ownerId: currentUser.username,
      ownerEmail: currentUser.attributes.email,
      shareType: shareConfig.shareType || 'private',
      allowedUsers: shareConfig.allowedUsers || [],
      permissions: {
        canView: shareConfig.permissions?.canView !== false,
        canEdit: shareConfig.permissions?.canEdit || false,
        canDownload: shareConfig.permissions?.canDownload || false,
        canCopy: shareConfig.permissions?.canCopy || false,
        canManageDatasets: shareConfig.permissions?.canManageDatasets || false,
        ...shareConfig.permissions
      },
      description: shareConfig.description || '',
      createdAt: new Date().toISOString(),
      expiresAt: shareConfig.expiresAt?.toISOString() || null,
      accessCount: 0,
      lastAccessedAt: null,
      isActive: true,
      metadata: {
        projectStatus: shareConfig.project.status,
        datasetCount: shareConfig.project.datasets?.length || 0,
        createdAt: shareConfig.project.createdAt,
        lastModified: shareConfig.project.updatedAt
      }
    };

    // Store the share configuration
    const shareKey = `${PROJECT_SHARES_PREFIX}${shareId}.json`;
    await Storage.put(shareKey, JSON.stringify(shareDocument, null, 2), {
      level: 'protected',
      contentType: 'application/json',
      metadata: {
        shareId: shareId,
        projectId: shareConfig.projectId,
        shareType: shareConfig.shareType,
        ownerId: currentUser.username
      }
    });

    console.log('Project shared successfully:', shareDocument);
    return {
      shareId,
      shareUrl: generateShareUrl(shareId),
      shareDocument
    };
  } catch (error) {
    console.error('Error sharing project:', error);
    throw new Error(`Failed to share project: ${error.message}`);
  }
};

/**
 * Get all project shares created by the current user
 */
export const listMyProjectShares = async () => {
  try {
    const files = await Storage.list(PROJECT_SHARES_PREFIX, {
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
        console.error(`Error loading project share ${file.key}:`, error);
        return null;
      }
    });

    const shares = (await Promise.all(sharePromises))
      .filter(share => share !== null && share.isActive)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return shares;
  } catch (error) {
    console.error('Error listing project shares:', error);
    throw new Error(`Failed to list project shares: ${error.message}`);
  }
};

/**
 * Get a shared project by share ID
 * @param {string} shareId - The share ID
 * @param {string} requesterId - ID of the user requesting access (optional)
 */
export const getSharedProject = async (shareId, requesterId = null) => {
  try {
    const shareKey = `${PROJECT_SHARES_PREFIX}${shareId}.json`;
    
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
      throw new Error('Shared project not found or access denied');
    }

    const shareDocument = JSON.parse(await shareContent.Body.text());

    // Check if share is still active and not expired
    if (!shareDocument.isActive) {
      throw new Error('This project share has been deactivated');
    }

    if (shareDocument.expiresAt && new Date() > new Date(shareDocument.expiresAt)) {
      throw new Error('This project share has expired');
    }

    // Check access permissions
    const currentUser = requesterId ? { username: requesterId } : await Auth.currentAuthenticatedUser();
    const hasAccess = checkShareAccess(shareDocument, currentUser);

    if (!hasAccess) {
      throw new Error('Access denied to this shared project');
    }

    // Update access tracking
    await updateShareAccess(shareKey, shareDocument);

    return {
      share: shareDocument,
      accessUrl: generateProjectAccessUrl(shareDocument)
    };
  } catch (error) {
    console.error('Error accessing shared project:', error);
    throw new Error(`Failed to access shared project: ${error.message}`);
  }
};

/**
 * Update share settings
 */
export const updateProjectShare = async (shareId, updates) => {
  try {
    const shareKey = `${PROJECT_SHARES_PREFIX}${shareId}.json`;
    
    // Get current share
    const content = await Storage.get(shareKey, {
      level: 'protected',
      download: true
    });

    const shareDocument = JSON.parse(await content.Body.text());
    
    // Verify ownership
    const currentUser = await Auth.currentAuthenticatedUser();
    if (shareDocument.ownerId !== currentUser.username) {
      throw new Error('Not authorized to update this project share');
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
    console.error('Error updating project share:', error);
    throw new Error(`Failed to update project share: ${error.message}`);
  }
};

/**
 * Revoke/delete a project share
 */
export const revokeProjectShare = async (shareId) => {
  try {
    const shareKey = `${PROJECT_SHARES_PREFIX}${shareId}.json`;
    
    // Verify ownership before deletion
    const content = await Storage.get(shareKey, {
      level: 'protected',
      download: true
    });

    const shareDocument = JSON.parse(await content.Body.text());
    const currentUser = await Auth.currentAuthenticatedUser();
    
    if (shareDocument.ownerId !== currentUser.username) {
      throw new Error('Not authorized to revoke this project share');
    }

    // Instead of deleting, deactivate the share
    await updateProjectShare(shareId, { isActive: false });
    
    return true;
  } catch (error) {
    console.error('Error revoking project share:', error);
    throw new Error(`Failed to revoke project share: ${error.message}`);
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
    console.error('Error updating project share access:', error);
    // Don't throw error for access tracking failures
  }
};

const generateShareUrl = (shareId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/projects/shared/${shareId}`;
};

const generateProjectAccessUrl = (shareDocument) => {
  return generateShareUrl(shareDocument.id);
};

const projectSharingService = {
  shareProject,
  listMyProjectShares,
  getSharedProject,
  updateProjectShare,
  revokeProjectShare
};

export default projectSharingService;
