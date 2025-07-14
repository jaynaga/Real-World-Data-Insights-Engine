import { Storage } from 'aws-amplify';

// List files
export const listFiles = async (path = 'user-uploads/') => {
  try {
    console.log('Listing files from path:', path);
    const files = await Storage.list(path, { 
      pageSize: 100,
      level: 'protected'  // Match the upload access level
    });
    
    console.log('Files found:', files);
    
    const processedFiles = files.map(file => ({
      key: file.key,
      size: file.size,
      lastModified: file.lastModified,
      eTag: file.eTag,
      name: file.key.split('/').pop(),
      type: file.key.split('.').pop().toLowerCase(),
      url: `s3://${process.env.REACT_APP_S3_BUCKET}/protected/${file.key}` // Add S3 path for reference
    }));

    console.log('Processed files:', processedFiles);
    return processedFiles;
  } catch (error) {
    console.error('Error listing files:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      path: path
    });
    throw error;
  }
};

// List datasets from raw folder
export const listDatasets = async () => {
  try {
    console.log('Attempting to list datasets...');
    // Using the correct bucket path with protected access level
    const path = 'raw/Synthea/merged_csv/';
    console.log('Using path:', path);
    
    const files = await Storage.list(path, {
      pageSize: 100,
      level: 'protected', // Use protected access level
      customPrefix: {
        protected: '' // Remove protected/ prefix for this request
      }
    });
    
    console.log('Raw files response:', files);
    
    const processedFiles = files
      .filter(file => file.size > 0) // Only return actual files, not folders
      .map(file => ({
        id: file.eTag || file.key,
        name: file.key.split('/').pop().replace('.csv', ''),
        key: file.key,
        size: file.size || 0,
        lastModified: file.lastModified || new Date(),
        format: 'csv',
        path: file.key
      }));
      
    console.log('Processed files:', processedFiles);
    return processedFiles;
  } catch (error) {
    console.error('Error listing datasets:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      path: 'raw/Synthea/merged_csv/',
      level: 'protected'
    });
    throw new Error(`Failed to load datasets: ${error.message}`);
  }
};

// Get dataset content
export const getDatasetContent = async (key) => {
  try {
    const result = await Storage.get(key, { download: true });
    const content = await result.Body.text();
    return content;
  } catch (error) {
    console.error('Error getting dataset content:', error);
    throw error;
  }
};

// Upload file
export const uploadFile = async (file, filename) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // File size limit (e.g., 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // File type validation
    const ALLOWED_TYPES = ['text/csv', 'application/json', 'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File type not supported. Please upload CSV, JSON, or Excel files.');
    }

    // Add user-specific prefix to path
    const userPrefix = 'user-uploads/';
    const key = `${userPrefix}${filename}`;

    console.log('Uploading file:', {
      key,
      contentType: file.type,
      size: file.size
    });

    // Convert metadata values to strings
    const metadata = {
      uploadedAt: new Date().toISOString(),
      originalFilename: file.name,
      fileType: file.type,
      fileSize: String(file.size) // Convert number to string
    };

    const options = {
      contentType: file.type,
      level: 'protected',
      metadata,
      acl: 'private', // Ensure private access
      serverSideEncryption: 'AES256', // Enable server-side encryption
    };

    console.log('Upload options:', options);

    const result = await Storage.put(key, file, options);
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Error uploading file:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

// Get file (generates signed URL)
export const getFileUrl = async (key) => {
  try {
    const url = await Storage.get(key);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

// Download file
export const downloadFile = async (key) => {
  try {
    const result = await Storage.get(key, { download: true });
    return result;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// List user uploads
export const listUserUploads = async () => {
  try {
    console.log('Listing user uploads...');
    const files = await Storage.list('user-uploads/', {
      pageSize: 100,
      level: 'protected'
    });
    
    console.log('User uploads found:', files);
    
    const processedFiles = files
      .filter(file => file.size > 0) // Only return actual files, not folders
      .map(file => ({
        id: file.eTag || file.key,
        name: file.key.split('/').pop(),
        key: file.key,
        size: file.size || 0,
        lastModified: file.lastModified || new Date(),
        type: file.key.split('.').pop().toLowerCase(),
        path: `protected/${file.key}`  // Show the full path in S3
      }));
      
    console.log('Processed user uploads:', processedFiles);
    return processedFiles;
  } catch (error) {
    console.error('Error listing user uploads:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
    throw new Error(`Failed to list uploads: ${error.message}`);
  }
};
