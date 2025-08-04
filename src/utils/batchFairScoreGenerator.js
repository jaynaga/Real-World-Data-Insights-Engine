/**
 * Batch FAIR Score Generator
 * One-time script to generate FAIR scores for existing datasets
 */

import { Storage } from 'aws-amplify';
import { listDatasets } from './storageUtils';

const triggerFairScoreGeneration = async (datasetKey) => {
  try {
    // This would trigger your Lambda function manually for existing datasets
    // You could either:
    // 1. Invoke the Lambda directly via AWS SDK
    // 2. Create a new API endpoint that processes existing datasets
    // 3. Re-upload a file to trigger the S3 event
    
    console.log(`Triggering FAIR score generation for: ${datasetKey}`);
    
    // Example: Copy file to trigger Lambda (if Lambda is set up on S3 events)
    const sourceKey = datasetKey;
    const tempKey = `${datasetKey}_temp`;
    
    // Copy file to temporary location to trigger Lambda
    await Storage.copy({ key: sourceKey }, { key: tempKey }, { level: 'protected' });
    
    // Delete temporary file
    await Storage.remove(tempKey, { level: 'protected' });
    
    console.log(`FAIR score generation triggered for: ${datasetKey}`);
    
  } catch (error) {
    console.error(`Failed to trigger FAIR score for ${datasetKey}:`, error);
  }
};

export const batchGenerateFairScores = async () => {
  try {
    console.log('Starting batch FAIR score generation...');
    
    const datasets = await listDatasets();
    
    for (const dataset of datasets) {
      // Check if FAIR score already exists
      try {
        const folderPath = dataset.key.substring(0, dataset.key.lastIndexOf('/'));
        const fairScoreKey = `${folderPath}/fairscore.json`;
        
        await Storage.get(fairScoreKey, { level: 'protected' });
        console.log(`FAIR score already exists for: ${dataset.key}`);
        
      } catch (error) {
        // FAIR score doesn't exist, generate it
        console.log(`Generating FAIR score for: ${dataset.key}`);
        await triggerFairScoreGeneration(dataset.key);
        
        // Add delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Batch FAIR score generation completed!');
    
  } catch (error) {
    console.error('Batch FAIR score generation failed:', error);
  }
};
