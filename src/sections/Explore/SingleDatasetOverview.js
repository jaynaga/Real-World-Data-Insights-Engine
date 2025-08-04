import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiDownload,
  FiShare2,
  FiBarChart2,
  FiMap,
  FiCalendar,
  FiUsers,
  FiTag,
  FiArrowLeft,
  FiZap,
  FiDatabase,
  FiFileText,
  FiEye,
  FiPlus,
  FiExternalLink
} from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineGlobe } from 'react-icons/hi';
import { loadDatasetFile, getFileDownloadUrl, canPreviewFile, getFileTypeDisplay } from '../../utils/dataLoaderUtils';
import DataViewer from '../../components/DataViewer';
import FairScoreDisplay from '../../components/FairScoreDisplay';
import AINotebookGenerator from '../../components/AINotebookGenerator';
import { listProjects, createProject, addDatasetToProject } from '../../services/projectService';
import '../../styles/tokens.css';

// Generate consistent color for a tag based on its text (same function as DatasetTable)
const getTagColor = (tagText) => {
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    const char = tagText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const colors = [
    // Vibrant and distinct colors
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
    
    // Deeper shades for more variety
    { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400' },
    { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-400' },
    { bg: 'bg-violet-200', text: 'text-violet-900', border: 'border-violet-400' },
    { bg: 'bg-rose-200', text: 'text-rose-900', border: 'border-rose-400' },
    { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-400' },
    { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-400' },
    { bg: 'bg-sky-200', text: 'text-sky-900', border: 'border-sky-400' },
    { bg: 'bg-lime-200', text: 'text-lime-900', border: 'border-lime-400' },
    { bg: 'bg-fuchsia-200', text: 'text-fuchsia-900', border: 'border-fuchsia-400' },
    { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-400' },
    
    // More vibrant alternatives
    { bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400' },
    { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' },
    { bg: 'bg-zinc-200', text: 'text-zinc-800', border: 'border-zinc-400' },
    { bg: 'bg-stone-200', text: 'text-stone-800', border: 'border-stone-400' },
    { bg: 'bg-neutral-200', text: 'text-neutral-800', border: 'border-neutral-400' },
    
    // Additional distinct colors
    { bg: 'bg-blue-300', text: 'text-blue-800', border: 'border-blue-500' },
    { bg: 'bg-green-300', text: 'text-green-800', border: 'border-green-500' },
    { bg: 'bg-purple-300', text: 'text-purple-800', border: 'border-purple-500' },
    { bg: 'bg-pink-300', text: 'text-pink-800', border: 'border-pink-500' },
    { bg: 'bg-yellow-300', text: 'text-yellow-800', border: 'border-yellow-500' },
    
    // Lighter pastels for variety
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    
    // Even more distinct options
    { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300' },
    { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-300' },
    { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400' },
    { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-400' },
    { bg: 'bg-cyan-200', text: 'text-cyan-900', border: 'border-cyan-400' },
    
    // Final batch of distinct colors
    { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-400' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
    { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' }
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

const getTagColorDark = (tagText) => {
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    const char = tagText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const darkColors = [
    { bg: 'dark:bg-blue-900', text: 'dark:text-blue-100', border: 'dark:border-blue-700' },
    { bg: 'dark:bg-emerald-900', text: 'dark:text-emerald-100', border: 'dark:border-emerald-700' },
    { bg: 'dark:bg-purple-900', text: 'dark:text-purple-100', border: 'dark:border-purple-700' },
    { bg: 'dark:bg-pink-900', text: 'dark:text-pink-100', border: 'dark:border-pink-700' },
    { bg: 'dark:bg-amber-900', text: 'dark:text-amber-100', border: 'dark:border-amber-700' },
    { bg: 'dark:bg-red-900', text: 'dark:text-red-100', border: 'dark:border-red-700' },
    { bg: 'dark:bg-indigo-900', text: 'dark:text-indigo-100', border: 'dark:border-indigo-700' },
    { bg: 'dark:bg-orange-900', text: 'dark:text-orange-100', border: 'dark:border-orange-700' },
    { bg: 'dark:bg-teal-900', text: 'dark:text-teal-100', border: 'dark:border-teal-700' },
    { bg: 'dark:bg-cyan-900', text: 'dark:text-cyan-100', border: 'dark:border-cyan-700' },
    
    { bg: 'dark:bg-blue-800', text: 'dark:text-blue-200', border: 'dark:border-blue-600' },
    { bg: 'dark:bg-green-800', text: 'dark:text-green-200', border: 'dark:border-green-600' },
    { bg: 'dark:bg-violet-800', text: 'dark:text-violet-200', border: 'dark:border-violet-600' },
    { bg: 'dark:bg-rose-800', text: 'dark:text-rose-200', border: 'dark:border-rose-600' },
    { bg: 'dark:bg-yellow-800', text: 'dark:text-yellow-200', border: 'dark:border-yellow-600' },
    { bg: 'dark:bg-sky-800', text: 'dark:text-sky-200', border: 'dark:border-sky-600' },
    { bg: 'dark:bg-lime-800', text: 'dark:text-lime-200', border: 'dark:border-lime-600' },
    { bg: 'dark:bg-fuchsia-800', text: 'dark:text-fuchsia-200', border: 'dark:border-fuchsia-600' },
    { bg: 'dark:bg-emerald-800', text: 'dark:text-emerald-200', border: 'dark:border-emerald-600' },
    { bg: 'dark:bg-orange-800', text: 'dark:text-orange-200', border: 'dark:border-orange-600' },
    
    { bg: 'dark:bg-slate-800', text: 'dark:text-slate-200', border: 'dark:border-slate-600' },
    { bg: 'dark:bg-gray-800', text: 'dark:text-gray-200', border: 'dark:border-gray-600' },
    { bg: 'dark:bg-zinc-800', text: 'dark:text-zinc-200', border: 'dark:border-zinc-600' },
    { bg: 'dark:bg-stone-800', text: 'dark:text-stone-200', border: 'dark:border-stone-600' },
    { bg: 'dark:bg-neutral-800', text: 'dark:text-neutral-200', border: 'dark:border-neutral-600' },
    
    { bg: 'dark:bg-blue-950', text: 'dark:text-blue-100', border: 'dark:border-blue-800' },
    { bg: 'dark:bg-green-950', text: 'dark:text-green-100', border: 'dark:border-green-800' },
    { bg: 'dark:bg-purple-950', text: 'dark:text-purple-100', border: 'dark:border-purple-800' },
    { bg: 'dark:bg-pink-950', text: 'dark:text-pink-100', border: 'dark:border-pink-800' },
    { bg: 'dark:bg-yellow-950', text: 'dark:text-yellow-100', border: 'dark:border-yellow-800' },
    
    { bg: 'dark:bg-sky-950', text: 'dark:text-sky-100', border: 'dark:border-sky-800' },
    { bg: 'dark:bg-lime-950', text: 'dark:text-lime-100', border: 'dark:border-lime-800' },
    { bg: 'dark:bg-violet-950', text: 'dark:text-violet-100', border: 'dark:border-violet-800' },
    { bg: 'dark:bg-fuchsia-950', text: 'dark:text-fuchsia-100', border: 'dark:border-fuchsia-800' },
    { bg: 'dark:bg-rose-950', text: 'dark:text-rose-100', border: 'dark:border-rose-800' },
    
    { bg: 'dark:bg-red-800', text: 'dark:text-red-200', border: 'dark:border-red-600' },
    { bg: 'dark:bg-teal-800', text: 'dark:text-teal-200', border: 'dark:border-teal-600' },
    { bg: 'dark:bg-cyan-800', text: 'dark:text-cyan-200', border: 'dark:border-cyan-600' },
    { bg: 'dark:bg-indigo-800', text: 'dark:text-indigo-200', border: 'dark:border-indigo-600' },
    { bg: 'dark:bg-amber-800', text: 'dark:text-amber-200', border: 'dark:border-amber-600' },
    
    { bg: 'dark:bg-blue-700', text: 'dark:text-blue-300', border: 'dark:border-blue-500' },
    { bg: 'dark:bg-green-700', text: 'dark:text-green-300', border: 'dark:border-green-500' },
    { bg: 'dark:bg-purple-700', text: 'dark:text-purple-300', border: 'dark:border-purple-500' },
    { bg: 'dark:bg-pink-700', text: 'dark:text-pink-300', border: 'dark:border-pink-500' },
    { bg: 'dark:bg-yellow-700', text: 'dark:text-yellow-300', border: 'dark:border-yellow-500' },
    
    { bg: 'dark:bg-slate-900', text: 'dark:text-slate-100', border: 'dark:border-slate-700' },
    { bg: 'dark:bg-gray-900', text: 'dark:text-gray-100', border: 'dark:border-gray-700' },
    { bg: 'dark:bg-zinc-900', text: 'dark:text-zinc-100', border: 'dark:border-zinc-700' },
    { bg: 'dark:bg-stone-900', text: 'dark:text-stone-100', border: 'dark:border-stone-700' },
    { bg: 'dark:bg-neutral-900', text: 'dark:text-neutral-100', border: 'dark:border-neutral-700' },
    
    { bg: 'dark:bg-red-950', text: 'dark:text-red-100', border: 'dark:border-red-800' },
    { bg: 'dark:bg-orange-950', text: 'dark:text-orange-100', border: 'dark:border-orange-800' },
    { bg: 'dark:bg-amber-950', text: 'dark:text-amber-100', border: 'dark:border-amber-800' },
    { bg: 'dark:bg-teal-950', text: 'dark:text-teal-100', border: 'dark:border-teal-800' },
    { bg: 'dark:bg-cyan-950', text: 'dark:text-cyan-100', border: 'dark:border-cyan-800' },
    
    { bg: 'dark:bg-emerald-950', text: 'dark:text-emerald-100', border: 'dark:border-emerald-800' },
    { bg: 'dark:bg-indigo-950', text: 'dark:text-indigo-100', border: 'dark:border-indigo-800' },
    { bg: 'dark:bg-sky-900', text: 'dark:text-sky-100', border: 'dark:border-sky-700' },
    { bg: 'dark:bg-lime-900', text: 'dark:text-lime-100', border: 'dark:border-lime-700' },
    { bg: 'dark:bg-violet-900', text: 'dark:text-violet-100', border: 'dark:border-violet-700' },
    
    { bg: 'dark:bg-fuchsia-900', text: 'dark:text-fuchsia-100', border: 'dark:border-fuchsia-700' },
    { bg: 'dark:bg-rose-900', text: 'dark:text-rose-100', border: 'dark:border-rose-700' },
    { bg: 'dark:bg-slate-700', text: 'dark:text-slate-200', border: 'dark:border-slate-500' },
    { bg: 'dark:bg-gray-700', text: 'dark:text-gray-200', border: 'dark:border-gray-500' },
    { bg: 'dark:bg-zinc-700', text: 'dark:text-zinc-200', border: 'dark:border-zinc-500' }
  ];
  
  return darkColors[Math.abs(hash) % darkColors.length];
};

const getTagClasses = (tagText) => {
  const lightColors = getTagColor(tagText);
  const darkColors = getTagColorDark(tagText);
  
  return `${lightColors.bg} ${lightColors.text} ${lightColors.border} ${darkColors.bg} ${darkColors.text} ${darkColors.border}`;
};

export default function SingleDatasetOverview({ datasets = [], loading = false }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  // Helper function to format description with proper spacing and formatting
  const formatDescription = (description) => {
    if (!description) return 'No description available.';
    
    // Clean up the description and add proper formatting
    return description
      .replace(/\. /g, '.\n\n') // Add paragraph breaks after sentences
      .replace(/: /g, ':\n') // Add line breaks after colons
      .replace(/\n\n\n+/g, '\n\n') // Remove excessive line breaks
      .trim();
  };

  // Helper function to truncate description for preview
  const truncateDescription = (description, maxLength = 200) => {
    if (!description) return 'No description available.';
    const formatted = formatDescription(description);
    if (formatted.length <= maxLength) return formatted;
    return formatted.substring(0, maxLength).trim() + '...';
  };

  // Helper function to filter out dataset-info.json files
  const filterDatasetInfoFiles = (files) => {
    if (!files) return [];
    return files.filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json'));
  };

  // State for description modal
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  // ✅ Memoized dataset lookup
  const dataset = useMemo(() => {
    return datasets.find((d) => String(d.id) === String(datasetId));
  }, [datasets, datasetId]);

  // State for file management and preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);

  // AI Notebook Generator state
  const [showNotebookGenerator, setShowNotebookGenerator] = useState(false);

  // Project selection state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);

  // ✅ Auto-select first file when dataset loads
  useEffect(() => {
    if (dataset?.files?.length > 0 && !selectedFile) {
      setSelectedFile(dataset.files[0]);
    }
  }, [dataset, selectedFile]);

  // ✅ Load CSV data when a file is selected
  useEffect(() => {
    if (selectedFile) {
      setCsvLoading(true);
      setCsvError(null);
      
      // Use universal data loader that handles both S3 and Kaggle
      loadDatasetFile(selectedFile, dataset?.accessLevel || 'protected', 100)
        .then((result) => setCsvPreview(result))
        .catch((err) => setCsvError(err.message))
        .finally(() => setCsvLoading(false));
    }
  }, [selectedFile, dataset?.accessLevel]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setCsvPreview(null);
  };

  const handleGenerateNotebook = () => {
    setShowNotebookGenerator(true);
  };

  const handleDownloadDataset = () => {
    if (!selectedFile) {
      alert('Please select a file to download');
      return;
    }
    
    // Get appropriate download URL based on file source
    const downloadUrl = getFileDownloadUrl(selectedFile);
    window.open(downloadUrl, '_blank');
  };

  // Project selection handlers
  const handleAddToProject = async () => {
    try {
      setProjectLoading(true);
      const projectsData = await listProjects();
      console.log('Projects loaded for dropdown:', projectsData);
      if (projectsData.length > 0) {
        console.log('First project structure:', projectsData[0]);
      }
      setProjects(projectsData);
      setShowProjectModal(true);
    } catch (error) {
      console.error('Error loading projects:', error);
      alert('Failed to load projects. Please try again.');
    } finally {
      setProjectLoading(false);
    }
  };

  const handleProjectSelection = async () => {
    if (!selectedProjectId && !newProjectName.trim()) {
      alert('Please select an existing project or enter a new project name.');
      return;
    }

    try {
      setProjectLoading(true);
      let projectId = selectedProjectId;

      // Create new project if needed
      if (!selectedProjectId && newProjectName.trim()) {
        const newProject = await createProject(newProjectName.trim());
        projectId = newProject.id;
      }

      // Add dataset to project
      await addDatasetToProject(projectId, dataset);
      
      setShowProjectModal(false);
      setSelectedProjectId('');
      setNewProjectName('');
      alert('Dataset added to project successfully!');
    } catch (error) {
      console.error('Error adding dataset to project:', error);
      alert('Failed to add dataset to project. Please try again.');
    } finally {
      setProjectLoading(false);
    }
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setSelectedProjectId('');
    setNewProjectName('');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
            Loading dataset...
          </h2>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
            Dataset not found
          </h2>
          <button
            onClick={() => navigate('/explore')}
            className="text-accent-light dark:text-accent-dark hover:underline"
          >
            Return to Datasets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center text-sm text-textSecondary-light dark:text-textSecondary-dark hover:text-accent-light dark:hover:text-accent-dark mb-4"
          >
            <FiArrowLeft className="mr-2" /> Back to Datasets
          </button>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <FiDatabase className="text-blue-500 text-xl" />
                <h1 className="text-xl sm:text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                  {dataset.name}
                </h1>
                {dataset.source === 'Kaggle' && (
                  <span className="px-3 py-1 text-sm rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-100 flex items-center gap-1">
                    <FiExternalLink className="text-xs" />
                    Kaggle Dataset
                  </span>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
                <h3 className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2 flex items-center gap-2">
                  <HiOutlineDocumentText className="text-blue-500" />
                  Description
                </h3>
                <p className="text-textSecondary-light dark:text-textSecondary-dark text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {truncateDescription(dataset.description)}
                </p>
                {dataset.description && dataset.description.length > 200 && (
                  <button
                    onClick={() => setShowDescriptionModal(true)}
                    className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline flex items-center gap-1"
                  >
                    <FiEye className="text-xs" />
                    Read full description
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleAddToProject}
                disabled={projectLoading}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <FiPlus /> {projectLoading ? 'Loading...' : 'Add to Projects'}
              </button>
              <button
                onClick={handleDownloadDataset}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90 text-sm"
              >
                <FiDownload /> 
                {selectedFile 
                  ? (selectedFile.isKaggleFile 
                    ? `View ${selectedFile.name || selectedFile.fileName} on Kaggle` 
                    : `Download ${selectedFile.name || selectedFile.fileName}`)
                  : 'Download Dataset'
                }
              </button>
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark text-sm">
                <FiShare2 /> Share
              </button>
              <button
                onClick={handleGenerateNotebook}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiZap className="text-sm" />
                <span>Generate AI Notebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {/* Left Column - Stats and Data */}
          <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-4 space-y-6">

            {/* Key Stats */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Dataset Overview
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <HiOutlineDocumentText className="mr-2" /> Type
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    Dataset Folder
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <FiBarChart2 className="mr-2" /> Data Files
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {filterDatasetInfoFiles(dataset?.files).length}
                    {dataset?.metadataFileCount > 0 && (
                      <span className="text-sm text-purple-600 dark:text-purple-400 ml-2">
                        +{dataset.metadataFileCount} metadata
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <HiOutlineGlobe className="mr-2" /> Size
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset?.size}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center text-textSecondary-light dark:text-textSecondary-dark mb-2">
                    <FiCalendar className="mr-2" /> Last Updated
                  </div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark font-medium">
                    {dataset?.lastUpdated}
                  </div>
                </div>
              </div>
              
              {/* FAIR Score Section - Full Display for Individual Dataset Page */}
              <div className="mt-6">
                <FairScoreDisplay datasetKey={dataset?.key} compact={false} />
              </div>
            </div>

            {/* Kaggle Dataset Information */}
            {dataset?.source === 'Kaggle' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiExternalLink className="text-orange-600 dark:text-orange-400" />
                  <h3 className="font-medium text-orange-800 dark:text-orange-200">External Dataset from Kaggle</h3>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  This dataset is hosted on Kaggle and accessed through their API. The data remains on Kaggle's servers and is not stored in our system.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded">
                    Downloads: {dataset.downloadCount || 'N/A'}
                  </span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded">
                    Votes: {dataset.voteCount || 'N/A'}
                  </span>
                  {dataset.license && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded">
                      License: {dataset.license}
                    </span>
                  )}
                  <a 
                    href={dataset.kaggleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1"
                  >
                    <FiExternalLink className="text-xs" />
                    View on Kaggle
                  </a>
                </div>
              </div>
            )}

            {/* Dataset Files List */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                  Data Files ({dataset?.files ? dataset.files.filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json')).length : 0})
                </h2>
                <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                  {dataset?.metadataFileCount > 0 && (
                    <span>{dataset.metadataFileCount} metadata file(s) available</span>
                  )}
                </div>
              </div>
              {dataset?.files && dataset.files.filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json')).length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {dataset.files
                    .filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json'))
                    .map((file, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedFile?.key === file.key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-surface-dark'
                        }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FiFileText className={`text-lg ${selectedFile?.key === file.key ? 'text-blue-600' : 'text-textSecondary-light dark:text-textSecondary-dark'
                            }`} />
                          <div>
                            <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                              {file.name || file.fileName}
                              {file.isKaggleFile && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-100">
                                  Kaggle
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                              {formatFileSize(file.size)} • {getFileTypeDisplay(file)} • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'No date'}
                            </p>
                            {!canPreviewFile(file) && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                Preview not available for this file type
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedFile?.key === file.key && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              Selected
                            </span>
                          )}
                          <FiEye className="text-textSecondary-light dark:text-textSecondary-dark" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-textSecondary-light dark:text-textSecondary-dark">No data files found in this dataset folder.</p>
              )}
            </div>

            {/* Metadata Files List */}
            {dataset?.metadataFiles && dataset.metadataFiles.filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json')).length > 0 && (
              <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                  Metadata Files ({dataset.metadataFiles.filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json')).length})
                </h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dataset.metadataFiles
                    .filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json'))
                    .map((file, index) => (
                    <div
                      key={`metadata-${index}`}
                      className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FiFileText className="text-lg text-purple-600 dark:text-purple-400" />
                          <div>
                            <h3 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                              {file.name}
                            </h3>
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 mr-2">
                                Metadata
                              </span>
                              {formatFileSize(file.size)} • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Download metadata file
                              const fileUrl = `https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${file.key}`;
                              window.open(fileUrl, '_blank');
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                            title="Download metadata file"
                          >
                            <FiDownload />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Schema Summary */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                File Summary
              </h2>
              {csvPreview && csvPreview.columns && csvPreview.columns.length > 0 && selectedFile ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-2">
                      Currently viewing: {selectedFile.name}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Total Columns</div>
                      <div className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">{csvPreview.columns.length}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Total Rows</div>
                      <div className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                        {(csvPreview.totalRows || csvPreview.rowCount || 0).toLocaleString()}
                        {csvPreview.isPreview && (
                          <span className="text-sm text-orange-600 dark:text-orange-400 ml-1">(preview)</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-lg">
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">File Format</div>
                      <div className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">CSV</div>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-textSecondary-light dark:text-textSecondary-dark">
                  {selectedFile ? 'Loading file information...' : 'Select a file to view its schema information.'}
                </span>
              )}
            </div>

            {/* Enhanced Data Preview */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                  Data Preview
                </h2>
                {selectedFile && (
                  <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    <span>Viewing: {selectedFile.name || selectedFile.fileName}</span>
                    {selectedFile.isKaggleFile && (
                      <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                        Limited preview - Data streamed from Kaggle
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedFile ? (
                <DataViewer
                  csvData={csvPreview}
                  isLoading={csvLoading}
                  error={csvError}
                />
              ) : (
                <div className="text-center py-8">
                  <FiFileText className="mx-auto text-4xl text-textSecondary-light dark:text-textSecondary-dark mb-4" />
                  <p className="text-textSecondary-light dark:text-textSecondary-dark">
                    Select a file from the list above to preview its contents
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Metadata and Tags */}
          <div className="lg:col-span-1 space-y-6 order-first lg:order-last">

            {/* Dataset Info */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Dataset Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                  <FiDatabase className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                  <span className="font-medium">Folder:</span>
                  <span className="ml-1">{dataset?.name}</span>
                </div>
                <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                  <FiFileText className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                  <span className="font-medium">Data Files:</span>
                  <span className="ml-1">{dataset?.files ? dataset.files.filter(file => !file.name?.includes('dataset-info.json') && !file.key?.endsWith('/dataset-info.json')).length : 0}</span>
                </div>
                {dataset?.metadataFileCount > 0 && (
                  <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    <FiFileText className="mr-2 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">Metadata Files:</span>
                    <span className="ml-1">{dataset.metadataFileCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Geographic Coverage */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Geographic Coverage
              </h2>
              <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                <FiMap className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                {dataset?.geography || 'Not specified'}
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Demographics
              </h2>
              <div className="flex items-center text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                <FiUsers className="mr-2 text-textSecondary-light dark:text-textSecondary-dark" />
                {dataset?.demographics ? dataset.demographics.join(', ') : 'Not specified'}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {dataset?.tags && dataset.tags.length > 0 ? dataset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border ${getTagClasses(tag)}`}
                  >
                    <FiTag className="mr-1" />
                    {tag}
                  </span>
                )) : (
                  <span className="text-textSecondary-light dark:text-textSecondary-dark text-sm">No tags available</span>
                )}
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-4">
                Additional Information
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    Date Added
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    {dataset?.date ? formatDate(dataset.date) : 'Not available'}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    Access Level
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    {dataset?.accessLevel || 'Protected'}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    License
                  </h3>
                  <p className="text-textPrimary-light dark:text-textPrimary-dark text-sm sm:text-base">
                    Open Data License
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Notebook Generator Modal */}
      {showNotebookGenerator && (
        <AINotebookGenerator
          isOpen={showNotebookGenerator}
          onClose={() => setShowNotebookGenerator(false)}
          availableFiles={dataset?.files ? [dataset] : []} // Pass the dataset folder instead of individual files
          projectId={dataset?.id || dataset?.key}
        />
      )}

      {/* Project Selection Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-card-dark rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                Add Dataset to Project
              </h3>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1">
                Select an existing project or create a new one
              </p>
            </div>
            
            <div className="p-6 space-y-4 max-h-64 overflow-y-auto">
              {/* Existing Projects */}
              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
                    Select Existing Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title || project.name || 'Untitled Project'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Create New Project */}
              <div>
                <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
                  Or Create New Project
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-border-light dark:border-border-dark flex gap-3 justify-end">
              <button
                onClick={closeProjectModal}
                disabled={projectLoading}
                className="px-4 py-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProjectSelection}
                disabled={projectLoading || (!selectedProjectId && !newProjectName.trim())}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {projectLoading ? 'Adding...' : 'Add to Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                <HiOutlineDocumentText className="text-blue-500" />
                Full Description - {dataset.title}
              </h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-textSecondary-light dark:text-textSecondary-dark text-base leading-relaxed whitespace-pre-line">
                {formatDescription(dataset.description)}
              </p>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}