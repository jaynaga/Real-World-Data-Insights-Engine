import React from 'react';
import { FaFolder, FaCalendarAlt, FaUser, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ProjectList({ projects = [], loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FaFolder className="mx-auto text-4xl text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No projects yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Create your first project to get started with your research.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div 
          key={project.id}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FaFolder className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {project.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {project.description || 'No description provided'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <FaUser className="mr-1" />
                    {project.owner || 'You'}
                  </div>
                  <div className="flex items-center">
                    <FaEye className="mr-1" />
                    {project.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                {project.datasetsCount || 0} datasets
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
