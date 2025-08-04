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
    const currentTimestamp = Date.now();
    
    // Extract dataset characteristics for smarter suggestions
    const datasetNames = datasets.map(d => d.name.toLowerCase());
    const allFileNames = datasets.flatMap(d => d.files?.map(f => f.name.toLowerCase()) || []);
    const geographies = [...new Set(datasets.map(d => d.userGeography || d.geography).filter(Boolean))];
    const demographics = [...new Set(datasets.flatMap(d => d.userDemographics || d.demographics || []))];
    
    // Create dynamic suggestion pool based on actual dataset content
    const suggestionPool = [];

    // Add base research ideas that vary based on content
    if (allFileNames.some(f => f.includes('patient') || f.includes('demographic'))) {
      suggestionPool.push({
        id: `demographics-${currentTimestamp}`,
        title: 'Patient Demographics Deep Dive',
        description: `Analyze demographic patterns in your ${datasets.length} datasets focusing on ${demographics.length > 0 ? demographics.join(', ') : 'age, gender, and location'} distributions`,
        goal: `Perform a comprehensive demographic analysis across ${datasets.map(d => d.name).join(', ')} to understand population characteristics, identify underrepresented groups, and discover demographic risk factors.`
      });
    }

    if (datasetNames.some(n => n.includes('mental') || n.includes('depression') || n.includes('anxiety'))) {
      suggestionPool.push({
        id: `mental-health-${currentTimestamp}`,
        title: 'Mental Health Outcomes Analysis',
        description: 'Investigate mental health patterns and treatment effectiveness using your mental health datasets',
        goal: `Analyze mental health outcomes across your datasets, examining factors like treatment response, demographic influences, and intervention effectiveness. Focus on identifying predictive factors for better mental health outcomes.`
      });
    }

    if (datasetNames.some(n => n.includes('suicide') || n.includes('mortality'))) {
      suggestionPool.push({
        id: `mortality-analysis-${currentTimestamp}`,
        title: 'Mortality and Risk Factor Analysis',
        description: 'Examine mortality patterns and identify key risk factors in your population data',
        goal: `Conduct mortality analysis using your datasets to identify risk factors, demographic patterns, and potential prevention opportunities. Analyze trends over time and across different populations.`
      });
    }

    if (datasetNames.some(n => n.includes('synthea')) || allFileNames.some(f => f.includes('encounter') || f.includes('procedure'))) {
      suggestionPool.push({
        id: `healthcare-journey-${currentTimestamp}`,
        title: 'Patient Healthcare Journey Mapping',
        description: 'Map complete patient journeys through the healthcare system using encounter and procedure data',
        goal: `Create comprehensive patient journey maps using your encounter and procedure data. Identify common pathways, treatment patterns, and opportunities for care optimization.`
      });
    }

    if (allFileNames.some(f => f.includes('condition') || f.includes('diagnosis'))) {
      suggestionPool.push({
        id: `comorbidity-${currentTimestamp}`,
        title: 'Comorbidity Network Analysis',
        description: 'Explore relationships between different medical conditions and their co-occurrence patterns',
        goal: `Build a comorbidity network to understand how different medical conditions relate to each other in your patient population. Identify the most common condition combinations and their impact on outcomes.`
      });
    }

    if (datasetNames.some(n => n.includes('bullying') || n.includes('school') || n.includes('student'))) {
      suggestionPool.push({
        id: `educational-wellbeing-${currentTimestamp}`,
        title: 'Educational Environment and Wellbeing',
        description: 'Analyze the relationship between educational factors and student wellbeing outcomes',
        goal: `Examine how educational environment factors influence student wellbeing, mental health, and academic outcomes using your educational datasets.`
      });
    }

    if (datasetNames.some(n => n.includes('twitter') || n.includes('sentiment') || n.includes('social'))) {
      suggestionPool.push({
        id: `social-sentiment-${currentTimestamp}`,
        title: 'Social Media Sentiment and Health',
        description: 'Analyze social media sentiment patterns and their relationship to health topics',
        goal: `Investigate social media sentiment patterns related to health topics, identifying trends in public health discussions and their correlation with health outcomes.`
      });
    }

    // Add geographic-specific research if geography data is available
    if (geographies.length > 0) {
      suggestionPool.push({
        id: `geographic-health-${currentTimestamp}`,
        title: `Geographic Health Disparities (${geographies.join(', ')})`,
        description: `Examine health disparities across different geographic regions in your datasets`,
        goal: `Analyze geographic patterns in health outcomes across ${geographies.join(', ')}, identifying regional disparities and potential causes for different health outcomes by location.`
      });
    }

    // Add temporal analysis if multiple datasets suggest time-series data
    if (datasets.length > 1 || allFileNames.some(f => f.includes('time') || f.includes('date') || f.includes('year'))) {
      suggestionPool.push({
        id: `temporal-trends-${currentTimestamp}`,
        title: 'Temporal Health Trends Analysis',
        description: 'Identify trends and changes in health patterns over time across your datasets',
        goal: `Perform temporal analysis to identify changing health trends, seasonal patterns, and long-term shifts in health outcomes using your time-oriented data.`
      });
    }

    // Add predictive modeling suggestions based on data richness
    if (datasets.length >= 2 && demographics.length > 0) {
      suggestionPool.push({
        id: `predictive-modeling-${currentTimestamp}`,
        title: 'Predictive Health Outcome Modeling',
        description: 'Build predictive models to forecast health outcomes based on demographic and clinical factors',
        goal: `Develop machine learning models to predict health outcomes using demographic, clinical, and behavioral factors from your datasets. Focus on actionable predictions for healthcare intervention.`
      });
    }

    // Add cross-dataset comparison if multiple datasets
    if (datasets.length > 1) {
      suggestionPool.push({
        id: `cross-dataset-${currentTimestamp}`,
        title: 'Cross-Dataset Validation Study',
        description: 'Compare findings across different datasets to validate health patterns and outcomes',
        goal: `Conduct cross-dataset validation by comparing similar health metrics and outcomes across ${datasets.map(d => d.name).join(', ')} to identify consistent patterns and validate findings.`
      });
    }

    // Randomly select 4-6 suggestions from the pool to provide variety
    const selectedCount = Math.min(Math.max(4, Math.floor(suggestionPool.length * 0.7)), 6);
    const shuffled = suggestionPool.sort(() => 0.5 - Math.random());
    suggestions.push(...shuffled.slice(0, selectedCount));

    // Always add at least one general suggestion if we don't have enough specific ones
    if (suggestions.length < 3) {
      suggestions.push({
        id: `general-analysis-${currentTimestamp}`,
        title: 'Comprehensive Dataset Analysis',
        description: `Perform exploratory data analysis across your ${datasets.length} available datasets`,
        goal: `Conduct comprehensive exploratory data analysis of your available datasets (${datasets.map(d => d.name).join(', ')}) to identify key patterns, outliers, and relationships that could inform future research directions.`
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
