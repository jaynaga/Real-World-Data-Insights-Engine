/**
 * F-UJI FAIR Assessment API Integration
 * Uses the official F-UJI service for professional FAIR scoring
 */

/**
 * Assess FAIR score using F-UJI API
 * @param {string} objectIdentifier - URL or DOI of the dataset to assess
 * @returns {Promise<Object>} F-UJI assessment results
 */
export const assessWithFUJI = async (objectIdentifier) => {
  try {
    console.log('Assessing FAIR score with F-UJI for:', objectIdentifier);
    
    // F-UJI API endpoint
    const apiUrl = 'https://www.f-uji.net/fuji/api/v1/evaluate';
    
    // Prepare assessment request
    const requestBody = {
      object_identifier: objectIdentifier,
      test_debug: false,
      metadata_service_endpoint: null,
      metadata_service_type: null,
      use_datacite: true,
      datacite_endpoint: "https://api.datacite.org/application/vnd.datacite.datacite+json/",
      re3data_endpoint: "https://www.re3data.org/api/beta/repositories"
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // F-UJI may require basic auth - using public demo credentials
        'Authorization': 'Basic ' + btoa('demo:demo')
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`F-UJI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('F-UJI assessment completed:', result);
    
    return result;
    
  } catch (error) {
    console.error('Error calling F-UJI API:', error);
    throw error;
  }
};

/**
 * Convert F-UJI results to RWDE format
 * @param {Object} fujiResult - Raw F-UJI assessment result
 * @param {string} datasetKey - Original dataset key
 * @returns {Object} Converted score document
 */
export const convertFUJIToRWDEFormat = (fujiResult, datasetKey) => {
  try {
    // Extract overall scores
    const findableScore = fujiResult.summary?.score_findable?.earned || 0;
    const findableTotal = fujiResult.summary?.score_findable?.total || 1;
    const accessibleScore = fujiResult.summary?.score_accessible?.earned || 0;
    const accessibleTotal = fujiResult.summary?.score_accessible?.total || 1;
    const interoperableScore = fujiResult.summary?.score_interoperable?.earned || 0;
    const interoperableTotal = fujiResult.summary?.score_interoperable?.total || 1;
    const reusableScore = fujiResult.summary?.score_reusable?.earned || 0;
    const reusableTotal = fujiResult.summary?.score_reusable?.total || 1;
    
    const totalScore = findableScore + accessibleScore + interoperableScore + reusableScore;
    const totalPossible = findableTotal + accessibleTotal + interoperableTotal + reusableTotal;
    const fairPercentage = totalPossible > 0 ? 
      Math.round((totalScore / totalPossible) * 100 * 100) / 100 : 0;

    // Convert detailed results
    const detailedResults = {
      Findable: {},
      Accessible: {},
      Interoperable: {},
      Reusable: {}
    };

    // Process test results to match RWDE format
    if (fujiResult.results) {
      fujiResult.results.forEach(test => {
        const metric = test.metric_identifier || test.metric_name || 'Unknown';
        const score = test.score?.earned || 0;
        const maxScore = test.score?.total || 1;
        const normalizedScore = maxScore > 0 ? score / maxScore : 0;
        
        // Map F-UJI metrics to FAIR categories based on metric prefix
        if (metric.includes('F') || metric.toLowerCase().includes('findable')) {
          detailedResults.Findable[metric] = normalizedScore;
        } else if (metric.includes('A') || metric.toLowerCase().includes('accessible')) {
          detailedResults.Accessible[metric] = normalizedScore;
        } else if (metric.includes('I') || metric.toLowerCase().includes('interoperable')) {
          detailedResults.Interoperable[metric] = normalizedScore;
        } else if (metric.includes('R') || metric.toLowerCase().includes('reusable')) {
          detailedResults.Reusable[metric] = normalizedScore;
        }
      });
    }

    // Category totals
    const categoryTotals = {
      Findable: findableScore,
      Accessible: accessibleScore,
      Interoperable: interoperableScore,
      Reusable: reusableScore
    };

    // Create RWDE-compatible score document
    const scoreDocument = {
      dataset: datasetKey,
      metadata: {
        assessed_object: fujiResult.request?.object_identifier || datasetKey,
        assessment_timestamp: fujiResult.timestamp || new Date().toISOString(),
        f_uji_version: fujiResult.software_version || 'unknown',
        test_debug: fujiResult.test_debug || false,
        assessment_method: 'F-UJI (FAIRsFAIR Research Data Object Assessment Service)'
      },
      fair_score: {
        detailed_score: detailedResults,
        category_totals: categoryTotals,
        total_score: totalScore,
        total_possible: totalPossible,
        fair_percentage: fairPercentage,
        f_uji_raw_result: fujiResult // Keep original for reference
      },
      generated_at: new Date().toISOString(),
      version: "2.0",
      source: "F-UJI API"
    };

    return scoreDocument;
    
  } catch (error) {
    console.error('Error converting F-UJI result:', error);
    // Return a fallback score
    return {
      dataset: datasetKey,
      metadata: {
        assessment_method: 'F-UJI (error occurred)',
        error: error.message
      },
      fair_score: {
        detailed_score: { Findable: {}, Accessible: {}, Interoperable: {}, Reusable: {} },
        category_totals: { Findable: 0, Accessible: 0, Interoperable: 0, Reusable: 0 },
        total_score: 0,
        total_possible: 1,
        fair_percentage: 0
      },
      generated_at: new Date().toISOString(),
      version: "2.0",
      source: "F-UJI API (error)"
    };
  }
};

/**
 * Generate FAIR score using F-UJI API if possible, fallback to local logic
 * @param {string} datasetKey - The S3 key/path of the dataset
 * @returns {Object|null} Generated FAIR score data or null
 */
export const generateFairScoreWithFUJI = async (datasetKey) => {
  try {
    // For demo purposes, we'll create a mock URL for the dataset
    // In production, you'd need actual public URLs for your datasets
    const mockDatasetUrl = `https://example.com/datasets/${encodeURIComponent(datasetKey)}`;
    
    // Try F-UJI assessment first
    try {
      console.log('Attempting F-UJI assessment...');
      const fujiResult = await assessWithFUJI(mockDatasetUrl);
      const convertedScore = convertFUJIToRWDEFormat(fujiResult, datasetKey);
      console.log('F-UJI assessment successful:', convertedScore);
      return convertedScore;
      
    } catch (fujiError) {
      console.log('F-UJI assessment failed, using fallback logic:', fujiError.message);
      
      // Fallback to local scoring logic
      const { generateFairScoreIfMissing } = await import('./fairScoreAutoGenerator');
      return await generateFairScoreIfMissing(datasetKey);
    }
    
  } catch (error) {
    console.error('Error generating FAIR score:', error);
    return null;
  }
};
