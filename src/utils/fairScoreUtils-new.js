/**
 * FAIR Score Utilities
 * Functions to fetch and display FAIR scores for datasets
 */

import { Storage } from 'aws-amplify';
import { generateFairScoreIfMissing } from './fairScoreAutoGenerator';

/**
 * Retrieves FAIR score for a dataset, generating one if it doesn't exist
 * The AWS Lambda backend now handles F-UJI integration automatically
 * @param {string} datasetKey - The S3 key/path of the dataset
 * @returns {Object|null} - FAIR score data or null if not found
 */
export const getFairScore = async (datasetKey) => {
  try {
    console.log('Attempting to fetch FAIR score for:', datasetKey);
    
    // Extract folder path from the dataset key
    const folderPath = datasetKey.includes('/') ? 
      datasetKey.substring(0, datasetKey.lastIndexOf('/')) : '';
    
    // Construct the fair score file path
    const fairScoreKey = folderPath ? `${folderPath}/fairscore.json` : 'fairscore.json';
    
    console.log('Looking for FAIR score at:', fairScoreKey);
    
    // Try to get the fair score file using Amplify Storage
    try {
      const scoreFile = await Storage.get(fairScoreKey, {
        level: 'protected',
        download: true
      });
      
      if (scoreFile && scoreFile.Body) {
        const scoreText = await scoreFile.Body.text();
        const scoreData = JSON.parse(scoreText);
        
        console.log('FAIR score found:', scoreData);
        return scoreData;
      }
    } catch (fetchError) {
      console.log('FAIR score not found, generating one...', fetchError.message);
      
      // Generate a new FAIR score using local logic
      // The Lambda function should handle F-UJI automatically for new uploads
      const generatedScore = await generateFairScoreIfMissing(datasetKey);
      if (generatedScore) {
        console.log('Generated new FAIR score:', generatedScore);
        
        // Save the generated score
        await Storage.put(fairScoreKey, JSON.stringify(generatedScore, null, 2), {
          level: 'protected',
          contentType: 'application/json'
        });
        
        return generatedScore;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching FAIR score:', error);
    return null;
  }
};

/**
 * Extract percentage from FAIR score data
 * Handles multiple formats for backwards compatibility
 * @param {Object} fairScoreData - FAIR score data object
 * @returns {number} - Percentage (0-100)
 */
export const getFairPercentage = (fairScoreData) => {
  if (!fairScoreData?.fair_score) {
    return 0;
  }

  // Direct percentage field
  if (typeof fairScoreData.fair_score.fair_percentage === 'number') {
    return fairScoreData.fair_score.fair_percentage;
  }

  // Calculate from total_score and total_possible
  if (fairScoreData.fair_score.total_score && fairScoreData.fair_score.total_possible) {
    return Math.round((fairScoreData.fair_score.total_score / fairScoreData.fair_score.total_possible) * 100);
  }

  // Fallback
  return 0;
};

/**
 * Get color based on FAIR score percentage
 * @param {number} percentage - FAIR score percentage
 * @returns {string} - Color class or hex color
 */
export const getFairScoreColor = (percentage) => {
  if (percentage >= 80) return '#22c55e'; // green-500
  if (percentage >= 60) return '#eab308'; // yellow-500
  if (percentage >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

/**
 * Get status text based on FAIR score percentage
 * @param {number} percentage - FAIR score percentage
 * @returns {string} - Status text
 */
export const getFairScoreStatus = (percentage) => {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Good';
  if (percentage >= 40) return 'Fair';
  return 'Poor';
};
