import React, { useState, useEffect } from "react";
import { FiUploadCloud, FiFile, FiX, FiPlus, FiDownload, FiInfo, FiFileText, FiCloud, FiHardDrive } from "react-icons/fi";
import { uploadFile, listUserUploads, getFileUrl } from '../utils/storageUtils';
import CloudStorageSelector from '../components/CloudStorageSelector';
import '../styles/tokens.css';

export default function Upload() {
  const [uploadMethod, setUploadMethod] = useState('local'); // 'local' or 'cloud'
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Survey Data",
    geography: "Worldwide",
    demographics: [],
    tags: [],
    files: [], // Multiple files per dataset
    metadataFiles: [], // Multiple metadata files
    cloudFiles: [] // Files from cloud storage
  });
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [metadataDragActive, setMetadataDragActive] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const dataTypes = [
    "Survey Data",
    "Clinical Trials",
    "Longitudinal Studies",
    "Census Data",
    "Administrative Data",
    "Genomic Data",
    "Environmental Data",
    "Financial Data",
    "Educational Data",
    "Healthcare Records",
    "Social Media Data",
    "IoT Sensor Data",
    "Geospatial Data",
    "Time Series Data",
    "Text/Document Corpus",
    "Image Dataset",
    "Audio Dataset",
    "Video Dataset",
    "Scientific Measurements",
    "Experimental Data",
    "Behavioral Data",
    "Demographic Data",
    "Market Research",
    "Government Statistics",
    "Public Health Data"
  ];

  const geographyOptions = [
    "Worldwide",
    "North America",
    "United States",
    "Canada",
    "Mexico",
    "Europe",
    "United Kingdom",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Scandinavia",
    "Eastern Europe",
    "Asia",
    "China",
    "Japan",
    "India",
    "Southeast Asia",
    "South Korea",
    "Middle East",
    "Africa",
    "South Africa",
    "West Africa",
    "East Africa",
    "North Africa",
    "South America",
    "Brazil",
    "Argentina",
    "Colombia",
    "Australia/Oceania",
    "Australia",
    "New Zealand",
    "Pacific Islands",
    "Antarctica",
    "Multi-Regional",
    "Cross-Continental"
  ];

  const demographicOptions = [
    "Children (0-12)",
    "Adolescents (13-17)",
    "Young Adults (18-25)",
    "Adults (26-64)",
    "Seniors (65+)"
  ];

  // Load recent uploads
  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const files = await listUserUploads();
      setUploads(files);
    } catch (error) {
      console.error('Error loading uploads:', error);
      setErrors(prev => ({ ...prev, uploads: "Failed to load recent uploads" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e, isMetadata = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (isMetadata) {
        setMetadataDragActive(true);
      } else {
        setDragActive(true);
      }
    } else if (e.type === "dragleave") {
      if (isMetadata) {
        setMetadataDragActive(false);
      } else {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e, isMetadata = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMetadata) {
      setMetadataDragActive(false);
    } else {
      setDragActive(false);
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (isMetadata) {
        handleMetadataFiles(files);
      } else {
        handleFiles(files);
      }
    }
  };

  const handleFileInput = (e, isMetadata = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (isMetadata) {
        handleMetadataFiles(files);
      } else {
        handleFiles(files);
      }
    }
  };

  const handleFiles = (files) => {
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      console.log('Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Check for duplicate files
      const existingFiles = formData.files || [];
      const isDuplicate = existingFiles.some(existingFile => existingFile.name === file.name);
      if (isDuplicate) {
        errors.push(`${file.name}: This file has already been selected`);
        return;
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        errors.push(`${file.name}: File size must be less than 100MB`);
        return;
      }

      // Validate file type for data files
      const allowedTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported. Please upload CSV, JSON, or Excel files.`);
        return;
      }

      validFiles.push(file);
    });

    console.log('Valid files processed:', validFiles.map(f => ({ name: f.name, size: f.size })));

    if (errors.length > 0) {
      setErrors(prev => ({ ...prev, files: errors.join('; ') }));
    } else {
      setErrors(prev => {
        const { files, ...rest } = prev;
        return rest;
      });
    }

    setFormData(prev => ({
      ...prev,
      files: [...(prev.files || []), ...validFiles]
    }));
  };

  const handleMetadataFiles = (files) => {
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      console.log('Processing metadata file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Check for duplicate metadata files
      const existingMetadataFiles = formData.metadataFiles || [];
      const isDuplicate = existingMetadataFiles.some(existingFile => existingFile.name === file.name);
      if (isDuplicate) {
        errors.push(`${file.name}: This metadata file has already been selected`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit for metadata
        errors.push(`${file.name}: Metadata file size must be less than 50MB`);
        return;
      }

      // More lenient file types for metadata (PDFs, docs, etc.)
      const allowedTypes = [
        'text/csv', 'application/json', 'text/plain', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown', 'application/xml', 'text/xml'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|readme|yml|yaml)$/i)) {
        errors.push(`${file.name}: Metadata file type not supported. Please upload TXT, PDF, DOC, JSON, CSV, or Markdown files.`);
        return;
      }

      validFiles.push(file);
    });

    console.log('Valid metadata files processed:', validFiles.map(f => ({ name: f.name, size: f.size })));

    if (errors.length > 0) {
      setErrors(prev => ({ ...prev, metadataFiles: errors.join('; ') }));
    } else {
      setErrors(prev => {
        const { metadataFiles, ...rest } = prev;
        return rest; // ✅ clears previous metadata errors
      });
    }

    setFormData(prev => ({
      ...prev,
      metadataFiles: [...(prev.metadataFiles || []), ...validFiles]
    }));
  };

  const handleRemoveFile = (index, isMetadata = false) => {
    if (isMetadata) {
      setFormData(prev => ({
        ...prev,
        metadataFiles: (prev.metadataFiles || []).filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        files: (prev.files || []).filter((_, i) => i !== index)
      }));
    }
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleCloudFilesSelected = (cloudFiles) => {
    setFormData(prev => ({
      ...prev,
      cloudFiles: [...prev.cloudFiles, ...cloudFiles]
    }));
  };

  const handleCloudFileRemove = (fileId) => {
    setFormData(prev => ({
      ...prev,
      cloudFiles: prev.cloudFiles.filter(file => file.id !== fileId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) newErrors.name = "Dataset name is required";
    if (!formData.description || !formData.description.trim()) newErrors.description = "Description is required";
    
    // Check for either local files or cloud files
    const hasLocalFiles = formData.files && formData.files.length > 0;
    const hasCloudFiles = formData.cloudFiles && formData.cloudFiles.length > 0;
    if (!hasLocalFiles && !hasCloudFiles) {
      newErrors.files = "At least one data file is required (local or cloud)";
    }
    
    if (!formData.demographics || formData.demographics.length === 0) newErrors.demographics = "Select at least one demographic";
    if (!formData.tags || formData.tags.length === 0) newErrors.tags = "Add at least one tag";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!formData.files || formData.files.length === 0) {
      setErrors(prev => ({ ...prev, files: "Please select at least one data file to upload" }));
      return;
    }

    try {
      setUploading(true);
      setErrors({});
      simulateUploadProgress(); // ✅ start progress bar simulation

      const cleanName = (formData.name || "untitled")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const timestamp = Date.now();
      const datasetPath = `user-uploads/raw/${cleanName}-${timestamp}`;

      console.log('Starting dataset upload:', {
        datasetName: formData.name,
        datasetPath,
        dataFileCount: (formData.files || []).length,
        metadataFileCount: (formData.metadataFiles || []).length
      });

      // Upload all data files to the dataset folder
      const files = formData.files || [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = getFileExtension(file.name);
        const fileName = `${datasetPath}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        console.log(`Uploading data file ${i + 1}/${files.length}:`, fileName);
        await uploadFile(file, fileName);
      }

      // Upload metadata files to a metadata subfolder
      const metadataFiles = formData.metadataFiles || [];
      for (let i = 0; i < metadataFiles.length; i++) {
        const file = metadataFiles[i];
        const fileName = `${datasetPath}/metadata/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        console.log(`Uploading metadata file ${i + 1}/${metadataFiles.length}:`, fileName);
        await uploadFile(file, fileName);
      }

      // Create a dataset info file
      const datasetInfo = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        geography: formData.geography,
        demographics: formData.demographics || [],
        tags: formData.tags || [],
        createdAt: new Date().toISOString(),
        fileCount: (formData.files || []).length,
        metadataFileCount: (formData.metadataFiles || []).length,
        cloudFileCount: (formData.cloudFiles || []).length,
        files: (formData.files || []).map(f => f.name),
        metadataFiles: (formData.metadataFiles || []).map(f => f.name),
        cloudFiles: (formData.cloudFiles || []).map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          cloudProvider: f.cloudProvider,
          downloadUrl: f.downloadUrl,
          shareSettings: f.shareSettings,
          path: f.path
        })),
        isSharedDataset: formData.cloudFiles && formData.cloudFiles.length > 0,
        shareSettings: formData.cloudFiles && formData.cloudFiles.length > 0 ? 
          formData.cloudFiles[0].shareSettings : null
      };

      const infoFileName = `${datasetPath}/dataset-info.json`;
      const infoBlob = new Blob([JSON.stringify(datasetInfo, null, 2)], { type: 'application/json' });
      await uploadFile(infoBlob, infoFileName);

      // Clear the form
      setFormData({
        name: "",
        description: "",
        type: "Survey Data",
        geography: "Worldwide",
        demographics: [],
        tags: [],
        files: [],
        metadataFiles: [],
        cloudFiles: []
      });
      setUploadProgress(0);
      setErrors({});

      alert(`Dataset "${formData.name}" uploaded successfully with ${(formData.files || []).length} data files and ${(formData.metadataFiles || []).length} metadata files!`);

      // Reload uploads
      loadUploads();
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({
        submit: `Failed to upload dataset: ${error.message}. Please try again or contact support if the issue persists.`
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) {
      return 'Size unknown';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (currentTag && !(formData.tags || []).includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.toLowerCase()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDownload = async (key) => {
    try {
      const url = await getFileUrl(key);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      setErrors(prev => ({ ...prev, download: `Failed to download file: ${error.message}` }));
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-textPrimary-light dark:text-textPrimary-dark">
          Upload Dataset
        </h1>

        {/* Upload Method Selector */}
        <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
            Choose Upload Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUploadMethod('local')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                uploadMethod === 'local'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FiHardDrive className={`${uploadMethod === 'local' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                <div>
                  <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                    Upload Local Files
                  </h3>
                  <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    Upload files directly from your computer
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUploadMethod('cloud')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                uploadMethod === 'cloud'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FiCloud className={`${uploadMethod === 'cloud' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                      Share from Cloud Storage
                    </h3>
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    Connect to Google Drive, Dropbox, S3, Azure, etc.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Conditional rendering based on upload method */}
          {uploadMethod === 'local' ? (
            <>
            {/* Local File Upload Section */}
            <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FiFile className="text-accent-light dark:text-accent-dark" />
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                  Dataset Files
                </h2>
              </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <FiInfo className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Important: Multiple File Guidelines</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Upload multiple files <strong>only if they belong to the same dataset</strong></li>
                    <li>Examples: patient_demographics.csv, patient_visits.csv, patient_medications.csv</li>
                    <li>Do NOT mix different datasets - create separate uploads for different studies</li>
                    <li>All files will be grouped together under one dataset name</li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive
                ? 'border-accent-light dark:border-accent-dark bg-blue-50 dark:bg-blue-900/20'
                : 'border-border-light dark:border-border-dark'
                } ${errors.files ? 'border-red-500 dark:border-red-400' : ''}`}
              onDragEnter={(e) => handleDrag(e, false)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => handleDrag(e, false)}
              onDrop={(e) => handleDrop(e, false)}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                multiple
                onChange={(e) => handleFileInput(e, false)}
                accept=".csv,.xlsx,.json"
              />

              {formData.files && formData.files.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-textPrimary-light dark:text-textPrimary-dark font-medium mb-3">
                    {formData.files.length} file(s) selected:
                  </p>
                  {(formData.files || []).map((file, index) => (
                    <div key={`${file.name}-${index}`}>
                      <FiFile className="text-accent-light dark:text-accent-dark" />
                      <span className="text-textPrimary-light dark:text-textPrimary-dark text-sm">
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index, false)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  <label
                    htmlFor="fileInput"
                    className="mt-3 inline-block px-4 py-2 bg-gray-600 text-white rounded-md cursor-pointer hover:bg-gray-700"
                  >
                    Add More Files
                  </label>
                </div>
              ) : (
                <div className="text-textSecondary-light dark:text-textSecondary-dark">
                  <FiUploadCloud className="mx-auto h-12 w-12 mb-4" />
                  <p>Drag and drop your dataset files here, or</p>
                  <label
                    htmlFor="fileInput"
                    className="mt-2 inline-block px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-md cursor-pointer hover:bg-opacity-90"
                  >
                    Browse Files
                  </label>
                  <p className="mt-2 text-sm">
                    Supported formats: CSV, XLSX, JSON (max 100MB each)
                  </p>
                  <p className="text-xs mt-1">
                    You can select multiple files that belong to the same dataset
                  </p>
                </div>
              )}
            </div>

            {errors.files && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.files}</p>
            )}
          </div>

          {/* Metadata Files Upload Area */}
          <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiFileText className="text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                Metadata Files (Optional)
              </h2>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <FiInfo className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800 dark:text-purple-200">
                  <p className="font-medium mb-1">Metadata Files Include:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Data dictionaries (variable definitions, coding schemes)</li>
                    <li>Documentation (study protocols, methodology notes)</li>
                    <li>README files (usage instructions, data collection notes)</li>
                    <li>Codebooks (survey instruments, questionnaires)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${metadataDragActive
                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'border-border-light dark:border-border-dark'
                } ${errors.metadataFiles ? 'border-red-500 dark:border-red-400' : ''}`}
              onDragEnter={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, true)}
              onDragOver={(e) => handleDrag(e, true)}
              onDrop={(e) => handleDrop(e, true)}
            >
              <input
                type="file"
                id="metadataInput"
                className="hidden"
                multiple
                onChange={(e) => handleFileInput(e, true)}
                accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xml"
              />

              {formData.metadataFiles && formData.metadataFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-textPrimary-light dark:text-textPrimary-dark font-medium mb-3">
                    {formData.metadataFiles.length} metadata file(s) selected:
                  </p>
                  {(formData.metadataFiles || []).map((file, index) => (
                    <div key={`${file.name}-${index}`}>
                      <FiFileText className="text-purple-600 dark:text-purple-400" />
                      <span className="text-textPrimary-light dark:text-textPrimary-dark text-sm">
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index, true)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  <label
                    htmlFor="metadataInput"
                    className="mt-3 inline-block px-4 py-2 bg-purple-600 text-white rounded-md cursor-pointer hover:bg-purple-700"
                  >
                    Add More Metadata
                  </label>
                </div>
              ) : (
                <div className="text-textSecondary-light dark:text-textSecondary-dark">
                  <FiFileText className="mx-auto h-10 w-10 mb-3 text-purple-400" />
                  <p>Drag and drop metadata files here, or</p>
                  <label
                    htmlFor="metadataInput"
                    className="mt-2 inline-block px-4 py-2 bg-purple-600 text-white rounded-md cursor-pointer hover:bg-purple-700"
                  >
                    Browse Metadata
                  </label>
                  <p className="mt-2 text-sm">
                    Supported: PDF, DOC, TXT, MD, JSON, CSV, XML (max 50MB each)
                  </p>
                </div>
              )}
            </div>

            {errors.metadataFiles && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.metadataFiles}</p>
            )}
          </div>
          </>
          ) : (
            /* Cloud Storage Import Section */
            <CloudStorageSelector
              onFilesSelected={handleCloudFilesSelected}
              onError={(error) => setErrors(prev => ({ ...prev, cloud: error }))}
            />
          )}

          {/* Display selected cloud files */}
          {formData.cloudFiles && formData.cloudFiles.length > 0 && (
            <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FiCloud className="text-blue-600" />
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                  Selected Cloud Files ({formData.cloudFiles.length})
                </h2>
              </div>
              
              <div className="space-y-2">
                {formData.cloudFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FiFile className="text-gray-400" />
                      <div>
                        <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                          {file.name}
                        </div>
                        <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                          {file.cloudProvider} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCloudFileRemove(file.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {errors.cloud && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.cloud}</p>
              )}
            </div>
          )}

          {/* Dataset Information */}
          <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-1">
                Dataset Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                className={`w-full p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border ${errors.name
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-border-light dark:border-border-dark'
                  } focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                }}
                className={`w-full p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border ${errors.description
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-border-light dark:border-border-dark'
                  } focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark`}
                rows="4"
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-1">
                  Data Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                >
                  {dataTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-1">
                  Geography *
                </label>
                <select
                  value={formData.geography}
                  onChange={(e) => setFormData(prev => ({ ...prev, geography: e.target.value }))}
                  className="w-full p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                >
                  {geographyOptions.map(geo => (
                    <option key={geo} value={geo}>{geo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-1">
                Demographics *
              </label>
              <div className="space-y-2">
                {demographicOptions.map(demo => (
                  <label key={demo} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData.demographics || []).includes(demo)}
                      onChange={(e) => {
                        const newDemographics = e.target.checked
                          ? [...(formData.demographics || []), demo]
                          : (formData.demographics || []).filter(d => d !== demo);
                        setFormData(prev => ({
                          ...prev,
                          demographics: newDemographics
                        }));
                        if (errors.demographics) setErrors(prev => ({ ...prev, demographics: null }));
                      }}
                      className="w-4 h-4 text-accent-light dark:text-accent-dark focus:ring-accent-light dark:focus:ring-accent-dark rounded"
                    />
                    <span className="text-textPrimary-light dark:text-textPrimary-dark">{demo}</span>
                  </label>
                ))}
              </div>
              {errors.demographics && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.demographics}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-1">
                Tags *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.tags || []).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 hover:text-red-500"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e);
                    }
                  }}
                  placeholder="Add a tag"
                  className="flex-1 p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-md hover:bg-opacity-90"
                >
                  <FiPlus />
                </button>
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.tags}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={uploading || formData.files.length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Dataset'}
            </button>
          </div>
        </form>

        {/* Recent Uploads Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">
            Recent Uploads
          </h2>

          {loading ? (
            <p className="text-textSecondary-light dark:text-textSecondary-dark">Loading...</p>
          ) : uploads.length > 0 ? (
            <div className="bg-white dark:bg-card-dark rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y divide-border-light dark:divide-border-dark">
                {uploads.map((file) => (
                  <div key={file.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FiFile className="text-accent-light dark:text-accent-dark" />
                      <div>
                        <h3 className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                          {file.name}
                        </h3>
                        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                          {new Date(file.lastModified).toLocaleDateString()} •
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file.key)}
                      className="p-2 text-accent-light dark:text-accent-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Download file"
                    >
                      <FiDownload />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-textSecondary-light dark:text-textSecondary-dark">
              No uploads found. Upload your first dataset above!
            </p>
          )}

          {errors.uploads && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.uploads}</p>
          )}
        </div>
      </div>
    </div>
  );
}
