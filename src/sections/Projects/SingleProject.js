import React, { useState, useEffect, useCallback } from 'react';
import AINotebookGenerator from '../../components/AINotebookGenerator';
import AIDatasetAssistant from '../../components/AIDatasetAssistant';
import { FaArrowLeft, FaShareAlt, FaDownload, FaChartBar, FaDatabase, FaEdit, FaTrash, FaFolder, FaFolderOpen, FaFile, FaEye, FaRobot } from 'react-icons/fa';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import { MdOutlineDashboard } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProjectStatus, deleteProject, addDatasetToProject, removeDatasetFromProject } from '../../services/projectService';
import { listDatasets, loadCsvDataset } from '../../utils/storageUtils';
import { listFiles as listS3Files } from '../../utils/storageUtils';
import { Storage } from 'aws-amplify';

export default function SingleProject() {
  const [lastGeneratedNotebook, setLastGeneratedNotebook] = useState(null);
  // Handler for notebook generation completion
  const handleNotebookGenerated = (notebookJson) => {
    setLastGeneratedNotebook(notebookJson);
    // Optionally, auto-navigate to IDE here if desired
    fetchProjectNotebooks();
  };
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const handleOpenNotebookModal = () => setShowNotebookModal(true);
  const handleCloseNotebookModal = () => setShowNotebookModal(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectDatasets, setProjectDatasets] = useState([]);
  const [projectNotebooks, setProjectNotebooks] = useState([]);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  
  // Dataset viewer state
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [expandedDatasets, setExpandedDatasets] = useState(new Set()); // Track which datasets are expanded
  
  // Dataset selection state
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetSearchQuery, setDatasetSearchQuery] = useState('');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDatasetSearchQuery, setEditDatasetSearchQuery] = useState('');

  // AI Dataset Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const handleOpenAIAssistant = () => setShowAIAssistant(true);
  const handleCloseAIAssistant = () => setShowAIAssistant(false);

  // Fetch notebooks for this project from S3 using Amplify Storage
  const fetchProjectNotebooks = async () => {
    if (!id) return;
    try {
      // ✅ Amplify automatically resolves current user's identity when using level: 'protected'
      const files = await listS3Files(`notebooks/${id}/`, { level: 'protected' });
      const notebooks = files.filter(f => f.type === 'ipynb');
      setProjectNotebooks(notebooks);
    } catch (err) {
      console.error('Error fetching project notebooks:', err);
      setProjectNotebooks([]);
    }
  };

  const loadProject = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const [projectData, availableDatasets] = await Promise.all([
        getProject(id),
        listDatasets()
      ]);

      setProject(projectData);

      console.log('🔍 Loaded project data:', projectData);
      console.log('🔍 Dashboard config found:', !!projectData.dashboardConfig);
      if (projectData.dashboardConfig) {
        console.log('🔍 Dashboard config details:', projectData.dashboardConfig);
      }

      // Filter datasets that are part of this project
      const projectDatasetList = availableDatasets.filter(dataset =>
        projectData.selectedDatasets?.includes(dataset.id)
      );
      setProjectDatasets(projectDatasetList);

    } catch (error) {
      console.error('Error loading project:', error);

      // If project not found and it's a new project (retry up to 3 times with delays)
      if (error.message.includes('Project not found') && retryCount < 3) {
        console.log(`Project not found, retrying in ${(retryCount + 1) * 1000}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          loadProject(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Add useEffect hooks after loadProject is declared
  useEffect(() => {
    if (id) {
      loadProject();
      fetchProjectNotebooks();
    }
    // eslint-disable-next-line
  }, [id, loadProject]);

  // Add effect to reload project when user returns to the page (to pick up dashboard changes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        loadProject(); // Reload project data when page becomes visible
      }
    };

    const handleFocus = () => {
      if (id) {
        loadProject(); // Reload project data when window gains focus
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id, loadProject]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProjectStatus(id, newStatus);
      setProject(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Load available datasets for selection
  const loadAvailableDatasets = async () => {
    try {
      setDatasetsLoading(true);
      const datasets = await listDatasets();
      // Filter out datasets that are already in the project
      const availableDatasets = datasets.filter(dataset => 
        !project?.selectedDatasets?.includes(dataset.id)
      );
      setAvailableDatasets(availableDatasets);
      console.log('📊 Available datasets loaded:', availableDatasets.length, 'out of', datasets.length, 'total datasets');
    } catch (error) {
      console.error('Error loading available datasets:', error);
    } finally {
      setDatasetsLoading(false);
    }
  };

  // Add dataset to project
  const handleAddDataset = async (datasetId) => {
    try {
      console.log('🔄 Adding dataset to project:', datasetId);
      console.log('📋 Current project datasets:', project?.selectedDatasets);
      
      // Add the dataset to the project
      const updatedProject = await addDatasetToProject(id, datasetId);
      console.log('✅ Updated project datasets:', updatedProject?.selectedDatasets);
      
      // Update the project state immediately
      setProject(updatedProject);
      
      // Reload the project datasets with the updated project
      const allDatasets = await listDatasets();
      const projectDatasetList = allDatasets.filter(dataset =>
        updatedProject.selectedDatasets?.includes(dataset.id)
      );
      console.log('📊 Setting project datasets:', projectDatasetList.map(d => d.id));
      setProjectDatasets(projectDatasetList);
      
      // Update available datasets (remove the one we just added)
      const newAvailableDatasets = availableDatasets.filter(dataset => dataset.id !== datasetId);
      setAvailableDatasets(newAvailableDatasets);
      
      // Close the selector and reset search query
      setShowDatasetSelector(false);
      setDatasetSearchQuery('');
      
      console.log('✅ Successfully added dataset to project');
    } catch (error) {
      console.error('Error adding dataset to project:', error);
      alert('Failed to add dataset to project. Please try again.');
    }
  };

  // Remove dataset from project
  const handleRemoveDataset = async (datasetId) => {
    try {
      console.log('🔄 Removing dataset from project:', datasetId);
      console.log('📋 Current project datasets:', project?.selectedDatasets);
      
      // Remove the dataset from the project
      const updatedProject = await removeDatasetFromProject(id, datasetId);
      console.log('✅ Updated project datasets:', updatedProject?.selectedDatasets);
      
      // Update the project state immediately
      setProject(updatedProject);
      
      // Reload the project datasets with the updated project
      const allDatasets = await listDatasets();
      const projectDatasetList = allDatasets.filter(dataset =>
        updatedProject.selectedDatasets?.includes(dataset.id)
      );
      console.log('📊 Setting project datasets:', projectDatasetList.map(d => d.id));
      setProjectDatasets(projectDatasetList);
      
      // Update available datasets (add the one we just removed)
      const removedDataset = allDatasets.find(dataset => dataset.id === datasetId);
      if (removedDataset) {
        setAvailableDatasets(prev => [...prev, removedDataset]);
      }
      
      console.log('✅ Successfully removed dataset from project');
    } catch (error) {
      console.error('Error removing dataset from project:', error);
      alert('Failed to remove dataset from project. Please try again.');
    }
  };

  // Delete project function
  const handleDeleteProject = async () => {
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Filter datasets based on search query
  const filteredDatasets = availableDatasets.filter(dataset => {
    const searchLower = datasetSearchQuery.toLowerCase();
    return (
      dataset.name?.toLowerCase().includes(searchLower) ||
      dataset.source?.toLowerCase().includes(searchLower) ||
      dataset.id?.toLowerCase().includes(searchLower)
    );
  });

  // Dataset viewer functionality
  const toggleDatasetExpansion = (datasetIndex) => {
    setExpandedDatasets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(datasetIndex)) {
        newSet.delete(datasetIndex);
      } else {
        newSet.add(datasetIndex);
      }
      return newSet;
    });
  };

  const handleFileSelect = async (dataset, file) => {
    console.log('🔍 File select triggered:', { dataset, file });
    
    setFileLoading(true);
    setFileError(null);
    setSelectedDataset(dataset);
    setSelectedFile(file);
    
    try {
      let fileKey = file.name;
      
      // If the file has a key property, use that instead
      if (file.key) {
        fileKey = file.key;
      } else if (file.s3Key) {
        fileKey = file.s3Key;
      } else if (dataset.id && file.name) {
        // Construct the file path based on dataset structure
        const possiblePaths = [
          `user-uploads/raw/${dataset.id}/${file.name}`,
          `${dataset.id}/${file.name}`,
          `raw/${dataset.id}/${file.name}`,
          file.name
        ];
        
        // Try each possible path
        for (const path of possiblePaths) {
          try {
            console.log('🔍 Trying file path:', path);
            const content = await loadCsvDataset(path);
            setFileContent(content);
            console.log('✅ Successfully loaded file content');
            return;
          } catch (pathError) {
            console.log('❌ Failed to load with path:', path, pathError.message);
            continue;
          }
        }
        
        throw new Error('File not found in any expected location');
      }
      
      console.log('🔍 Loading file with key:', fileKey);
      const content = await loadCsvDataset(fileKey);
      
      // Transform the content to match expected format
      const transformedContent = {
        headers: content.columns || content.meta?.fields || [],
        data: content.data || [],
        rowCount: content.rowCount || content.data?.length || 0,
        fileName: content.fileName || file.name
      };
      
      setFileContent(transformedContent);
      console.log('✅ Successfully loaded and transformed file content');
      
    } catch (error) {
      console.error('❌ Error loading file:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        dataset: dataset,
        file: file
      });
      
      setFileError(`Failed to load file: ${error.message}`);
      setFileContent(null);
    } finally {
      setFileLoading(false);
    }
  };

  const DatasetViewer = () => {
    // Debug the dataset structure
    console.log('🔍 DatasetViewer rendering with datasets:', projectDatasets);
    
    return (
      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-sm mb-6">
        <h2 className="p-4 font-semibold text-sm border-b border-default">Project Datasets</h2>
        
        <div className="p-4">
          <div className="flex h-96">
            {/* Left Panel - Dataset and File Hierarchy */}
            <div className="w-1/3 pr-4 border-r border-gray-200">
              <div className="h-full overflow-y-auto">
                {projectDatasets.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <FaFolder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="mb-4">No datasets available</p>
                      <button
                        onClick={() => {
                          setShowDatasetSelector(true);
                          loadAvailableDatasets();
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 mx-auto"
                      >
                        <HiOutlinePlusCircle /> Add Datasets
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectDatasets.map((dataset, index) => {
                      console.log('🔍 Rendering dataset:', dataset);
                      const isExpanded = expandedDatasets.has(index);
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Dataset Header - Clickable to expand/collapse */}
                          <div 
                            className="bg-gray-50 dark:bg-surface-dark px-3 py-2 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => toggleDatasetExpansion(index)}
                          >
                            <div className={`mr-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </div>
                            {isExpanded ? (
                              <FaFolderOpen className="h-4 w-4 text-gray-600 mr-2" />
                            ) : (
                              <FaFolder className="h-4 w-4 text-gray-600 mr-2" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-textPrimary-dark">{dataset.name || `Dataset ${index + 1}`}</span>
                            <span className="ml-auto text-xs text-gray-500">
                              {dataset.fileCount || 0} files · {((dataset.size || 0) / 1024 / 1024).toFixed(1)} MB
                              {!isExpanded && dataset.files && dataset.files.length > 0 && (
                                <span className="ml-2 text-blue-600">Click to expand</span>
                              )}
                            </span>
                          </div>
                          
                          {/* Files List - Collapsible */}
                          <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2 space-y-1">
                              {dataset.files && dataset.files.length > 0 ? (
                                dataset.files.map((file, fileIndex) => {
                                  console.log('🔍 Rendering file:', file);
                                  
                                  return (
                                    <div
                                      key={fileIndex}
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering dataset collapse
                                        console.log('🔍 File clicked:', file, 'from dataset:', dataset);
                                        handleFileSelect(dataset, file);
                                      }}
                                      className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                                        selectedFile === file ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300' : ''
                                      }`}
                                    >
                                      <FaFile className="h-3 w-3 text-gray-500 mr-2" />
                                      <span className="text-sm text-gray-700 dark:text-textSecondary-dark">
                                        {file.name || file.key || 'Unknown file'}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-gray-500 px-2 py-1">
                                  No files available (files: {JSON.stringify(dataset.files)})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - File Preview */}
            <div className="w-2/3 pl-4">
              <div className="h-full flex flex-col">
                {!selectedFile ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <FaEye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>Select a file to preview</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* File Header */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900 dark:text-textPrimary-dark">{selectedFile.name}</h4>
                      {selectedDataset && (
                        <span className="text-sm text-gray-500">from {selectedDataset.name}</span>
                      )}
                    </div>

                    {/* File Content */}
                    <div className="flex-1 overflow-hidden">
                      {fileLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : fileError ? (
                        <div className="flex items-center justify-center h-full text-red-500">
                          <div className="text-center">
                            <p className="mb-2">Error loading file</p>
                            <p className="text-sm">{fileError}</p>
                          </div>
                        </div>
                      ) : fileContent ? (
                        <div className="h-full overflow-auto">
                          {/* CSV Data Preview */}
                          {fileContent.headers && fileContent.headers.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 dark:bg-surface-dark">
                                  <tr>
                                    {fileContent.headers.map((header, index) => (
                                      <th
                                        key={index}
                                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-textSecondary-dark uppercase tracking-wider"
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-card-dark divide-y divide-gray-200">
                                  {fileContent.data && fileContent.data.slice(0, 10).map((row, rowIndex) => (
                                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-card-dark' : 'bg-gray-50 dark:bg-surface-dark'}>
                                      {fileContent.headers.map((header, colIndex) => (
                                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-textPrimary-dark">
                                          {row[header] || '-'}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {fileContent.data && fileContent.data.length > 10 && (
                                <div className="text-center py-2 text-sm text-gray-500">
                                  Showing first 10 rows of {fileContent.data.length} total rows
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4">
                              <h4 className="font-medium mb-2">File Content</h4>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-64">
                                {JSON.stringify(fileContent, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <p>No content to display</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const calculateStats = () => {
    const totalRecords = projectDatasets.reduce((sum, dataset) => {
      // Estimate records from file size (rough approximation)
      return sum + Math.floor(dataset.size / 100); // Assume ~100 bytes per record
    }, 0);

    return {
      totalRecords: totalRecords.toLocaleString(),
      dataSources: projectDatasets.length,
      lastUpdated: project?.updatedAt ? formatDate(project.updatedAt) : 'Never',
      dashboards: project?.dashboardConfig ? 1 : 0 // Check if dashboard exists
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light text-textPrimary-light dark:bg-surface-dark dark:text-textPrimary-dark p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-light text-textPrimary-light dark:bg-surface-dark dark:text-textPrimary-dark p-6">
        <div className="flex items-center mb-6">
          <button
            className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2"
            onClick={() => navigate('/projects')}
          >
            <FaArrowLeft /> Back to Projects
          </button>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Project</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadProject(0)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-surface-light text-textPrimary-light dark:bg-surface-dark dark:text-textPrimary-dark p-6">
        <div className="flex items-center mb-6">
          <button
            className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2"
            onClick={() => navigate('/projects')}
          >
            <FaArrowLeft /> Back to Projects
          </button>
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Project Not Found</h3>
          <p className="text-sm text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-surface-light text-textPrimary-light dark:bg-surface-dark dark:text-textPrimary-dark p-6">
      <div className="flex items-center mb-6">
        <button
          className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2"
          onClick={() => navigate('/projects')}
        >
          <FaArrowLeft /> Back to Projects
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{project.title}</h1>
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
            {project.description}
          </p>
          <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-4">
            Created {formatDate(project.createdAt)} · Last updated {formatDate(project.updatedAt)}
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(project.status || 'active')}`}>
              {(project.status || 'active').charAt(0).toUpperCase() + (project.status || 'active').slice(1)}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => loadProject(0)}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
            title="Refresh project data"
          >
            🔄 Refresh
          </button>
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs border border-default rounded px-2 py-1 bg-card-light dark:bg-card-dark"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => {
              setShowEditModal(true);
              loadAvailableDatasets();
            }}
            className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center gap-1"
          >
            <FaEdit /> Edit Project
          </button>
        </div>
      </div>

      {/* Project Stats Grid */}
      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-sm mb-6">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-dark border-b border-default"
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
        >
          <h2 className="font-semibold text-sm">Project Statistics</h2>
          <div className={`transition-transform duration-300 ${isStatsExpanded ? 'rotate-180' : ''}`}>
            ⌄
          </div>
        </div>
        <div className={`transition-all duration-300 overflow-hidden ${isStatsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-4 gap-4 p-4">
            <div className="flex flex-col items-center justify-center bg-white dark:bg-card-dark border border-default rounded-lg py-4">
              <div className="text-2xl mb-1">🗃️</div>
              <p className="text-xl font-semibold">{stats.totalRecords}</p>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Total Records</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-white dark:bg-card-dark border border-default rounded-lg py-4">
              <div className="text-2xl mb-1">🧩</div>
              <p className="text-xl font-semibold">{stats.dataSources}</p>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Data Sources</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-white dark:bg-card-dark border border-default rounded-lg py-4">
              <div className="text-2xl mb-1">⏰</div>
              <p className="text-xl font-semibold">{stats.lastUpdated}</p>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Last Updated</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (project?.dashboardConfig) {
                  navigate(`/projects/${id}/dashboard`, { state: { projectDatasets } });
                }
              }}
              className={`flex flex-col items-center justify-center bg-white dark:bg-card-dark border border-default rounded-lg py-4 transition-colors ${
                project?.dashboardConfig ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer' : 'cursor-default'
              }`}
              disabled={!project?.dashboardConfig}
            >
              <div className={`text-2xl mb-1 ${project?.dashboardConfig ? '📊' : '📊'}`}>📊</div>
              <p className="text-xl font-semibold">{stats.dashboards}</p>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                {project?.dashboardConfig ? 'Dashboard (Click to open)' : 'Dashboards'}
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => {
            setShowDatasetSelector(true);
            loadAvailableDatasets();
          }}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2"
        >
          <HiOutlinePlusCircle /> Add Dataset
        </button>
        <button
          onClick={handleOpenAIAssistant}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          <FaRobot /> AI Dataset Assistant
        </button>
        <button
          onClick={() => navigate(`/projects/${id}/visualize`, { state: { projectDatasets } })}
          className="bg-purple-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:bg-purple-700"
        >
          <FaChartBar /> Advanced Visualization
        </button>
        <button
          onClick={() => navigate(`/projects/${id}/smart-viz`, { state: { projectDatasets } })}
          className="bg-emerald-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:bg-emerald-700"
        >
          🧠 Smart Visualization
        </button>
        <button
          className="bg-indigo-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2"
          onClick={handleOpenNotebookModal}
        >
          <FaDatabase /> Generate Notebook
        </button>
        <div className="ml-auto flex gap-2">
          <button className="btn-outline text-sm flex items-center gap-1">
            <FaShareAlt /> Share
          </button>
          <button className="btn-outline text-sm flex items-center gap-1">
            <FaDownload /> Export
          </button>
          <button
            className="btn-outline text-sm flex items-center gap-1"
            onClick={() => {
              // ...existing code...
            }}
          >
            🚀 Test Navigation
          </button>
        </div>
      </div>
      {showNotebookModal && (
        <AINotebookGenerator
          isOpen={showNotebookModal}
          onClose={handleCloseNotebookModal}
          projectId={id}
          availableFiles={projectDatasets}
          onNotebookGenerated={handleNotebookGenerated}
        />
      )}
      {lastGeneratedNotebook && (
        <div className="my-4 flex justify-end">
          <button
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            onClick={() => navigate(`/projects/${id}/notebook-ide`, { state: { notebookJson: lastGeneratedNotebook } })}
          >
            <FaDatabase className="mr-2" /> Open in JupyterLite
          </button>
        </div>
      )}

      {/* Dataset Selector Modal */}
      {showDatasetSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-lg max-w-2xl w-full m-4 max-h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-default">
              <h3 className="text-lg font-semibold">Add Dataset to Project</h3>
              <button
                onClick={() => {
                  setShowDatasetSelector(false);
                  setDatasetSearchQuery(''); // Reset search when closing
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-4 border-b border-default">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search datasets by name, source, or ID..."
                  value={datasetSearchQuery}
                  onChange={(e) => setDatasetSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {datasetsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading datasets...</p>
                </div>
              ) : filteredDatasets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaDatabase className="mx-auto text-4xl mb-2" />
                  {datasetSearchQuery ? (
                    <>
                      <p>No datasets found matching "{datasetSearchQuery}"</p>
                      <p className="text-sm">Try adjusting your search terms</p>
                    </>
                  ) : availableDatasets.length === 0 ? (
                    <>
                      <p>No available datasets to add</p>
                      <p className="text-sm">All datasets are already in this project, or upload new datasets in the Explore section</p>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDatasets.map(dataset => (
                    <div key={dataset.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-gray-200">
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
                      <button
                        onClick={() => handleAddDataset(dataset.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex items-center gap-1"
                      >
                        <HiOutlinePlusCircle className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-lg max-w-4xl w-full m-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-default">
              <h3 className="text-lg font-semibold">Edit Project</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditDatasetSearchQuery('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex">
              {/* Left Panel - Current Project Datasets */}
              <div className="w-1/2 p-4 border-r border-default">
                <h4 className="font-semibold mb-3 text-sm">Current Datasets</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {projectDatasets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaFolder className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm">No datasets in this project</p>
                    </div>
                  ) : (
                    projectDatasets.map(dataset => (
                      <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border">
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
                        <button
                          onClick={() => handleRemoveDataset(dataset.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 flex items-center gap-1 ml-2"
                        >
                          <FaTrash className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel - Available Datasets */}
              <div className="w-1/2 p-4">
                <h4 className="font-semibold mb-3 text-sm">Add Datasets</h4>
                
                {/* Search Bar */}
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search available datasets..."
                      value={editDatasetSearchQuery}
                      onChange={(e) => setEditDatasetSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {datasetsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-2">Loading datasets...</p>
                    </div>
                  ) : (() => {
                    const filteredAvailable = availableDatasets.filter(dataset => {
                      const searchLower = editDatasetSearchQuery.toLowerCase();
                      return (
                        dataset.name?.toLowerCase().includes(searchLower) ||
                        dataset.source?.toLowerCase().includes(searchLower) ||
                        dataset.id?.toLowerCase().includes(searchLower)
                      );
                    });

                    return filteredAvailable.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FaDatabase className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        {editDatasetSearchQuery ? (
                          <>
                            <p className="text-sm">No datasets found matching "{editDatasetSearchQuery}"</p>
                            <p className="text-xs">Try adjusting your search terms</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm">No available datasets</p>
                            <p className="text-xs">All datasets are already in this project</p>
                          </>
                        )}
                      </div>
                    ) : (
                      filteredAvailable.map(dataset => (
                        <div key={dataset.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-gray-200">
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
                          <button
                            onClick={() => handleAddDataset(dataset.id)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1 ml-2"
                          >
                            <HiOutlinePlusCircle className="h-3 w-3" />
                            Add
                          </button>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer with Delete Project */}
            <div className="border-t border-default p-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <strong>Danger Zone:</strong> Delete this project permanently
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                    handleDeleteProject();
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 flex items-center gap-2"
              >
                <FaTrash className="h-4 w-4" />
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Dashboard Section */}
      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-sm mb-6">
        <h2 className="p-4 font-semibold text-sm border-b border-default">Project Dashboard</h2>
        {!project?.dashboardConfig ? (
          <div className="p-8 text-center text-gray-400">
            <MdOutlineDashboard className="mx-auto text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">No dashboard created</h3>
            <p className="text-sm mb-4">Create an interactive dashboard to visualize your project data.</p>
            <button
              onClick={() => navigate(`/projects/${id}/dashboard`, { state: { projectDatasets } })}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center gap-2 mx-auto"
            >
              <MdOutlineDashboard /> Create Dashboard
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-surface-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <MdOutlineDashboard />
              </div>
              <div>
                <p className="font-medium text-sm">Project Dashboard</p>
                <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                  {project.dashboardConfig.widgets?.length || 0} widgets · 
                  Last updated {project.dashboardConfig.lastModified ? formatDate(project.dashboardConfig.lastModified) : formatDate(project.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/projects/${id}/dashboard`, { state: { projectDatasets } })}
                className="text-xs font-medium bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 flex items-center gap-1"
              >
                <MdOutlineDashboard /> Open Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Notebooks List */}
      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-sm mb-6">
        <h2 className="p-4 font-semibold text-sm border-b border-default">Project Notebooks</h2>
        {projectNotebooks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FaDatabase className="mx-auto text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">No notebooks generated</h3>
            <p className="text-sm mb-4">Generate a notebook to see it here.</p>
          </div>
        ) : (
          projectNotebooks.map((notebook, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-t border-default hover:bg-gray-50 dark:hover:bg-surface-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <FaDatabase />
                </div>
                <div>
          <p className="font-medium text-sm">{notebook.name}</p>
          <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{notebook.lastModified ? `Updated ${formatDate(notebook.lastModified)}` : ''}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={notebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  <FaDownload className="mr-1" /> Download
                </a>
                <button
                  className="text-xs font-medium bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 flex items-center gap-1"
                  onClick={async () => {
                    try {
                      // Fetch notebook from S3
                      const file = await Storage.get(notebook.key, { download: true, level: 'protected' });
                      const text = await file.Body.text();
                      const notebookJson = JSON.parse(text);
                      navigate(`/projects/${id}/notebook-ide`, { state: { notebookJson } });
                    } catch (err) {
                      alert('Failed to load notebook for JupyterLite IDE.');
                      console.error('Notebook fetch error:', err);
                    }
                  }}
                >
                  <FaDatabase className="mr-1" /> Open in JupyterLite
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Datasets Viewer */}
      {/* AI Dataset Assistant Modal */}
      {showAIAssistant && (
        <AIDatasetAssistant
          isOpen={showAIAssistant}
          onClose={handleCloseAIAssistant}
          availableDatasets={availableDatasets}
          onDatasetSelect={handleAddDataset}
          currentProjectDatasets={projectDatasets}
        />
      )}

      <DatasetViewer />
    </div>
  );
}
