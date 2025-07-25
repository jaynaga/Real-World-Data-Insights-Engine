import React, { useState, useEffect } from 'react';

import { FaProjectDiagram, FaDatabase, FaPlay, FaCheckCircle, FaHeart, FaUserAlt, FaPlus, FaTimes } from 'react-icons/fa';
import { MdOutlineShare } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import ProjectDetails from './ProjectDetails';
import { listProjects, getProjectStats } from '../../services/projectService';

export default function ProjectsIndexPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, totalDatasets: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle success/error messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setMessage({
        text: location.state.message,
        type: location.state.type || 'info'
      });

      // Clear the message from navigation state
      navigate(location.pathname, { replace: true, state: {} });

      // Auto-hide message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  }, [location.state, location.pathname, navigate]);

  // Load projects and stats on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsData, statsData] = await Promise.all([
        listProjects(),
        getProjectStats()
      ]);

      setProjects(projectsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
      setStats({ total: 0, active: 0, totalDatasets: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaPlay className="text-green-600" />;
      case 'completed':
        return <FaCheckCircle className="text-blue-600" />;
      case 'draft':
        return <FaUserAlt className="text-orange-500" />;
      default:
        return <FaHeart className="text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatLastModified = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  // Filter projects by search
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(search.toLowerCase()) ||
    project.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen page-bg text-textPrimary-light dark:text-textPrimary-dark">


      <div className="px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">My Projects</h1>
            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Manage and organize your data analysis projects
            </p>
          </div>
          <button
            onClick={() => navigate('/projects/create')}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 text-sm flex items-center gap-2"
          >
            <FaPlus /> New Project
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg border ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
              : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
            }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <div className="flex items-center gap-2">
                {message.type === 'success' && location.state?.projectId && (
                  <>
                    <button
                      onClick={() => navigate(`/projects/${location.state.projectId}`)}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      View Project
                    </button>
                    <button
                      onClick={() => navigate('/projects/create')}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Create Another
                    </button>
                  </>
                )}
                <button
                  onClick={() => setMessage(null)}
                  className="text-current hover:opacity-70"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full max-w-xs px-4 py-2 border border-default rounded bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-card-dark p-4 rounded shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-xl font-semibold">{loading ? '...' : stats.total}</p>
            </div>
            <FaProjectDiagram className="text-blue-500" size={24} />
          </div>
          <div className="bg-white dark:bg-card-dark p-4 rounded shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-xl font-semibold">{loading ? '...' : stats.active}</p>
            </div>
            <FaPlay className="text-green-500" size={24} />
          </div>
          <div className="bg-white dark:bg-card-dark p-4 rounded shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Datasets</p>
              <p className="text-xl font-semibold">{loading ? '...' : stats.totalDatasets}</p>
            </div>
            <FaDatabase className="text-blue-500" size={24} />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="col-span-3 text-center py-12">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Projects</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadProjects}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-12">
              <FaProjectDiagram className="mx-auto mb-4 text-6xl" />
              <h3 className="text-lg font-medium mb-2">
                {projects.length === 0 ? 'No projects yet' : 'No projects found'}
              </h3>
              <p className="text-sm mb-4">
                {projects.length === 0
                  ? 'Create your first project to start analyzing your datasets.'
                  : 'Try adjusting your search terms.'
                }
              </p>
              {projects.length === 0 && (
                <button
                  onClick={() => navigate('/projects/create')}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center gap-2 mx-auto"
                >
                  <FaPlus /> Create Your First Project
                </button>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-card-dark p-4 rounded shadow hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(project.status)}
                  <h2 className="font-semibold text-md">{project.title}</h2>
                </div>
                <p className="text-sm mb-2 text-textSecondary-light dark:text-textSecondary-dark line-clamp-2">
                  {project.description}
                </p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mb-3 font-medium ${getStatusColor(project.status || 'active')}`}>
                  {(project.status || 'active').charAt(0).toUpperCase() + (project.status || 'active').slice(1)}
                </span>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <p>{project.selectedDatasets?.length || 0} datasets</p>
                    <p>Updated {formatLastModified(project.updatedAt)}</p>
                    {project.dashboardConfig && (
                      <p className="text-purple-600 font-medium">📊 Dashboard saved</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Open Project
                    </button>
                    {project.dashboardConfig && (
                      <button
                        className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                        onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                        title="Open saved dashboard"
                      >
                        📊 Dashboard
                      </button>
                    )}
                    {/* Removed Visualizations button. Visualization now accessed from SingleProject page. */}
                    <button className="text-gray-400 hover:text-gray-600">
                      <MdOutlineShare size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { ProjectDetails };
