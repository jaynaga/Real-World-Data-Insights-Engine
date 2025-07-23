const API_BASE_URL = process.env.REACT_APP_API_URL;

/**
 * List all files from S3
 * @param {string} prefix Optional folder prefix
 * @returns {Promise<Array>} Array of files with signed URLs
 */
export async function listFiles(prefix = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}`);
    if (!response.ok) {
      throw new Error('Failed to list files');
    }
    return await response.json();
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Get a pre-signed URL for file upload
 * @param {string} fileName Name of the file to upload
 * @param {string} contentType MIME type of the file
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
export async function getUploadUrl(fileName, contentType) {
  try {
    const response = await fetch(`${API_BASE_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, contentType }),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

/**
 * Upload a file using a pre-signed URL
 * @param {string} uploadUrl Pre-signed URL for upload
 * @param {File} file File to upload
 * @returns {Promise<void>}
 */
export async function uploadFile(uploadUrl, file) {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
