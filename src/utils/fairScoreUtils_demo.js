/**
 * FAIR Score Utilities - Demo Version with Hardcoded Realistic Scores
 * Functions to generate realistic FAIR scores for demo purposes
 */

/**
 * Get FAIR score for a dataset - Demo version with hardcoded realistic scores
 * @param {string} datasetKey - The S3 key/path of the dataset
 * @returns {Object|null} - FAIR score data or null if not found
 */
export const getFairScore = async (datasetKey) => {
  try {
    console.log('🎭 FAIR Score Demo - Generating realistic scores for dataset:', datasetKey);
    
    // Generate realistic FAIR scores based on dataset type
    const generateRealisticScore = (datasetKey) => {
      // Seed the random generator based on dataset name for consistency
      const seed = datasetKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const random = (seed % 100) / 100;
      
      // Different dataset types get different score ranges
      let baseScore;
      let datasetType = 'Unknown';
      
      if (datasetKey.toLowerCase().includes('synthea')) {
        baseScore = 75 + (random * 15); // 75-90% for Synthea (well-structured)
        datasetType = 'Synthea Synthetic Patient Data';
      } else if (datasetKey.toLowerCase().includes('mimic')) {
        baseScore = 80 + (random * 15); // 80-95% for MIMIC (clinical standard)
        datasetType = 'MIMIC Clinical Database';
      } else if (datasetKey.toLowerCase().includes('genomic')) {
        baseScore = 70 + (random * 20); // 70-90% for genomic data
        datasetType = 'Genomic Dataset';
      } else if (datasetKey.toLowerCase().includes('imaging')) {
        baseScore = 65 + (random * 25); // 65-90% for imaging data
        datasetType = 'Medical Imaging Dataset';
      } else if (datasetKey.toLowerCase().includes('sensor')) {
        baseScore = 60 + (random * 25); // 60-85% for sensor data
        datasetType = 'IoT Sensor Data';
      } else {
        baseScore = 65 + (random * 25); // 65-90% for general datasets
        datasetType = 'Research Dataset';
      }
      
      const overall = Math.round(baseScore);
      
      // Generate component scores that add up to the overall score (approximately)
      const variance = 5 + (random * 10); // 5-15% variance between components
      const findable = Math.max(40, Math.min(100, overall + ((random - 0.5) * variance)));
      const accessible = Math.max(40, Math.min(100, overall + ((random - 0.3) * variance)));
      const interoperable = Math.max(30, Math.min(100, overall + ((random - 0.7) * variance)));
      const reusable = Math.max(35, Math.min(100, overall + ((random - 0.4) * variance)));
      
      return {
        overall: Math.round(overall),
        findable: Math.round(findable),
        accessible: Math.round(accessible),
        interoperable: Math.round(interoperable),
        reusable: Math.round(reusable),
        datasetType
      };
    };
    
    const scores = generateRealisticScore(datasetKey);
    
    console.log(`🎯 Generated realistic FAIR scores for ${scores.datasetType}:`, {
      overall: `${scores.overall}%`,
      F: `${scores.findable}%`,
      A: `${scores.accessible}%`,
      I: `${scores.interoperable}%`,
      R: `${scores.reusable}%`
    });
    
    // Return the score data in the expected format
    return {
      fair_score: {
        fair_percentage: scores.overall,
        total_score: scores.overall,
        total_possible: 100,
        components: {
          findable: scores.findable,
          accessible: scores.accessible,
          interoperable: scores.interoperable,
          reusable: scores.reusable
        }
      },
      assessment_type: 'Demo Assessment',
      dataset_type: scores.datasetType,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'Hardcoded Demo Scores',
        note: 'These are realistic demo scores for presentation purposes'
      }
    };
    
  } catch (error) {
    console.error('Error generating demo FAIR score:', error);
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
  if (percentage >= 80) return '#10B981'; // green
  if (percentage >= 60) return '#F59E0B'; // yellow
  if (percentage >= 40) return '#F97316'; // orange
  return '#EF4444'; // red
};

/**
 * Get status text based on FAIR score percentage
 * @param {number} percentage - FAIR score percentage
 * @returns {string} - Status text
 */
export const getFairScoreStatus = (percentage) => {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Good';
  if (percentage >= 40) return 'Needs Improvement';
  return 'Poor';
};

/**
 * Format FAIR score for display with breakdown
 * @param {Object} fairScoreData - FAIR score data object
 * @returns {Object} - Formatted score data for display
 */
export const formatFairScoreForDisplay = (fairScoreData) => {
  if (!fairScoreData?.fair_score) {
    return {
      percentage: 0,
      status: 'No Score',
      color: '#6B7280',
      breakdown: {},
      detailed: {}
    };
  }

  const percentage = getFairPercentage(fairScoreData);
  const color = getFairScoreColor(percentage);
  const status = getFairScoreStatus(percentage);

  let breakdown = {};
  let detailed = {};

  // Handle component scores
  if (fairScoreData.fair_score.components) {
    breakdown = {
      findable: fairScoreData.fair_score.components.findable || 0,
      accessible: fairScoreData.fair_score.components.accessible || 0,
      interoperable: fairScoreData.fair_score.components.interoperable || 0,
      reusable: fairScoreData.fair_score.components.reusable || 0
    };
  }

  // Add metadata if available
  if (fairScoreData.metadata) {
    detailed = {
      assessmentType: fairScoreData.assessment_type || 'Unknown',
      datasetType: fairScoreData.dataset_type || 'Unknown',
      timestamp: fairScoreData.timestamp || 'Unknown',
      source: fairScoreData.metadata.source || 'Unknown'
    };
  }

  return {
    percentage,
    status,
    color,
    breakdown,
    detailed
  };
};
