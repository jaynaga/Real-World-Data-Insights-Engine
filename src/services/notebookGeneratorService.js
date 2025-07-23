/**
 * AI Notebook Generator Service
 * Handles communication with the Lambda function for generating AI-powered Jupyter notebooks
 * Now powered by AWS Bedrock for intelligent analysis suggestions
 */

import { API } from 'aws-amplify';

const API_NAME = 'rwdeapi'; // This matches the API folder name
const NOTEBOOK_ENDPOINT = '/generate-notebook';

export class NotebookGeneratorService {
  /**
   * Generate an AI-powered Jupyter notebook using AWS Bedrock
   * @param {string} projectId - The project identifier
   * @param {string} goal - The research goal/question
   * @param {Array} files - List of files with name and description
   * @returns {Promise} Response with notebook key and download URL
   */
  static async generateNotebook(projectId, goal, files = []) {
    try {
      console.log('🤖 Generating AI notebook with Bedrock...', { projectId, goal, files });

      const requestBody = {
        projectId,
        goal,
        files
      };

      const response = await API.post(API_NAME, NOTEBOOK_ENDPOINT, {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Bedrock-powered notebook generated successfully:', response);
      return response;

    } catch (error) {
      console.error('❌ Failed to generate notebook:', error);
      throw new Error(`Failed to generate notebook: ${error.message}`);
    }
  }

  /**
   * Get suggested research ideas based on available dataset folders
   * @param {Array} datasets - List of available dataset folders
   * @returns {Array} Array of suggested research questions
   */
  static getSuggestedResearchIdeas(datasets) {
    const suggestions = [];

    // General healthcare suggestions
    suggestions.push({
      id: 'demographics',
      title: 'Patient Demographics Analysis',
      description: 'Analyze patient demographics and identify patterns in age, gender, and geographic distribution',
      goal: 'Analyze patient demographics across the available datasets to understand the distribution of age groups, gender, race, and geographic locations. Identify patterns in healthcare utilization across different demographic segments.'
    });

    suggestions.push({
      id: 'outcomes',
      title: 'Treatment Outcomes Research',
      description: 'Investigate treatment effectiveness and patient outcomes across different conditions',
      goal: 'Examine treatment outcomes and effectiveness across different medical conditions using multiple datasets. Analyze factors that influence patient recovery rates and treatment success.'
    });

    suggestions.push({
      id: 'utilization',
      title: 'Healthcare Utilization Patterns',
      description: 'Study healthcare service utilization patterns and identify optimization opportunities',
      goal: 'Analyze healthcare utilization patterns across datasets to identify trends in emergency room visits, routine care, and specialty consultations. Find opportunities to optimize resource allocation.'
    });

    // Dataset-specific suggestions based on dataset names and content
    if (datasets.some(d => d.name.toLowerCase().includes('synthea'))) {
      suggestions.push({
        id: 'synthea-analysis',
        title: 'Synthea Dataset Comprehensive Analysis',
        description: 'Complete analysis of synthetic healthcare data from Synthea',
        goal: 'Perform comprehensive analysis of the Synthea synthetic healthcare dataset, including patient journeys, condition prevalence, treatment patterns, and healthcare costs across the synthetic population.'
      });
    }

    if (datasets.some(d => d.files && d.files.some(f => f.name.toLowerCase().includes('encounter')))) {
      suggestions.push({
        id: 'encounters',
        title: 'Healthcare Encounters Analysis',
        description: 'Deep dive into healthcare encounters and visit patterns',
        goal: 'Analyze healthcare encounters across datasets to understand visit patterns, frequency, and factors influencing different types of medical visits. Identify trends in emergency vs. routine care.'
      });
    }

    if (datasets.some(d => d.files && d.files.some(f => f.name.toLowerCase().includes('condition')))) {
      suggestions.push({
        id: 'conditions',
        title: 'Medical Conditions Study',
        description: 'Research medical conditions prevalence and comorbidities',
        goal: 'Study the prevalence of medical conditions across datasets, identify common comorbidities, and analyze the relationship between different health conditions and patient outcomes.'
      });
    }

    if (datasets.some(d => d.files && d.files.some(f => f.name.toLowerCase().includes('medication')))) {
      suggestions.push({
        id: 'medications',
        title: 'Medication Analysis',
        description: 'Analyze medication prescriptions and effectiveness',
        goal: 'Examine medication prescription patterns, dosage trends, and effectiveness across datasets. Identify potential drug interactions and optimize medication management strategies.'
      });
    }

    if (datasets.some(d => d.name.toLowerCase().includes('clinical') || d.name.toLowerCase().includes('research'))) {
      suggestions.push({
        id: 'clinical-research',
        title: 'Clinical Research Analysis',
        description: 'Analyze clinical research data and outcomes',
        goal: 'Conduct comprehensive analysis of clinical research datasets to identify research trends, patient outcomes, and effectiveness of different treatment protocols.'
      });
    }

    return suggestions;
  }

  /**
   * Validate research goal input
   * @param {string} goal - The research goal to validate
   * @returns {Object} Validation result with isValid and error message
   */
  static validateResearchGoal(goal) {
    if (!goal || typeof goal !== 'string') {
      return { isValid: false, error: 'Research goal is required' };
    }

    if (goal.length < 20) {
      return { isValid: false, error: 'Research goal must be at least 20 characters long' };
    }

    if (goal.length > 2000) {
      return { isValid: false, error: 'Research goal must be less than 2000 characters' };
    }

    // Check for meaningful content
    const words = goal.split(' ').filter(word => word.length > 2);
    if (words.length < 5) {
      return { isValid: false, error: 'Please provide a more detailed research goal' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Format files for API request - now handles dataset folders
   * @param {Array} rawDatasets - Raw dataset folder objects from S3
   * @returns {Array} Formatted files array
   */
  static formatFilesForAPI(rawDatasets) {
    return rawDatasets.map(dataset => ({
      name: dataset.name,
      description: this.generateDatasetDescription(dataset),
      fileCount: dataset.fileCount || 0,
      size: dataset.size,
      lastModified: dataset.lastModified,
      files: dataset.files || [],
      path: dataset.key
    }));
  }

  /**
   * Generate description for a dataset folder based on its name and contents
   * @param {Object} dataset - Dataset folder object
   * @returns {string} Generated description
   */
  static generateDatasetDescription(dataset) {
    const datasetName = (dataset.name || '').toLowerCase();
    const fileCount = dataset.fileCount || 0;
    const files = dataset.files || [];

    let description = `Dataset folder containing ${fileCount} files`;

    if (datasetName.includes('synthea')) {
      description = `Synthea synthetic healthcare dataset with ${fileCount} files including patient demographics, encounters, conditions, medications, and procedures`;
    } else if (datasetName.includes('patient')) {
      description = `Patient data collection with ${fileCount} files containing demographic and clinical information`;
    } else if (datasetName.includes('clinical')) {
      description = `Clinical dataset with ${fileCount} files containing medical records and treatment data`;
    } else if (datasetName.includes('survey')) {
      description = `Survey dataset with ${fileCount} files containing questionnaire and response data`;
    } else if (datasetName.includes('research')) {
      description = `Research dataset with ${fileCount} files for academic and clinical studies`;
    }

    // Add file type information if available
    const csvFiles = files.filter(f => f.name.endsWith('.csv')).length;
    const jsonFiles = files.filter(f => f.name.endsWith('.json')).length;
    const xlsFiles = files.filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')).length;

    if (csvFiles > 0 || jsonFiles > 0 || xlsFiles > 0) {
      description += ` (${csvFiles} CSV, ${jsonFiles} JSON, ${xlsFiles} Excel files)`;
    }

    return description;
  }
}

export default NotebookGeneratorService;
