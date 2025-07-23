import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaProjectDiagram, FaDatabase, FaUsers, FaClipboardList } from 'react-icons/fa';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import { listDatasets } from '../utils/storageUtils';
import { createProject } from '../services/projectService';

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'analysis',
    collaborators: '',
    selectedDatasets: [],
    researchGoals: '',
    expectedOutcomes: '',
    timeline: 'short-term',
    priority: 'medium'
  });

  const [errors, setErrors] = useState({});

  // Load available datasets
  const loadDatasets = async () => {
    if (datasets.length > 0) return; // Don't reload if already loaded

    console.log('Loading datasets for project creation...');
    setDatasetsLoading(true);
    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Dataset loading timeout')), 10000)
      );

      const availableDatasets = await Promise.race([
        listDatasets(),
        timeoutPromise
      ]);

      console.log('Datasets loaded successfully:', availableDatasets);
      setDatasets(availableDatasets);
    } catch (error) {
      console.error('Error loading datasets:', error);
      setDatasets([]);
      // Don't block the form if datasets fail to load
    } finally {
      setDatasetsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDatasetToggle = (datasetId) => {
    setFormData(prev => ({
      ...prev,
      selectedDatasets: prev.selectedDatasets.includes(datasetId)
        ? prev.selectedDatasets.filter(id => id !== datasetId)
        : [...prev.selectedDatasets, datasetId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form submission started...');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, creating project...');
    setLoading(true);
    try {
      const projectData = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'draft',
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('Project data prepared:', projectData);

      const result = await createProject(projectData);
      console.log('Project created successfully:', result);

      // Add a small delay to ensure S3 consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to the projects list with success message
      navigate('/projects', {
        state: {
          message: `Project "${projectData.title}" created successfully!`,
          type: 'success',
          projectId: result.id
        }
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: 'Failed to create project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'analysis', label: 'Data Analysis', icon: '📊' },
    { value: 'research', label: 'Research Study', icon: '🔬' },
    { value: 'reporting', label: 'Reporting', icon: '📋' },
    { value: 'visualization', label: 'Data Visualization', icon: '📈' },
    { value: 'other', label: 'Other', icon: '📁' }
  ];

  const timelines = [
    { value: 'short-term', label: 'Short-term (< 1 month)' },
    { value: 'medium-term', label: 'Medium-term (1-6 months)' },
    { value: 'long-term', label: 'Long-term (> 6 months)' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  return (
    <div className="min-h-screen page-bg text-textPrimary-light dark:text-textPrimary-dark">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2 hover:underline"
          >
            <FaArrowLeft /> Back to Projects
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <FaProjectDiagram className="text-2xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Create New Project</h1>
            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Set up a new data analysis project
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaClipboardList className="text-blue-600" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter project title..."
                    className={`w-full px-4 py-2 border rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.title ? 'border-red-500' : 'border-default'
                      }`}
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the project goals, methodology, and expected outcomes..."
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.description ? 'border-red-500' : 'border-default'
                      }`}
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Dataset Selection */}
            <div className="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaDatabase className="text-green-600" />
                Select Datasets (Optional)
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    Choose datasets to include in this project (you can add more later)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDatasetSelector(!showDatasetSelector);
                      if (!showDatasetSelector) loadDatasets();
                    }}
                    disabled={datasetsLoading}
                    className="text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    <HiOutlinePlusCircle />
                    {datasetsLoading ? 'Loading...' : showDatasetSelector ? 'Hide Datasets' : 'Browse Datasets'}
                  </button>
                </div>

                {/* Selected datasets display */}
                {formData.selectedDatasets.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Selected Datasets ({formData.selectedDatasets.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedDatasets.map(datasetId => {
                        const dataset = datasets.find(d => d.id === datasetId);
                        return (
                          <span
                            key={datasetId}
                            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {dataset?.name || datasetId}
                            <button
                              type="button"
                              onClick={() => handleDatasetToggle(datasetId)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dataset selector */}
                {showDatasetSelector && (
                  <div className="border border-default rounded-lg p-4">
                    {datasetsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading datasets...</p>
                      </div>
                    ) : datasets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FaDatabase className="mx-auto text-4xl mb-2" />
                        <p>No datasets available</p>
                        <p className="text-sm">Upload datasets in the Explore section first, or skip this step and add them later</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {datasets.map(dataset => (
                          <label key={dataset.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.selectedDatasets.includes(dataset.id)}
                              onChange={() => handleDatasetToggle(dataset.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{dataset.name}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${dataset.source === 'User Dataset'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  }`}>
                                  {dataset.source === 'User Dataset' ? 'Your Dataset' : 'Synthea'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {dataset.fileCount} files • {(dataset.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUsers className="text-purple-600" />
                Project Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timeline
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {timelines.map(timeline => (
                      <option key={timeline.value} value={timeline.value}>
                        {timeline.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Collaborators
                  </label>
                  <input
                    type="text"
                    value={formData.collaborators}
                    onChange={(e) => handleInputChange('collaborators', e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Research Goals
                  </label>
                  <textarea
                    value={formData.researchGoals}
                    onChange={(e) => handleInputChange('researchGoals', e.target.value)}
                    placeholder="What specific questions are you trying to answer?"
                    rows={3}
                    className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Expected Outcomes
                  </label>
                  <textarea
                    value={formData.expectedOutcomes}
                    onChange={(e) => handleInputChange('expectedOutcomes', e.target.value)}
                    placeholder="What deliverables or insights do you expect to produce?"
                    rows={3}
                    className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-6 py-2 border border-default rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
