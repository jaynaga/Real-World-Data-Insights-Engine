/**
 * Test script to check FAIR score access
 */
const { Storage } = require('@aws-amplify/storage');
const { Amplify } = require('@aws-amplify/core');
const awsconfig = require('./src/aws-exports');

Amplify.configure(awsconfig);

async function testFairScoreAccess() {
    console.log('Testing FAIR score access...');
    
    // Test datasets with known FAIR scores
    const testDatasets = [
        'protected/us-east-1:93c96a21-bf10-c542-83fe-a4a162530e52/user-uploads/raw/Synthea/test.csv',
        'protected/us-east-1:93c96a21-bf10-c542-83fe-a4a162530e52/user-uploads/raw/bullying-in-schools-1754239322160/test.csv'
    ];
    
    for (const datasetKey of testDatasets) {
        try {
            const folderPath = datasetKey.substring(0, datasetKey.lastIndexOf('/'));
            const fairScoreKey = `${folderPath}/fairscore.json`;
            
            console.log(`\nTesting dataset: ${datasetKey}`);
            console.log(`Expected FAIR score path: ${fairScoreKey}`);
            
            // Try to get the fair score file
            try {
                const scoreFile = await Storage.get(fairScoreKey, {
                    level: 'protected',
                    download: true
                });
                
                if (scoreFile && scoreFile.Body) {
                    const scoreText = await scoreFile.Body.text();
                    const scoreData = JSON.parse(scoreText);
                    console.log(`✅ FAIR score found: ${scoreData.fair_score?.fair_percentage}%`);
                } else {
                    console.log('❌ No score data in file');
                }
            } catch (fetchError) {
                console.log(`❌ Failed to fetch FAIR score: ${fetchError.message}`);
                
                // Try to list files to see what's available
                try {
                    const files = await Storage.list(folderPath, { level: 'protected' });
                    console.log('Available files in folder:', files.map(f => f.key));
                } catch (listError) {
                    console.log('❌ Cannot list files:', listError.message);
                }
            }
        } catch (error) {
            console.error(`Error testing ${datasetKey}:`, error.message);
        }
    }
}

testFairScoreAccess().catch(console.error);
