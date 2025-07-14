import React, { useState, useEffect } from "react";
import { FiUploadCloud, FiFile, FiX, FiPlus, FiDownload } from "react-icons/fi";
import { uploadFile, listUserUploads, getFileUrl } from '../utils/storageUtils';
import '../styles/tokens.css';

export default function Upload() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Survey Data",
    geography: "North America",
    demographics: [],
    tags: [],
    file: null
  });
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const dataTypes = [
    "Survey Data",
    "Clinical Trials",
    "Longitudinal Studies",
    "Census Data",
    "Administrative Data"
  ];

  const geographyOptions = [
    "North America",
    "Europe",
    "Asia",
    "Africa",
    "South America",
    "Australia/Oceania"
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file) {
      setErrors(prev => ({ ...prev, file: "No file selected" }));
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setErrors(prev => ({ ...prev, file: "File size must be less than 100MB" }));
      return;
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: "File type not supported. Please upload CSV, JSON, or Excel files." }));
      return;
    }

    // Clear any previous file errors
    setErrors(prev => {
      const { file, ...rest } = prev;
      return rest;
    });

    setFormData(prev => ({ ...prev, file }));
    simulateUploadProgress();
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setUploadProgress(0);
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.file) newErrors.file = "File is required";
    if (formData.demographics.length === 0) newErrors.demographics = "Select at least one demographic";
    if (formData.tags.length === 0) newErrors.tags = "Add at least one tag";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!formData.file) {
      setErrors(prev => ({ ...prev, file: "Please select a file to upload" }));
      return;
    }

    try {
      setUploading(true);
      setErrors({});

      // Generate a clean filename
      const fileExtension = getFileExtension(formData.file.name);
      const cleanName = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric chars with dash
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
      const fileName = `${cleanName}-${Date.now()}${fileExtension}`;

      console.log('Starting upload:', {
        fileName,
        fileType: formData.file.type,
        fileSize: formData.file.size
      });

      await uploadFile(formData.file, fileName);
      
      // Clear the form
      setFormData({
        name: "",
        description: "",
        type: "Survey Data",
        geography: "North America",
        demographics: [],
        tags: [],
        file: null
      });
      setUploadProgress(0);
      setErrors({});
      alert("Dataset uploaded successfully!");
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

  const addTag = (e) => {
    e.preventDefault();
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.toLowerCase()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="bg-white dark:bg-card-dark rounded-lg p-6 shadow-sm">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive 
                  ? 'border-accent-light dark:border-accent-dark bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-border-light dark:border-border-dark'
              } ${errors.file ? 'border-red-500 dark:border-red-400' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={handleFileInput}
                accept=".csv,.xlsx,.json"
              />
              
              {formData.file ? (
                <div className="flex items-center justify-center space-x-2">
                  <FiFile className="text-accent-light dark:text-accent-dark" />
                  <span className="text-textPrimary-light dark:text-textPrimary-dark">
                    {formData.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="text-textSecondary-light dark:text-textSecondary-dark">
                  <FiUploadCloud className="mx-auto h-12 w-12 mb-4" />
                  <p>Drag and drop your file here, or</p>
                  <label 
                    htmlFor="fileInput"
                    className="mt-2 inline-block px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-md cursor-pointer hover:bg-opacity-90"
                  >
                    Browse Files
                  </label>
                  <p className="mt-2 text-sm">
                    Supported formats: CSV, XLSX, JSON (max 100MB)
                  </p>
                </div>
              )}
            </div>
            
            {errors.file && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.file}</p>
            )}

            {uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">
                  <span>Upload progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-2 bg-accent-light dark:bg-accent-dark rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

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
                className={`w-full p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border ${
                  errors.name 
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
                className={`w-full p-2 rounded-md bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark border ${
                  errors.description 
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
                      checked={formData.demographics.includes(demo)}
                      onChange={(e) => {
                        const newDemographics = e.target.checked
                          ? [...formData.demographics, demo]
                          : formData.demographics.filter(d => d !== demo);
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
                {formData.tags.map(tag => (
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

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: "",
                  description: "",
                  type: "Survey Data",
                  geography: "North America",
                  demographics: [],
                  tags: [],
                  file: null
                });
                setUploadProgress(0);
                setErrors({});
              }}
              className="px-6 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={!formData.file || uploadProgress > 0 && uploadProgress < 100 || uploading}
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
