/**
 * External Storage Service
 * Handles connections to external storage providers (Google Drive, Dropbox, Azure, etc.)
 * and allows users to share datasets directly from their own cloud storage
 */

// Storage provider configurations
const STORAGE_PROVIDERS = {
  GOOGLE_DRIVE: {
    id: 'google_drive',
    name: 'Google Drive',
    icon: '📁',
    authUrl: 'https://accounts.google.com/oauth/authorize',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || 'DEMO_GOOGLE_CLIENT_ID'
  },
  DROPBOX: {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '📦',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    scopes: ['files.metadata.read', 'files.content.read'],
    clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID || 'DEMO_DROPBOX_CLIENT_ID'
  },
  ONEDRIVE: {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '☁️',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scopes: ['Files.Read', 'offline_access'],
    clientId: process.env.REACT_APP_ONEDRIVE_CLIENT_ID || 'DEMO_ONEDRIVE_CLIENT_ID'
  },
  AZURE_BLOB: {
    id: 'azure_blob',
    name: 'Azure Blob Storage',
    icon: '🔷',
    requiresCredentials: true
  },
  AWS_S3: {
    id: 'aws_s3',
    name: 'AWS S3 (External)',
    icon: '🟠',
    requiresCredentials: true
  },
  FTP: {
    id: 'ftp',
    name: 'FTP/SFTP',
    icon: '🌐',
    requiresCredentials: true
  }
};

/**
 * Get all available storage providers
 */
export const getStorageProviders = () => {
  return Object.values(STORAGE_PROVIDERS);
};

/**
 * Get user's connected storage accounts from localStorage
 */
export const getConnectedAccounts = () => {
  try {
    const connections = localStorage.getItem('external_storage_connections');
    return connections ? JSON.parse(connections) : [];
  } catch (error) {
    console.error('Error loading connected accounts:', error);
    return [];
  }
};

/**
 * Save a new storage connection
 */
export const saveStorageConnection = (connection) => {
  try {
    const connections = getConnectedAccounts();
    const existingIndex = connections.findIndex(
      conn => conn.providerId === connection.providerId && conn.accountId === connection.accountId
    );
    
    if (existingIndex >= 0) {
      connections[existingIndex] = { ...connections[existingIndex], ...connection };
    } else {
      connections.push({
        ...connection,
        id: `${connection.providerId}_${Date.now()}`,
        connectedAt: new Date().toISOString(),
        isActive: true
      });
    }
    
    localStorage.setItem('external_storage_connections', JSON.stringify(connections));
    return connections;
  } catch (error) {
    console.error('Error saving storage connection:', error);
    throw new Error('Failed to save storage connection');
  }
};

/**
 * Remove a storage connection
 */
export const removeStorageConnection = (connectionId) => {
  try {
    const connections = getConnectedAccounts();
    const filtered = connections.filter(conn => conn.id !== connectionId);
    localStorage.setItem('external_storage_connections', JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Error removing storage connection:', error);
    throw new Error('Failed to remove storage connection');
  }
};

/**
 * Initiate OAuth flow for supported providers
 */
export const initiateOAuthFlow = (providerId) => {
  const provider = STORAGE_PROVIDERS[providerId.toUpperCase()];
  if (!provider || provider.requiresCredentials) {
    throw new Error('This provider requires manual credential setup');
  }

  // Check if we have valid client ID (not demo/undefined)
  if (!provider.clientId || provider.clientId.startsWith('DEMO_')) {
    throw new Error(`${provider.name} integration is not configured. Please contact the administrator to set up OAuth credentials for ${provider.name}.`);
  }

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: `${window.location.origin}/auth-callback.html`,
    response_type: 'code',
    scope: provider.scopes?.join(' ') || '',
    state: btoa(JSON.stringify({ providerId: provider.id, timestamp: Date.now() }))
  });

  const authUrl = `${provider.authUrl}?${params.toString()}`;
  
  console.log(`Initiating OAuth for ${provider.name}:`);
  console.log('Auth URL:', authUrl);
  console.log('Redirect URI:', `${window.location.origin}/auth-callback.html`);
  
  // Open in popup window
  const popup = window.open(
    authUrl,
    'auth_popup',
    'width=600,height=700,left=' + (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 350)
  );

  if (!popup) {
    throw new Error('Failed to open authentication popup. Please check your popup blocker settings.');
  }

  return new Promise((resolve, reject) => {
    console.log('Setting up OAuth promise handlers...');
    
    // Set a timeout to handle cases where the popup is closed or auth fails
    const timeout = setTimeout(() => {
      console.log('OAuth timeout reached');
      window.removeEventListener('message', messageHandler);
      try {
        popup.close();
      } catch (e) {
        // Ignore errors when closing popup
      }
      reject(new Error('Authentication timed out. Please try again.'));
    }, 300000); // 5 minute timeout

    // Listen for auth completion message
    const messageHandler = (event) => {
      console.log('Received message from popup:', event);
      
      if (event.origin !== window.location.origin) {
        console.log('Message from different origin, ignoring:', event.origin);
        return;
      }
      
      if (event.data.type === 'AUTH_SUCCESS') {
        console.log('Auth success received:', event.data.connection);
        clearTimeout(timeout);
        try {
          popup.close();
        } catch (e) {
          // Ignore errors when closing popup
        }
        window.removeEventListener('message', messageHandler);
        resolve(event.data.connection);
      } else if (event.data.type === 'AUTH_ERROR') {
        console.log('Auth error received:', event.data.error);
        clearTimeout(timeout);
        try {
          popup.close();
        } catch (e) {
          // Ignore errors when closing popup
        }
        window.removeEventListener('message', messageHandler);
        reject(new Error(event.data.error));
      } else if (event.data.type === 'AUTH_CANCELLED') {
        console.log('Auth cancelled received');
        clearTimeout(timeout);
        try {
          popup.close();
        } catch (e) {
          // Ignore errors when closing popup
        }
        window.removeEventListener('message', messageHandler);
        reject(new Error('Authentication was cancelled'));
      }
    };

    console.log('Adding message listener...');
    window.addEventListener('message', messageHandler);
  });
};

/**
 * List files from a connected storage provider
 */
export const listExternalFiles = async (connectionId, path = '/') => {
  const connections = getConnectedAccounts();
  const connection = connections.find(conn => conn.id === connectionId);
  
  if (!connection) {
    throw new Error('Storage connection not found');
  }

  try {
    switch (connection.providerId) {
      case 'google_drive':
        return await listGoogleDriveFiles(connection, path);
      case 'dropbox':
        return await listDropboxFiles(connection, path);
      case 'onedrive':
        return await listOneDriveFiles(connection, path);
      default:
        throw new Error(`Unsupported provider: ${connection.providerId}`);
    }
  } catch (error) {
    console.error('Error listing external files:', error);
    throw new Error(`Failed to list files from ${connection.providerName}: ${error.message}`);
  }
};

/**
 * Get a shareable link for an external file
 */
export const getExternalFileShareLink = async (connectionId, fileId, fileName) => {
  const connections = getConnectedAccounts();
  const connection = connections.find(conn => conn.id === connectionId);
  
  if (!connection) {
    throw new Error('Storage connection not found');
  }

  const shareDocument = {
    id: `ext_share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'external_dataset',
    fileName: fileName,
    fileId: fileId,
    connectionId: connectionId,
    providerId: connection.providerId,
    providerName: connection.providerName,
    accountName: connection.accountName,
    sharedAt: new Date().toISOString(),
    sharedBy: connection.userId || 'anonymous',
    accessCount: 0,
    isActive: true
  };

  // Store share document in local storage (in production, this would be in a database)
  const shares = JSON.parse(localStorage.getItem('external_shares') || '[]');
  shares.push(shareDocument);
  localStorage.setItem('external_shares', JSON.stringify(shares));

  return {
    shareId: shareDocument.id,
    shareUrl: `${window.location.origin}/external-dataset/${shareDocument.id}`,
    shareDocument
  };
};

/**
 * Get shared external dataset info
 */
export const getExternalShare = (shareId) => {
  try {
    const shares = JSON.parse(localStorage.getItem('external_shares') || '[]');
    const share = shares.find(s => s.id === shareId && s.isActive);
    
    if (!share) {
      throw new Error('Share not found or has been revoked');
    }

    // Increment access count
    share.accessCount = (share.accessCount || 0) + 1;
    share.lastAccessedAt = new Date().toISOString();
    
    const updatedShares = shares.map(s => s.id === shareId ? share : s);
    localStorage.setItem('external_shares', JSON.stringify(updatedShares));

    return share;
  } catch (error) {
    console.error('Error getting external share:', error);
    throw new Error('Failed to access shared dataset');
  }
};

/**
 * Download/access file from external storage
 */
export const accessExternalFile = async (shareId) => {
  const share = getExternalShare(shareId);
  const connections = getConnectedAccounts();
  const connection = connections.find(conn => conn.id === share.connectionId);
  
  if (!connection) {
    throw new Error('Original storage connection no longer available');
  }

  switch (share.providerId) {
    case 'google_drive':
      return await getGoogleDriveFileContent(connection, share.fileId);
    case 'dropbox':
      return await getDropboxFileContent(connection, share.fileId);
    case 'onedrive':
      return await getOneDriveFileContent(connection, share.fileId);
    default:
      throw new Error(`Unsupported provider: ${share.providerId}`);
  }
};

// Provider-specific implementations
const listGoogleDriveFiles = async (connection, path) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,size,mimeType,modifiedTime)`, {
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google Drive files');
  }

  const data = await response.json();
  return data.files.map(file => ({
    id: file.id,
    name: file.name,
    size: file.size,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    provider: 'google_drive'
  }));
};

const listDropboxFiles = async (connection, path) => {
  const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: path === '/' ? '' : path,
      recursive: false
    })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Dropbox files');
  }

  const data = await response.json();
  return data.entries
    .filter(entry => entry['.tag'] === 'file')
    .map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      modifiedTime: file.server_modified,
      provider: 'dropbox'
    }));
};

const listOneDriveFiles = async (connection, path) => {
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/children`, {
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch OneDrive files');
  }

  const data = await response.json();
  return data.value.map(file => ({
    id: file.id,
    name: file.name,
    size: file.size,
    modifiedTime: file.lastModifiedDateTime,
    provider: 'onedrive'
  }));
};

const getGoogleDriveFileContent = async (connection, fileId) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download Google Drive file');
  }

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

  if (!response.ok) {
    throw new Error('Failed to download Dropbox file');
  }

  return await response.text();
};

const getOneDriveFileContent = async (connection, fileId) => {
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download OneDrive file');
  }

  return await response.text();
};

const externalStorageService = {
  getStorageProviders,
  getConnectedAccounts,
  saveStorageConnection,
  removeStorageConnection,
  initiateOAuthFlow,
  listExternalFiles,
  getExternalFileShareLink,
  getExternalShare,
  accessExternalFile
};

export default externalStorageService;
