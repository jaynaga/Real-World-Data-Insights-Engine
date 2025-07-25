import { Storage } from 'aws-amplify';
import Papa from 'papaparse';
import externalDatasetIntegrationService from '../services/externalDatasetIntegrationService';

// Fetch dataset file content from S3
export const getDatasetFile = async (datasetId) => {
  console.log('🔍 Attempting to fetch dataset file:', datasetId);
  
  try {
    // The datasetId is likely a folder path like "user-uploads/raw/test-1753066076407"
    // We need to list files in that folder and get the first CSV file
    
    // First, try to list files in the dataset folder
    const possibleFolderPaths = [
      datasetId, // Direct path
      `user-uploads/raw/${datasetId}`, // Prefixed path
      `raw/${datasetId}` // Alternative prefix
    ];

    for (const folderPath of possibleFolderPaths) {
      try {
        console.log('🔍 Listing files in folder:', folderPath);
        
        // List files in the dataset folder
        const files = await Storage.list(folderPath + '/', { 
          level: 'protected',
          pageSize: 100
        });
        
        console.log('📁 Files found in folder:', files.map(f => f.key));
        
        // Filter for data files (exclude metadata folder and look for CSV/data files)
        const dataFiles = files.filter(file => 
          !file.key.includes('/metadata/') && // Exclude metadata files
          !file.key.endsWith('/') && // Exclude folder entries
          (file.key.endsWith('.csv') || file.key.endsWith('.json') || file.key.endsWith('.txt'))
        );
        
        if (dataFiles.length > 0) {
          // Get the first data file
          const firstDataFile = dataFiles[0];
          console.log('📄 Fetching first data file:', firstDataFile.key);
          
          const result = await Storage.get(firstDataFile.key, { 
            level: 'protected',
            download: true 
          });
          console.log('✅ Successfully fetched data file');
          return result;
        } else {
          console.log('❌ No data files found in folder:', folderPath);
        }
      } catch (error) {
        console.log('❌ Failed to list files in folder:', folderPath, error.message);
        continue;
      }
    }

    // If folder approach fails, try direct file access with different extensions/paths
    const alternativePaths = [
      datasetId, // Direct key as provided
      `${datasetId}.csv`, // Add .csv extension
      `user-uploads/raw/${datasetId}`, // user-uploads/raw/prefix
      `user-uploads/raw/${datasetId}.csv`, // user-uploads/raw/prefix with extension
      `raw/${datasetId}`, // raw/prefix
      `datasets/${datasetId}` // datasets/prefix
    ];

    // Try each alternative path
    for (const path of alternativePaths) {
      try {
        console.log('🔍 Trying direct file path:', path);
        const result = await Storage.get(path, { 
          level: 'protected',
          download: true 
        });
        console.log('✅ Successfully fetched file with path:', path);
        return result;
      } catch (error) {
        console.log('❌ Failed with path:', path);
        continue;
      }
    }

    // If all attempts fail, throw a user-friendly error
    console.log('❌ All attempts to fetch dataset file failed');
    throw new Error(`Dataset file not found: ${datasetId}. File may have been deleted or moved.`);
  } catch (error) {
    console.error('Error in getDatasetFile:', error);
    throw error;
  }
};

// Helper function to find common prefix in file names
const findCommonPrefix = (filenames) => {
  if (!filenames || filenames.length === 0) return '';
  if (filenames.length === 1) return filenames[0].replace(/\.[^/.]+$/, '');

  let prefix = filenames[0];
  for (let i = 1; i < filenames.length; i++) {
    while (filenames[i].indexOf(prefix) !== 0 && prefix.length > 0) {
      prefix = prefix.substring(0, prefix.length - 1);
    }
  }

  // Clean up the prefix - remove trailing numbers, underscores, dashes
  prefix = prefix.replace(/[_\-\d]+$/, '').trim();
  return prefix.length > 2 ? prefix : '';
};

// List files
export const listFiles = async (path = 'user-uploads/') => {
  try {
    const files = await Storage.list(path, {
      pageSize: 100,
      level: 'protected'  // Match the upload access level
    });

    const processedFiles = await Promise.all(
      files.map(async file => ({
        key: file.key,
        size: file.size,
        lastModified: file.lastModified,
        eTag: file.eTag,
        name: file.key.split('/').pop(),
        type: file.key.split('.').pop().toLowerCase(),
        url: await Storage.get(file.key, { level: 'protected' }) // Add S3 path for reference
      }))
    );

    // ...existing code...
    return processedFiles;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

// List all datasets from both raw folder (Synthea datasets) and user uploads
export const listDatasets = async () => {
  try {
    // ...existing code...

    const allDatasets = [];

    // First, try to get Synthea datasets from raw folder
    console.log('Loading Synthea datasets from raw directory...');
    try {
      // Try multiple approaches to access the raw data
      const approaches = [
        // Approach 1: Try protected level
        {
          name: 'Protected level access',
          config: { path: 'raw/', level: 'protected' }
        },
        // Approach 2: Try public level
        {
          name: 'Public level access',
          config: { path: 'raw/', level: 'public' }
        },
        // Approach 3: Try root level and filter for raw
        {
          name: 'Root level listing',
          config: { path: '', level: 'public' }
        }
      ];

      for (const approach of approaches) {
        try {
          console.log(`Trying ${approach.name}:`, approach.config);

          const files = await Storage.list(approach.config.path, {
            pageSize: 1000,
            level: approach.config.level
          });

          console.log(`${approach.name} - Raw response:`, files);

          // Extract unique folder paths from raw directory
          const rawFiles = files.filter(file => {
            // Exclude the raw/ folder itself and only include files within dataset folders
            return file.key.startsWith('raw/') &&
              file.key !== 'raw/' &&
              file.key.split('/').length >= 3 && // raw/dataset-folder/file.ext
              !file.key.endsWith('/'); // Exclude folder entries, only include actual files
          });

          console.log(`${approach.name} - Filtered raw files:`, rawFiles.map(f => f.key));

          if (rawFiles.length > 0) {
            // Group files by their immediate folder under raw/
            const folderMap = new Map();

            rawFiles.forEach(file => {
              const pathParts = file.key.split('/');
              // Ensure we have: raw/dataset-folder/file.ext (minimum 3 parts)
              if (pathParts.length >= 3 && pathParts[0] === 'raw' && pathParts[1] !== '') {
                const folderName = pathParts[1]; // The immediate folder under raw/
                const folderPath = `raw/${folderName}`;

                // Skip if this is somehow the raw folder itself
                if (folderName === '' || folderPath === 'raw/') {
                  return;
                }

                if (!folderMap.has(folderPath)) {
                  folderMap.set(folderPath, {
                    files: [],
                    totalSize: 0,
                    lastModified: new Date(0)
                  });
                }

                const folderData = folderMap.get(folderPath);
                folderData.files.push(file);
                folderData.totalSize += file.size || 0;

                // Update last modified to the most recent file
                if (file.lastModified && file.lastModified > folderData.lastModified) {
                  folderData.lastModified = file.lastModified;
                }
              }
            });

            if (folderMap.size > 0) {
              console.log(`SUCCESS with ${approach.name}! Found ${folderMap.size} dataset folders:`, Array.from(folderMap.keys()));

              const processedDatasets = Array.from(folderMap.entries()).map(([folderPath, folderData]) => {
                const folderName = folderPath.split('/')[1]; // Extract folder name from raw/folderName

                // Try to determine if this is a Synthea dataset or user-uploaded dataset
                const isUserUpload = folderName.includes('-') && /\d{13}$/.test(folderName); // Check for timestamp pattern
                const displayName = isUserUpload
                  ? folderName.replace(/-\d{13}$/, '').replace(/-/g, ' ') // Remove timestamp and clean up
                  : folderName;

                // Separate data files from metadata files
                const allFiles = folderData.files.map(f => ({
                  name: f.key.split('/').pop(),
                  key: f.key,
                  size: f.size,
                  lastModified: f.lastModified,
                  isMetadata: f.key.includes('/metadata/')
                }));

                const dataFiles = allFiles.filter(f => !f.isMetadata);
                const metadataFiles = allFiles.filter(f => f.isMetadata);

                return {
                  id: folderPath,
                  name: displayName,
                  key: folderPath,
                  size: folderData.totalSize,
                  lastModified: folderData.lastModified,
                  format: 'folder',
                  path: folderPath,
                  accessLevel: approach.config.level,
                  source: isUserUpload ? 'User Dataset' : 'Synthea Dataset',
                  fileCount: folderData.files.length,
                  dataFileCount: dataFiles.length,
                  metadataFileCount: metadataFiles.length,
                  files: dataFiles, // Default files list contains only data files
                  dataFiles: dataFiles,
                  metadataFiles: metadataFiles,
                  allFiles: allFiles
                };
              });

              console.log('Processed dataset folders:', processedDatasets);
              allDatasets.push(...processedDatasets);
              break; // Found datasets, no need to try other approaches
            }
          } else {
            console.log(`${approach.name} - No files found in raw directory`);
          }
        } catch (error) {
          console.log(`${approach.name} failed:`, error.message);
          continue;
        }
      }
    } catch (error) {
      console.error('Error loading datasets from raw folder:', error);
      // Continue even if raw datasets fail
    }

    // Second, get user datasets from user-uploads/raw/ folder
    console.log('Loading user datasets from user-uploads/raw/ directory...');
    try {
      const userFiles = await Storage.list('user-uploads/', {
        pageSize: 1000,
        level: 'protected'
      });

      console.log('User files found:', userFiles.map(f => f.key));

      // Filter for files in user-uploads/raw/ (structured datasets)
      const userRawFiles = userFiles.filter(file => {
        return file.key.startsWith('user-uploads/raw/') &&
          file.key !== 'user-uploads/raw/' &&
          file.key.split('/').length >= 4 && // user-uploads/raw/dataset-folder/file.ext
          !file.key.endsWith('/'); // Exclude folder entries, only include actual files
      });

      console.log('User dataset files in user-uploads/raw/:', userRawFiles.map(f => f.key));

      if (userRawFiles.length > 0) {
        // Group files by their dataset folder under user-uploads/raw/
        const userFolderMap = new Map();

        userRawFiles.forEach(file => {
          const pathParts = file.key.split('/');
          // Ensure we have: user-uploads/raw/dataset-folder/file.ext (minimum 4 parts)
          if (pathParts.length >= 4 && pathParts[0] === 'user-uploads' && pathParts[1] === 'raw' && pathParts[2] !== '') {
            const folderName = pathParts[2]; // The dataset folder under user-uploads/raw/
            const folderPath = `user-uploads/raw/${folderName}`;

            if (!userFolderMap.has(folderPath)) {
              userFolderMap.set(folderPath, {
                files: [],
                totalSize: 0,
                lastModified: new Date(0)
              });
            }

            const folderData = userFolderMap.get(folderPath);
            folderData.files.push(file);
            folderData.totalSize += file.size || 0;

            if (file.lastModified && file.lastModified > folderData.lastModified) {
              folderData.lastModified = file.lastModified;
            }
          }
        });

        if (userFolderMap.size > 0) {
          console.log(`Found ${userFolderMap.size} user dataset folders in user-uploads/raw/:`, Array.from(userFolderMap.keys()));

          const userProcessedDatasets = Array.from(userFolderMap.entries()).map(([folderPath, folderData]) => {
            const folderName = folderPath.split('/')[2]; // Extract folder name from user-uploads/raw/folderName

            // Clean up the display name (remove timestamp if present)
            const isTimestamped = folderName.includes('-') && /\d{13}$/.test(folderName);
            const displayName = isTimestamped
              ? folderName.replace(/-\d{13}$/, '').replace(/-/g, ' ') // Remove timestamp and clean up
              : folderName;

            // Separate data files from metadata files
            const allFiles = folderData.files.map(f => ({
              name: f.key.split('/').pop(),
              key: f.key,
              size: f.size,
              lastModified: f.lastModified,
              isMetadata: f.key.includes('/metadata/')
            }));

            const dataFiles = allFiles.filter(f => !f.isMetadata);
            const metadataFiles = allFiles.filter(f => f.isMetadata);

            return {
              id: folderPath,
              name: displayName,
              key: folderPath,
              size: folderData.totalSize,
              lastModified: folderData.lastModified,
              format: 'folder',
              path: folderPath,
              accessLevel: 'protected',
              source: 'User Dataset',
              fileCount: folderData.files.length,
              dataFileCount: dataFiles.length,
              metadataFileCount: metadataFiles.length,
              files: dataFiles, // Default files list contains only data files
              dataFiles: dataFiles,
              metadataFiles: metadataFiles,
              allFiles: allFiles
            };
          });

          console.log('Processed user dataset folders:', userProcessedDatasets);
          allDatasets.push(...userProcessedDatasets);
        }
      }
    } catch (error) {
      console.error('Error loading user datasets from user-uploads/raw/:', error);
      // Continue even if user datasets fail
    }

    // Third, load external datasets and integrate them
    console.log('Loading external datasets...');
    try {
      const externalDatasets = await externalDatasetIntegrationService.loadExternalDatasets();
      console.log(`Found ${externalDatasets.length} external datasets`);
      allDatasets.push(...externalDatasets);
    } catch (error) {
      console.error('Error loading external datasets:', error);
      // Continue even if external datasets fail
    }

    console.log(`Total datasets found: ${allDatasets.length}`);
    return allDatasets;

  } catch (error) {
    console.error('Error listing datasets:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
    throw new Error(`Failed to load datasets: ${error.message}`);
  }
};

// List only user-uploaded datasets (for dashboard)
export const listUserDatasets = async () => {
  try {
    console.log('Attempting to list only user-uploaded datasets...');

    const userDatasets = [];

    // Get user datasets from user-uploads/raw/ folder (structured datasets) and individual uploads
    try {
      // First, check for structured user datasets in user-uploads/raw/ folder
      console.log('Checking for structured user datasets in user-uploads/raw/...');

      const userFiles = await Storage.list('user-uploads/', {
        pageSize: 1000,
        level: 'protected'
      });

      console.log('All user-uploads files found:', userFiles.map(f => f.key));

      // Filter for files in user-uploads/raw/ (structured datasets)
      const rawFiles = userFiles.filter(file => {
        return file.key.startsWith('user-uploads/raw/') &&
          file.key !== 'user-uploads/raw/' &&
          file.key.split('/').length >= 4 && // user-uploads/raw/dataset-folder/file.ext
          !file.key.endsWith('/'); // Exclude folder entries, only include actual files
      });

      console.log('Structured dataset files in user-uploads/raw/:', rawFiles.map(f => f.key));

      if (rawFiles.length > 0) {
        // Group files by their dataset folder under user-uploads/raw/
        const folderMap = new Map();

        rawFiles.forEach(file => {
          const pathParts = file.key.split('/');
          // Ensure we have: user-uploads/raw/dataset-folder/file.ext (minimum 4 parts)
          if (pathParts.length >= 4 && pathParts[0] === 'user-uploads' && pathParts[1] === 'raw' && pathParts[2] !== '') {
            const folderName = pathParts[2]; // The dataset folder under user-uploads/raw/
            const folderPath = `user-uploads/raw/${folderName}`;

            if (!folderMap.has(folderPath)) {
              folderMap.set(folderPath, {
                files: [],
                totalSize: 0,
                lastModified: new Date(0)
              });
            }

            const folderData = folderMap.get(folderPath);
            folderData.files.push(file);
            folderData.totalSize += file.size || 0;

            if (file.lastModified && file.lastModified > folderData.lastModified) {
              folderData.lastModified = file.lastModified;
            }
          }
        });

        if (folderMap.size > 0) {
          console.log(`Found ${folderMap.size} user dataset folders:`, Array.from(folderMap.keys()));

          const processedDatasets = Array.from(folderMap.entries()).map(([folderPath, folderData]) => {
            const folderName = folderPath.split('/')[2]; // Extract folder name from user-uploads/raw/folderName

            // Clean up the display name (remove timestamp if present)
            const isTimestamped = folderName.includes('-') && /\d{13}$/.test(folderName);
            const displayName = isTimestamped
              ? folderName.replace(/-\d{13}$/, '').replace(/-/g, ' ') // Remove timestamp and clean up
              : folderName;

            // Separate data files from metadata files
            const allFiles = folderData.files.map(f => ({
              name: f.key.split('/').pop(),
              key: f.key,
              size: f.size,
              lastModified: f.lastModified,
              isMetadata: f.key.includes('/metadata/')
            }));

            const dataFiles = allFiles.filter(f => !f.isMetadata);
            const metadataFiles = allFiles.filter(f => f.isMetadata);

            return {
              id: folderName, // Use just the folder name as ID instead of full path
              name: displayName,
              key: folderPath,
              size: folderData.totalSize,
              lastModified: folderData.lastModified,
              format: 'folder',
              path: folderPath,
              accessLevel: 'protected',
              source: 'User Dataset',
              fileCount: folderData.files.length,
              dataFileCount: dataFiles.length,
              metadataFileCount: metadataFiles.length,
              files: dataFiles, // Default files list contains only data files
              dataFiles: dataFiles,
              metadataFiles: metadataFiles,
              allFiles: allFiles
            };
          });

          userDatasets.push(...processedDatasets);
        }
      }

      // Also check for individual file uploads in user-uploads/ (not in raw subfolder)
      try {
        console.log('Checking for individual file uploads...');

        // Filter for individual files (not in raw subfolder)
        const individualFiles = userFiles.filter(file => {
          return file.key.startsWith('user-uploads/') &&
            !file.key.startsWith('user-uploads/raw/') &&
            file.key !== 'user-uploads/' &&
            file.key.split('/').length === 2 && // user-uploads/file.ext
            file.size > 0 &&
            !file.key.endsWith('/');
        });

        console.log('Individual user uploads found:', individualFiles.map(f => f.key));

        if (individualFiles.length > 0) {
          // Group files by upload session (files uploaded within 5 minutes of each other)
          // Sort by last modified date
          const sortedFiles = individualFiles
            .sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));

          const sessionGroups = [];
          let currentSession = [];
          let sessionStartTime = null;

          sortedFiles.forEach(file => {
            const fileTime = new Date(file.lastModified);

            // If this is the first file or it's within 5 minutes of the session start
            if (!sessionStartTime || (fileTime - sessionStartTime) <= 5 * 60 * 1000) {
              if (!sessionStartTime) sessionStartTime = fileTime;
              currentSession.push(file);
            } else {
              // Start a new session
              if (currentSession.length > 0) {
                sessionGroups.push([...currentSession]);
              }
              currentSession = [file];
              sessionStartTime = fileTime;
            }
          });

          // Add the last session
          if (currentSession.length > 0) {
            sessionGroups.push(currentSession);
          }

          // Convert session groups to datasets
          const sessionDatasets = sessionGroups.map((sessionFiles, index) => {
            const totalSize = sessionFiles.reduce((sum, file) => sum + (file.size || 0), 0);
            const latestFile = sessionFiles[sessionFiles.length - 1];

            // Create a meaningful name based on files in the session
            let sessionName;
            if (sessionFiles.length === 1) {
              sessionName = sessionFiles[0].key.split('/').pop().replace(/\.[^/.]+$/, '');
            } else {
              const commonPrefix = findCommonPrefix(sessionFiles.map(f => f.key.split('/').pop()));
              sessionName = commonPrefix || `Upload Session ${latestFile.lastModified.toLocaleDateString()}`;
            }

            return {
              id: `user-session-${latestFile.lastModified.getTime()}-${index}`,
              name: sessionName,
              key: `user-uploads-session-${index}`,
              size: totalSize,
              lastModified: latestFile.lastModified,
              format: 'session',
              path: 'user-uploads/',
              accessLevel: 'protected',
              source: 'User Upload',
              fileCount: sessionFiles.length,
              files: sessionFiles.map(file => ({
                name: file.key.split('/').pop(),
                key: file.key,
                size: file.size,
                lastModified: file.lastModified
              }))
            };
          });

          userDatasets.push(...sessionDatasets);
        }
      } catch (error) {
        console.log('Failed to load individual uploads:', error.message);
      }

    } catch (error) {
      console.error('Error loading user datasets:', error);
    }

    console.log(`Total user datasets found: ${userDatasets.length}`);
    return userDatasets;

  } catch (error) {
    console.error('Error listing user datasets:', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
    throw new Error(`Failed to load user datasets: ${error.message}`);
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

    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename provided');
    }

    // File size limit (e.g., 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // File type validation - more lenient for metadata files
    const DATA_FILE_TYPES = ['text/csv', 'application/json', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const METADATA_FILE_TYPES = [
      'text/csv', 'application/json', 'text/plain', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown', 'application/xml', 'text/xml'
    ];

    const isMetadataFile = filename.includes('/metadata/');
    const allowedTypes = isMetadataFile ? METADATA_FILE_TYPES : DATA_FILE_TYPES;

    if (!allowedTypes.includes(file.type) && !isMetadataFile) {
      // For metadata files, also allow files with certain extensions even if MIME type is not recognized
      if (isMetadataFile && file.name && file.name.match(/\.(txt|md|readme|yml|yaml|pdf|doc|docx)$/i)) {
        // Allow these file extensions for metadata
      } else {
        throw new Error('File type not supported. Please upload CSV, JSON, or Excel files for data, or PDF, DOC, TXT files for metadata.');
      }
    }

    // Determine the key and access level based on the filename
    let key, accessLevel;

    if (filename.startsWith('user-uploads/raw/') || filename.startsWith('raw/')) {
      // This is a structured dataset upload - use protected level for user uploads
      key = filename.startsWith('user-uploads/') ? filename : `user-uploads/${filename}`;
      accessLevel = 'protected';
    } else {
      // This is an individual file upload - add user-uploads prefix and use protected level
      key = `user-uploads/${filename}`;
      accessLevel = 'protected';
    }

    console.log('Uploading file:', {
      key,
      accessLevel,
      contentType: file.type,
      size: file.size
    });

    // Simplified metadata to avoid signing issues
    const metadata = {
      uploadedAt: new Date().toISOString(),
      originalFilename: file.name || 'unknown',
      fileSize: String(file.size || 0)
    };

    // Simplified options to avoid canonical headers issues
    const options = {
      level: accessLevel,
      metadata,
      contentType: file.type || 'application/octet-stream'
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

// Enhanced CSV loading function with PapaParse
export const loadCsvDataset = async (key, accessLevel = 'protected') => {
  try {
    console.log(`Loading CSV dataset: ${key} with access level: ${accessLevel}`);

    let csvContent;

    // Check if this is an external dataset
    if (key.startsWith('external://')) {
      // Extract connection and file info from external key format: external://connectionId/fileId
      const keyParts = key.replace('external://', '').split('/');
      const connectionId = keyParts[0];
      const fileId = keyParts.slice(1).join('/');
      
      console.log(`Loading external dataset - Connection: ${connectionId}, File: ${fileId}`);
      
      // Find the dataset document to get proper metadata
      const externalDatasets = await externalDatasetIntegrationService.loadExternalDatasets();
      const dataset = externalDatasets.find(d => d.external?.connectionId === connectionId && d.external?.externalFileId === fileId);
      
      if (!dataset) {
        throw new Error('External dataset not found or connection unavailable');
      }
      
      // Get content from external storage
      const externalContent = await externalDatasetIntegrationService.getExternalDatasetContent(dataset);
      csvContent = externalContent.content;
    } else {
      // Standard internal dataset - download from S3
      const result = await Storage.get(key, {
        level: accessLevel,
        download: true
      });
      csvContent = await result.Body.text();
    }

    // Parse with PapaParse
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => {
          // Clean up data
          if (value === '' || value === 'null' || value === 'NULL') {
            return null;
          }
          return value.trim();
        },
        complete: (results) => {
          resolve({
            data: results.data,
            meta: results.meta,
            rowCount: results.data.length,
            columns: results.meta.fields,
            fileName: key.split('/').pop(),
            isExternal: key.startsWith('external://')
          });
        },
        error: reject
      });
    });
  } catch (error) {
    console.error(`Error loading CSV dataset ${key}:`, error);
    throw error;
  }
};

// Enhanced dataset listing with better permission handling
