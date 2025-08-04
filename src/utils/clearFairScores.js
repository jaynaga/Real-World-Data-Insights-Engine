/**
 * Utility to clear existing FAIR scores for testing
 */

import { Storage } from 'aws-amplify';

/**
 * Clear all FAIR scores from S3 storage
 * @returns {Promise<number>} Number of scores cleared
 */
export const clearAllFairScores = async () => {
  try {
    console.log('Listing all files to find FAIR scores...');
    
    // List all files in protected storage
    const allFiles = await Storage.list('', { level: 'protected' });
    
    // Find all fairscore.json files
    const fairScoreFiles = allFiles.filter(file => 
      file.key.endsWith('/fairscore.json') || file.key === 'fairscore.json'
    );
    
    console.log(`Found ${fairScoreFiles.length} FAIR score files to delete:`, fairScoreFiles.map(f => f.key));
    
    // Delete each FAIR score file
    let deletedCount = 0;
    for (const file of fairScoreFiles) {
      try {
        await Storage.remove(file.key, { level: 'protected' });
        console.log(`Deleted: ${file.key}`);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete ${file.key}:`, error);
      }
    }
    
    console.log(`Successfully cleared ${deletedCount} FAIR scores`);
    return deletedCount;
    
  } catch (error) {
    console.error('Error clearing FAIR scores:', error);
    return 0;
  }
};

/**
 * Test scoring variation for different filenames
 * @param {Array<string>} testFilenames - Array of test filenames
 */
export const testScoringVariation = (testFilenames = [
  'test-data.csv',
  'user-upload-file.xlsx', 
  'sales_data_2023.json',
  'machine_learning_dataset.parquet',
  'experiment_results.txt'
]) => {
  console.log('=== FAIR Score Variation Test ===');
  
  testFilenames.forEach(filename => {
    const ext = filename.includes('.') ? 
      filename.substring(filename.lastIndexOf('.') + 1).toLowerCase() : 'unknown';
    
    // Same logic as the generator
    const nameHash = filename.split('').reduce((hash, char) => {
      return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);
    
    const variation1 = Math.abs(nameHash % 100) / 100;
    const variation2 = (filename.length % 10) / 10;
    const variation3 = Math.abs((nameHash * 7) % 100) / 100;
    
    // Predict approximate score
    let predictedScore = 0;
    const totalPossible = 14; // Based on RUBRIC
    
    // Quick score estimation based on the logic
    if (variation1 > 0.3) predictedScore += 1; // persistent_id
    if (variation1 > 0.4) predictedScore += 1; // description
    if (variation1 > 0.5) predictedScore += 1; // keywords
    if (variation1 > 0.2) predictedScore += 1; // indexed_in_portal
    predictedScore += 1; // protocol (always https)
    if (variation2 > 0.4) predictedScore += 1; // metadata_stability
    if (variation3 <= 0.7) predictedScore += 1; // access_level (public)
    predictedScore += 1; // format
    if (['csv', 'json', 'xml', 'txt', 'tsv', 'parquet', 'xlsx', 'xls'].includes(ext)) predictedScore += 1; // vocabularies_fair
    // linked_datasets usually 0 (variation1 > 0.8 is rare)
    if (variation2 > 0.5) predictedScore += 1; // curator
    if (variation3 > 0.3) predictedScore += 1; // provenance
    if (variation1 > 0.6 || variation2 > 0.3) predictedScore += 1; // license
    if (['csv', 'json', 'xml', 'txt', 'tsv', 'parquet', 'xlsx', 'xls'].includes(ext) && variation3 > 0.2) predictedScore += 1; // community_standards
    
    const predictedPercentage = Math.round((predictedScore / totalPossible) * 100);
    
    console.log(`${filename}: ${predictedPercentage}% (score: ${predictedScore}/${totalPossible}, hash: ${nameHash})`);
  });
  
  console.log('=== End Test ===');
};

/**
 * Clear FAIR score for a specific dataset
 * @param {string} datasetKey - The S3 key/path of the dataset
 * @returns {Promise<boolean>} True if score was cleared
 */
export const clearFairScoreForDataset = async (datasetKey) => {
  try {
    // Extract folder path from the dataset key
    const folderPath = datasetKey.includes('/') ? 
      datasetKey.substring(0, datasetKey.lastIndexOf('/')) : '';
    
    // Construct the fair score file path
    const fairScoreKey = folderPath ? `${folderPath}/fairscore.json` : 'fairscore.json';
    
    console.log(`Clearing FAIR score: ${fairScoreKey}`);
    
    await Storage.remove(fairScoreKey, { level: 'protected' });
    console.log(`Successfully cleared FAIR score for: ${datasetKey}`);
    return true;
    
  } catch (error) {
    console.error(`Error clearing FAIR score for ${datasetKey}:`, error);
    return false;
  }
};
