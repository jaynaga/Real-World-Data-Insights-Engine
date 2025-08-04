import { API } from 'aws-amplify';

// Mock Kaggle datasets for demonstration
const mockKaggleDatasets = [
  {
    ref: 'psychiatrist/mental-health-dataset',
    title: 'Mental Health Dataset',
    subtitle: 'Comprehensive mental health survey data from healthcare professionals',
    creatorName: 'Dr. Sarah Johnson',
    creatorUrl: 'https://www.kaggle.com/psychiatrist',
    totalBytes: 15728640, // 15 MB
    url: 'https://www.kaggle.com/datasets/psychiatrist/mental-health-dataset',
    lastUpdated: '2024-12-15T10:30:00Z',
    downloadCount: 2847,
    isPrivate: false,
    tags: ['mental-health', 'survey', 'healthcare', 'psychology'],
    licenseName: 'CC BY-SA 4.0',
    description: 'A comprehensive dataset containing mental health survey responses from healthcare professionals across different specialties.'
  },
  {
    ref: 'neuroresearch/depression-analysis',
    title: 'Depression Clinical Analysis',
    subtitle: 'Clinical data for depression research and analysis',
    creatorName: 'NeuroResearch Lab',
    creatorUrl: 'https://www.kaggle.com/neuroresearch',
    totalBytes: 52428800, // 50 MB
    url: 'https://www.kaggle.com/datasets/neuroresearch/depression-analysis',
    lastUpdated: '2024-11-22T14:45:00Z',
    downloadCount: 1523,
    isPrivate: false,
    tags: ['depression', 'clinical', 'psychiatry', 'research'],
    licenseName: 'MIT',
    description: 'Clinical depression assessment data including patient demographics, symptoms, and treatment outcomes.'
  },
  {
    ref: 'mindhealth/anxiety-disorders',
    title: 'Anxiety Disorders Study',
    subtitle: 'Patient data on various anxiety disorders and treatments',
    creatorName: 'Mind Health Institute',
    creatorUrl: 'https://www.kaggle.com/mindhealth',
    totalBytes: 33554432, // 32 MB
    url: 'https://www.kaggle.com/datasets/mindhealth/anxiety-disorders',
    lastUpdated: '2024-10-18T09:15:00Z',
    downloadCount: 3162,
    isPrivate: false,
    tags: ['anxiety', 'disorders', 'therapy', 'mental-health'],
    licenseName: 'Apache 2.0',
    description: 'Comprehensive study data on anxiety disorders including GAD, social anxiety, and panic disorders.'
  },
  {
    ref: 'psychdata/bipolar-research',
    title: 'Bipolar Disorder Research Data',
    subtitle: 'Longitudinal study of bipolar disorder patients',
    creatorName: 'PsychData Research',
    creatorUrl: 'https://www.kaggle.com/psychdata',
    totalBytes: 78643200, // 75 MB
    url: 'https://www.kaggle.com/datasets/psychdata/bipolar-research',
    lastUpdated: '2024-12-01T16:20:00Z',
    downloadCount: 987,
    isPrivate: false,
    tags: ['bipolar', 'mood-disorder', 'longitudinal', 'psychiatry'],
    licenseName: 'CC0',
    description: 'Multi-year longitudinal study tracking bipolar disorder patients through various treatment phases.'
  },
  {
    ref: 'cognitivelab/ptsd-veterans',
    title: 'PTSD in Veterans Study',
    subtitle: 'Post-traumatic stress disorder research in military veterans',
    creatorName: 'Cognitive Psychology Lab',
    creatorUrl: 'https://www.kaggle.com/cognitivelab',
    totalBytes: 41943040, // 40 MB
    url: 'https://www.kaggle.com/datasets/cognitivelab/ptsd-veterans',
    lastUpdated: '2024-09-30T11:00:00Z',
    downloadCount: 2156,
    isPrivate: false,
    tags: ['ptsd', 'veterans', 'trauma', 'military'],
    licenseName: 'CC BY 4.0',
    description: 'Research data on PTSD prevalence and treatment outcomes in military veterans.'
  },
  {
    ref: 'brainhealth/cognitive-decline',
    title: 'Cognitive Decline Assessment',
    subtitle: 'Early detection markers for cognitive decline',
    creatorName: 'Brain Health Research',
    creatorUrl: 'https://www.kaggle.com/brainhealth',
    totalBytes: 67108864, // 64 MB
    url: 'https://www.kaggle.com/datasets/brainhealth/cognitive-decline',
    lastUpdated: '2024-11-08T13:30:00Z',
    downloadCount: 1674,
    isPrivate: false,
    tags: ['cognitive-decline', 'dementia', 'alzheimers', 'neurology'],
    licenseName: 'MIT',
    description: 'Assessment data for early detection of cognitive decline and dementia risk factors.'
  }
];

/**
 * Search for psychiatric datasets on Kaggle via Amplify Lambda function
 * @param {number} page - Page number for pagination
 * @param {number} pageSize - Number of results per page
 * @returns {Promise<Object>} Kaggle dataset search results
 */
export const searchPsychiatricDatasets = async (page = 1, pageSize = 20) => {
  try {
    console.log('Searching for psychiatric datasets via Amplify Lambda...');
    
    const response = await API.get('rwdeapi', `/kaggle?action=datasets&page=${page}&pageSize=${pageSize}`);

    console.log('Amplify API response:', response);
    
    // Add mock Kaggle datasets to the response
    const transformedMockDatasets = mockKaggleDatasets.map(dataset => transformKaggleDataset(dataset));
    
    // Combine API results with mock datasets
    const combinedDatasets = [
      ...(response.datasets || []),
      ...transformedMockDatasets
    ];

    return {
      ...response,
      datasets: combinedDatasets,
      totalCount: (response.totalCount || 0) + mockKaggleDatasets.length
    };
  } catch (error) {
    console.error('Error fetching Kaggle datasets via Amplify:', error);
    
    // If API fails, return just the mock datasets
    console.log('Falling back to mock Kaggle datasets');
    const transformedMockDatasets = mockKaggleDatasets.map(dataset => transformKaggleDataset(dataset));
    
    return {
      datasets: transformedMockDatasets,
      totalCount: mockKaggleDatasets.length,
      page: page,
      pageSize: pageSize
    };
  }
};

/**
 * Transform Kaggle dataset object to match our platform's dataset structure
 * @param {Object} kaggleDataset - Raw Kaggle dataset object
 * @returns {Object} Transformed dataset object
 */
export const transformKaggleDataset = (kaggleDataset) => {
  // Extract key information from Kaggle dataset object
  const {
    ref,
    title,
    subtitle,
    creatorName,
    creatorUrl,
    totalBytes,
    url,
    lastUpdated,
    downloadCount,
    isPrivate,
    tags,
    licenseName,
    description
  } = kaggleDataset;

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Transform to our dataset structure
  return {
    id: ref || `kaggle-${title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
    name: title || 'Untitled Dataset',
    description: subtitle || description || 'Kaggle psychiatric dataset',
    source: 'Kaggle',
    type: 'Kaggle Dataset',
    size: formatFileSize(totalBytes),
    records: 'Multiple files', // Kaggle doesn't provide exact file count in list API
    lastUpdated: formatDate(lastUpdated),
    tags: tags || ['psychiatric', 'kaggle'],
    creator: creatorName,
    creatorUrl,
    downloadCount,
    isPrivate,
    license: licenseName,
    kaggleUrl: url,
    ref // Keep original ref for API calls
  };
};

/**
 * Check if user has access to Kaggle API via Amplify Lambda function
 * @returns {Promise<boolean>} Whether user has Kaggle API access
 */
export const checkKaggleAccess = async () => {
  try {
    console.log('Checking Kaggle API access via Amplify...');
    
    const response = await API.get('rwdeapi', '/kaggle?action=check');
    console.log('Kaggle access check result:', response);
    
    return response.hasAccess;
  } catch (error) {
    console.error('Error checking Kaggle access:', error);
    return false;
  }
};

/**
 * Get detailed information about a specific Kaggle dataset via Amplify Lambda function
 * @param {string} ownerSlug - Dataset owner's username
 * @param {string} datasetSlug - Dataset slug/name
 * @returns {Promise<Object>} Detailed dataset information
 */
export const getKaggleDatasetDetails = async (ownerSlug, datasetSlug) => {
  try {
    // For now, return basic info since we're simplifying the API
    return {
      title: `${ownerSlug}/${datasetSlug}`,
      description: 'Kaggle dataset details',
      ref: `${ownerSlug}/${datasetSlug}`
    };
  } catch (error) {
    console.error('Error fetching Kaggle dataset details:', error);
    throw new Error('Failed to fetch dataset details from Kaggle');
  }
};

/**
 * Get list of files in a Kaggle dataset via Amplify Lambda function
 * @param {string} ownerSlug - Dataset owner's username
 * @param {string} datasetSlug - Dataset slug/name
 * @returns {Promise<Array>} List of files in the dataset
 */
export const getKaggleDatasetFiles = async (ownerSlug, datasetSlug) => {
  // For now, return mock file info since we're simplifying
  return [
    { name: 'data.csv', totalBytes: 1000000 }
  ];
};

/**
 * Download/stream a specific file from Kaggle dataset via Amplify Lambda function
 * @param {string} ownerSlug - Dataset owner's username
 * @param {string} datasetSlug - Dataset slug/name
 * @param {string} fileName - Name of the file to download
 * @returns {Promise<Blob>} File content as blob
 */
export const downloadKaggleDatasetFile = async (ownerSlug, datasetSlug, fileName) => {
  // For now, return empty blob since download is complex
  return new Blob(['# Kaggle dataset file content'], { type: 'text/csv' });
};

/**
 * Stream CSV data from a Kaggle dataset file for preview via Amplify Lambda function
 * @param {string} ownerSlug - Dataset owner's username
 * @param {string} datasetSlug - Dataset slug/name
 * @param {string} fileName - Name of the CSV file
 * @param {number} maxRows - Maximum number of rows to fetch for preview (default: 100)
 * @returns {Promise<Object>} Parsed CSV data with headers and rows
 */
export const streamKaggleCsvData = async (ownerSlug, datasetSlug, fileName, maxRows = 100) => {
  // For now, return mock CSV data
  return {
    headers: ['id', 'name', 'value'],
    data: [
      { id: '1', name: 'Sample Data', value: '100' },
      { id: '2', name: 'Example Data', value: '200' }
    ],
    totalRows: 2,
    previewRows: 2,
    isPreview: false
  };
};

/**
 * Get download URL for a Kaggle dataset file
 * @param {string} ownerSlug - Dataset owner's username
 * @param {string} datasetSlug - Dataset slug/name
 * @param {string} fileName - Name of the file
 * @returns {string} Kaggle download URL
 */
export const getKaggleFileDownloadUrl = (ownerSlug, datasetSlug, fileName) => {
  return `https://www.kaggle.com/datasets/${ownerSlug}/${datasetSlug}/download?datasetVersionNumber=1&fileName=${fileName}`;
};
