import React, { useState, useEffect } from 'react';
import AINotebookGenerator from '../../components/AINotebookGenerator';
import { FaArrowLeft, FaShareAlt, FaDownload, FaChartBar, FaDatabase, FaEdit, FaTrash } from 'react-icons/fa';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import { MdOutlineDashboard } from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProjectStatus, deleteProject } from '../../services/projectService';
import { listDatasets } from '../../utils/storageUtils';
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
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectDatasets, setProjectDatasets] = useState([]);
  const [projectNotebooks, setProjectNotebooks] = useState([]);

  useEffect(() => {
    if (id) {
      loadProject();
      fetchProjectNotebooks();
    }
    // eslint-disable-next-line
  }, [id]);
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

  const loadProject = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const [projectData, availableDatasets] = await Promise.all([
        getProject(id),
        listDatasets()
      ]);

      setProject(projectData);
      setDatasets(availableDatasets);

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
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProjectStatus(id, newStatus);
      setProject(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(id);
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
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

  const calculateStats = () => {
    const totalRecords = projectDatasets.reduce((sum, dataset) => {
      // Estimate records from file size (rough approximation)
      return sum + Math.floor(dataset.size / 100); // Assume ~100 bytes per record
    }, 0);

    return {
      totalRecords: totalRecords.toLocaleString(),
      dataSources: projectDatasets.length,
      lastUpdated: project?.updatedAt ? formatDate(project.updatedAt) : 'Never',
      dashboards: 0 // This would come from a dashboard service in the future
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
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(project.status)}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
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
            onClick={() => navigate(`/projects/create?edit=${id}`)}
            className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center gap-1"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={handleDeleteProject}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button className="bg-blue-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2">
          <HiOutlinePlusCircle /> Add Dataset
        </button>
        <button className="bg-green-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2">
          <MdOutlineDashboard /> New Dashboard
        </button>
        <Link
          to="visualization"
          className="bg-purple-600 text-white px-4 py-2 text-sm rounded flex items-center gap-2 hover:bg-purple-700"
        >
          <FaChartBar /> Create Visualization
        </Link>
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
              console.log('Navigating to /test-navigation');
              navigate('/test-navigation');
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

      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-sm mb-6">
        <h2 className="p-4 font-semibold text-sm border-b border-default">Project Datasets</h2>
        {projectDatasets.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FaDatabase className="mx-auto text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">No datasets added</h3>
            <p className="text-sm mb-4">Add your first dataset to start analyzing data.</p>
            <button
              onClick={() => navigate(`/projects/create?edit=${id}`)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 mx-auto"
            >
              <HiOutlinePlusCircle /> Add Datasets
            </button>
          </div>
        ) : (
          projectDatasets.map((dataset, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-t border-default hover:bg-gray-50 dark:hover:bg-surface-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <FaDatabase />
                </div>
                <div>
                  <p className="font-medium text-sm">{dataset.name}</p>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                    {dataset.fileCount} files · {(dataset.size / 1024 / 1024).toFixed(1)} MB · Updated {formatDate(dataset.lastModified)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/explore/${dataset.id}`)}
                className="text-xs font-medium bg-gray-100 dark:bg-surface-dark px-3 py-1 rounded hover:bg-gray-200"
              >
                Preview
              </button>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
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
        <div className="flex flex-col items-center justify-center bg-white dark:bg-card-dark border border-default rounded-lg py-4">
          <div className="text-2xl mb-1">📊</div>
          <p className="text-xl font-semibold">{stats.dashboards}</p>
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Dashboards</p>
        </div>
      </div>
    </div>
  );
}
