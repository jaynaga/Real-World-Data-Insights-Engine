/**
 * Utility to clear old FAIR scores and regenerate them with F-UJI
 */

import { Storage } from 'aws-amplify';

export const listAllFairScoreFiles = async () => {
  try {
    console.log('📋 Listing all fairscore.json files...');
    
    const accessLevels = ['protected', 'public'];
    const allFairScoreFiles = [];
    
    for (const level of accessLevels) {
      try {
        console.log(`🔍 Checking ${level} level...`);
        
        // List all files with pagination
        let continuationToken = null;
        let allFiles = [];
        
        do {
          const listParams = {
            level: level,
            pageSize: 1000
          };
          
          if (continuationToken) {
            listParams.nextToken = continuationToken;
          }
          
          const response = await Storage.list('', listParams);
          allFiles.push(...response);
          continuationToken = response.nextToken;
          
        } while (continuationToken);
        
        console.log(`📁 Found ${allFiles.length} total files in ${level} level`);
        
        // Filter for fairscore.json files
        const fairScoreFiles = allFiles.filter(file => 
          file.key.endsWith('/fairscore.json') || file.key === 'fairscore.json'
        );
        
        console.log(`🎯 Found ${fairScoreFiles.length} fairscore.json files in ${level}:`, 
          fairScoreFiles.map(f => f.key));
        
        allFairScoreFiles.push(...fairScoreFiles.map(f => ({ ...f, level })));
        
      } catch (error) {
        console.log(`❌ Error listing ${level} files:`, error.message);
      }
    }
    
    return allFairScoreFiles;
    
  } catch (error) {
    console.error('❌ Error listing FAIR score files:', error);
    throw error;
  }
};

export const clearOldFairScores = async () => {
  try {
    console.log('🧹 Starting to clear old FAIR scores...');
    
    // First list all fairscore files
    const fairScoreFiles = await listAllFairScoreFiles();
    
    if (fairScoreFiles.length === 0) {
      console.log('✅ No fairscore.json files found to delete');
      return { total: 0, deleted: 0, errors: 0, results: [] };
    }
    
    console.log(`🎯 Found ${fairScoreFiles.length} FAIR score files to delete`);
    
    // Delete each fairscore.json file
    const deletePromises = fairScoreFiles.map(async (file) => {
      try {
        await Storage.remove(file.key, { level: file.level });
        console.log(`✅ Deleted: ${file.key} (${file.level})`);
        return { key: file.key, level: file.level, status: 'deleted' };
      } catch (error) {
        console.error(`❌ Failed to delete ${file.key}:`, error);
        return { key: file.key, level: file.level, status: 'error', error: error.message };
      }
    });
    
    const results = await Promise.all(deletePromises);
    
    const successCount = results.filter(r => r.status === 'deleted').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`🎉 Clearing complete! Deleted: ${successCount}, Errors: ${errorCount}`);
    
    return {
      total: fairScoreFiles.length,
      deleted: successCount,
      errors: errorCount,
      results
    };
    
  } catch (error) {
    console.error('❌ Error clearing FAIR scores:', error);
    throw error;
  }
};

export const regenerateFairScores = async () => {
  try {
    console.log('🔄 Starting FAIR score regeneration with F-UJI...');
    
    // Clear old scores first
    const clearResult = await clearOldFairScores();
    console.log('🧹 Clear result:', clearResult);
    
    // Force a page reload to trigger new FAIR score generation
    console.log('🔄 Reloading page to trigger F-UJI assessment...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error regenerating FAIR scores:', error);
    throw error;
  }
};
