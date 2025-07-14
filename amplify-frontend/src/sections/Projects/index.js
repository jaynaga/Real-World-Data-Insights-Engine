import React, { useState } from 'react';

import { FaProjectDiagram, FaDatabase, FaPlay, FaCheckCircle, FaHeart, FaUserAlt } from 'react-icons/fa';
import { MdOutlineShare } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import ProjectDetails from './ProjectDetails';

export default function ProjectsIndexPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const projects = [
    {
      title: 'Mental Health Analysis',
      description: 'Comprehensive analysis of mental health trends across different demographics and regions.',
      datasets: 12,
      updated: '2 hours ago',
      status: 'Active',
      icon: <FaPlay className="text-blue-600" />,
    },
    {
      title: 'Treatment Efficacy Study',
      description: 'Comparative analysis of different treatment modalities and their effectiveness rates.',
      datasets: 8,
      updated: '1 day ago',
      status: 'Active',
      icon: <FaCheckCircle className="text-green-600" />,
    },
    {
      title: 'Regional Health Patterns',
      description: 'Geographic distribution analysis of mental health indicators across different regions.',
      datasets: 15,
      updated: '3 days ago',
      status: 'Completed',
      icon: <FaDatabase className="text-purple-600" />,
    },
    {
      title: 'Youth Mental Health',
      description: 'Focused study on mental health challenges and trends among young adults and teenagers.',
      datasets: 6,
      updated: '5 days ago',
      status: 'Active',
      icon: <FaUserAlt className="text-orange-500" />,
    },
    {
      title: 'Workplace Wellness',
      description: 'Comprehensive analysis of mental health trends across different demographics and regions.',
      datasets: 12,
      updated: '2 hours ago',
      status: 'In Review',
      icon: <FaHeart className="text-red-500" />,
    },
  ];

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
          <button className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 text-sm">
            + New Project
          </button>
        </div>

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
              <p className="text-xl font-semibold">8</p>
            </div>
            <FaProjectDiagram className="text-blue-500" size={24} />
          </div>
          <div className="bg-white dark:bg-card-dark p-4 rounded shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-xl font-semibold">5</p>
            </div>
            <FaPlay className="text-green-500" size={24} />
          </div>
          <div className="bg-white dark:bg-card-dark p-4 rounded shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Datasets</p>
              <p className="text-xl font-semibold">47</p>
            </div>
            <FaDatabase className="text-blue-500" size={24} />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-8">No projects found.</div>
          ) : (
            filteredProjects.map((project, i) => (
              <div key={i} className="bg-white dark:bg-card-dark p-4 rounded shadow">
                <div className="flex items-center gap-2 mb-2">
                  {project.icon}
                  <h2 className="font-semibold text-md">{project.title}</h2>
                </div>
                <p className="text-sm mb-2 text-textSecondary-light dark:text-textSecondary-dark">{project.description}</p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mb-3 font-medium ${
                  project.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : project.status === 'In Review'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {project.status}
                </span>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <p>{project.datasets} datasets</p>
                    <p>Updated {project.updated}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => navigate('/projects/details')}
                    >
                      Open Project
                    </button>
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
