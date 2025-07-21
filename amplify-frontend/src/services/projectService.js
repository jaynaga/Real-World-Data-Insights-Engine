// Project service for managing project operations
import { Storage } from 'aws-amplify';

const PROJECTS_PREFIX = 'projects/';

// Create a new project
export const createProject = async (projectData) => {
  try {
    console.log('Starting project creation process...');
    const projectKey = `${PROJECTS_PREFIX}${projectData.id}.json`;

    const projectDocument = {
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };

    console.log('Creating project with key:', projectKey);
    console.log('Project document:', projectDocument);

    // Store project metadata in S3
    console.log('Calling Storage.put...');
    const result = await Storage.put(projectKey, JSON.stringify(projectDocument, null, 2), {
      level: 'protected',
      contentType: 'application/json',
      metadata: {
        projectId: projectData.id,
        projectTitle: projectData.title,
        createdAt: projectDocument.createdAt
      }
    });

    console.log('Storage.put completed:', result);
    console.log('Project created successfully in S3');
    return { ...projectDocument, key: projectKey };
  } catch (error) {
    console.error('Error in createProject:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw new Error(`Failed to create project: ${error.message}`);
  }
};

// List all projects for the current user
export const listProjects = async () => {
  try {
    console.log('Listing projects...');

    const files = await Storage.list(PROJECTS_PREFIX, {
      level: 'protected',
      pageSize: 100
    });

    console.log('Project files found:', files);

    // Filter for JSON project files and load their content
    const projectFiles = files.filter(file =>
      file.key.endsWith('.json') && file.size > 0
    );

    if (projectFiles.length === 0) {
      console.log('No projects found');
      return [];
    }

    // Load project data for each file
    const projectPromises = projectFiles.map(async (file) => {
      try {
        const content = await Storage.get(file.key, {
          level: 'protected',
          download: true
        });

        const projectData = JSON.parse(await content.Body.text());

        return {
          ...projectData,
          key: file.key,
          size: file.size,
          lastModified: file.lastModified || projectData.updatedAt
        };
      } catch (error) {
        console.error(`Error loading project ${file.key}:`, error);
        return null;
      }
    });

    const projects = (await Promise.all(projectPromises))
      .filter(project => project !== null)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort by most recent first

    console.log('Loaded projects:', projects);
    return projects;
  } catch (error) {
    console.error('Error listing projects:', error);
    throw new Error(`Failed to list projects: ${error.message}`);
  }
};

// Get a specific project by ID
export const getProject = async (projectId) => {
  try {
    const projectKey = `${PROJECTS_PREFIX}${projectId}.json`;

    console.log(`Loading project: ${projectId}`);

    const result = await Storage.get(projectKey, {
      level: 'protected',
      download: true
    });

    const projectData = JSON.parse(await result.Body.text());

    return {
      ...projectData,
      key: projectKey
    };
  } catch (error) {
    console.error(`Error getting project ${projectId}:`, error);

    if (error.name === 'NoSuchKey') {
      throw new Error('Project not found');
    }

    throw new Error(`Failed to load project: ${error.message}`);
  }
};

// Update an existing project
export const updateProject = async (projectId, updates) => {
  try {
    // First get the existing project
    const existingProject = await getProject(projectId);

    // Merge updates with existing data
    const updatedProject = {
      ...existingProject,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: parseFloat(existingProject.version || '1.0') + 0.1 + ''
    };

    // Save back to S3
    const projectKey = `${PROJECTS_PREFIX}${projectId}.json`;

    await Storage.put(projectKey, JSON.stringify(updatedProject, null, 2), {
      level: 'protected',
      contentType: 'application/json',
      metadata: {
        projectId: projectId,
        projectTitle: updatedProject.title,
        updatedAt: updatedProject.updatedAt
      }
    });

    console.log('Project updated successfully:', updatedProject);
    return updatedProject;
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw new Error(`Failed to update project: ${error.message}`);
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    const projectKey = `${PROJECTS_PREFIX}${projectId}.json`;

    console.log(`Deleting project: ${projectId}`);

    await Storage.remove(projectKey, {
      level: 'protected'
    });

    console.log('Project deleted successfully');
    return true;
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
};

// Add dataset to project
export const addDatasetToProject = async (projectId, datasetId) => {
  try {
    const project = await getProject(projectId);

    if (!project.selectedDatasets.includes(datasetId)) {
      const updatedDatasets = [...project.selectedDatasets, datasetId];
      await updateProject(projectId, { selectedDatasets: updatedDatasets });
    }

    return await getProject(projectId);
  } catch (error) {
    console.error(`Error adding dataset to project ${projectId}:`, error);
    throw error;
  }
};

// Remove dataset from project
export const removeDatasetFromProject = async (projectId, datasetId) => {
  try {
    const project = await getProject(projectId);

    const updatedDatasets = project.selectedDatasets.filter(id => id !== datasetId);
    await updateProject(projectId, { selectedDatasets: updatedDatasets });

    return await getProject(projectId);
  } catch (error) {
    console.error(`Error removing dataset from project ${projectId}:`, error);
    throw error;
  }
};

// Update project status
export const updateProjectStatus = async (projectId, status) => {
  try {
    const validStatuses = ['draft', 'active', 'completed', 'archived'];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return await updateProject(projectId, { status });
  } catch (error) {
    console.error(`Error updating project status ${projectId}:`, error);
    throw error;
  }
};

// Get project statistics
export const getProjectStats = async () => {
  try {
    const projects = await listProjects();

    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      draft: projects.filter(p => p.status === 'draft').length,
      totalDatasets: projects.reduce((sum, p) => sum + (p.selectedDatasets?.length || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error getting project stats:', error);
    return {
      total: 0,
      active: 0,
      completed: 0,
      draft: 0,
      totalDatasets: 0
    };
  }
};

// Helper function to validate project data
export const validateProjectData = (projectData) => {
  const errors = {};

  if (!projectData.title?.trim()) {
    errors.title = 'Project title is required';
  }

  if (!projectData.description?.trim()) {
    errors.description = 'Project description is required';
  }

  if (projectData.title && projectData.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }

  if (projectData.description && projectData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
