import { Storage } from 'aws-amplify';
import Amplify from 'aws-amplify';
import config from './src/amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(config);

// Copy the listDatasets function to test it
const listDatasets = async () => {
    try {
        console.log('Attempting to list datasets from multiple sources...');

        const allDatasets = [];

        // First, try to get Synthea datasets from raw folder
        console.log('Loading datasets from raw directory...');
        try {
            // Try multiple approaches to access the raw data
            const approaches = [
                // Approach 1: Try protected level
                {
                    name: 'Protected level access',
                    config: { path: 'raw/', level: 'protected' }
                },
                // Approach 2: Try public level
                {
                    name: 'Public level access',
                    config: { path: 'raw/', level: 'public' }
                },
                // Approach 3: Try root level and filter for raw
                {
                    name: 'Root level listing',
                    config: { path: '', level: 'public' }
                }
            ];

            for (const approach of approaches) {
                try {
                    console.log(`\nTrying ${approach.name}:`, approach.config);

                    const files = await Storage.list(approach.config.path, {
                        pageSize: 1000,
                        level: approach.config.level
                    });

                    console.log(`${approach.name} - Raw response (${files.length} files):`, files.map(f => f.key));

                    // Extract unique folder paths from raw directory
                    const rawFiles = files.filter(file => {
                        // Exclude the raw/ folder itself and only include files within dataset folders
                        return file.key.startsWith('raw/') &&
                            file.key !== 'raw/' &&
                            file.key.split('/').length >= 3 && // raw/dataset-folder/file.ext
                            !file.key.endsWith('/'); // Exclude folder entries, only include actual files
                    });

                    console.log(`${approach.name} - Filtered raw files:`, rawFiles.map(f => f.key));

                    if (rawFiles.length > 0) {
                        // Group files by their immediate folder under raw/
                        const folderMap = new Map();

                        rawFiles.forEach(file => {
                            const pathParts = file.key.split('/');
                            // Ensure we have: raw/dataset-folder/file.ext (minimum 3 parts)
                            if (pathParts.length >= 3 && pathParts[0] === 'raw' && pathParts[1] !== '') {
                                const folderName = pathParts[1]; // The immediate folder under raw/
                                const folderPath = `raw/${folderName}`;

                                // Skip if this is somehow the raw folder itself
                                if (folderName === '' || folderPath === 'raw/') {
                                    return;
                                }

                                if (!folderMap.has(folderPath)) {
                                    folderMap.set(folderPath, {
                                        files: [],
                                        totalSize: 0,
                                        lastModified: new Date(0)
                                    });
                                }

                                const folderData = folderMap.get(folderPath);
                                folderData.files.push(file);
                                folderData.totalSize += file.size || 0;

                                // Update last modified to the most recent file
                                if (file.lastModified && file.lastModified > folderData.lastModified) {
                                    folderData.lastModified = file.lastModified;
                                }
                            }
                        });

                        if (folderMap.size > 0) {
                            console.log(`SUCCESS with ${approach.name}! Found ${folderMap.size} dataset folders:`, Array.from(folderMap.keys()));

                            const processedDatasets = Array.from(folderMap.entries()).map(([folderPath, folderData]) => {
                                const folderName = folderPath.split('/')[1]; // Extract folder name from raw/folderName

                                // Try to determine if this is a Synthea dataset or user-uploaded dataset
                                const isUserUpload = folderName.includes('-') && /\d{13}$/.test(folderName); // Check for timestamp pattern
                                const displayName = isUserUpload
                                    ? folderName.replace(/-\d{13}$/, '').replace(/-/g, ' ') // Remove timestamp and clean up
                                    : folderName;

                                return {
                                    id: folderPath,
                                    name: displayName,
                                    key: folderPath,
                                    size: folderData.totalSize,
                                    lastModified: folderData.lastModified,
                                    format: 'folder',
                                    path: folderPath,
                                    accessLevel: approach.config.level,
                                    source: isUserUpload ? 'User Dataset' : 'Synthea Dataset',
                                    fileCount: folderData.files.length,
                                    files: folderData.files.map(f => ({
                                        name: f.key.split('/').pop(),
                                        key: f.key,
                                        size: f.size,
                                        lastModified: f.lastModified
                                    }))
                                };
                            });

                            console.log('Processed dataset folders:', processedDatasets);
                            allDatasets.push(...processedDatasets);
                            break; // Found datasets, no need to try other approaches
                        }
                    } else {
                        console.log(`${approach.name} - No files found in raw directory`);
                    }
                } catch (error) {
                    console.log(`${approach.name} failed:`, error.message);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error loading datasets from raw folder:', error);
            // Continue even if raw datasets fail
        }

        console.log(`Total datasets found: ${allDatasets.length}`);
        return allDatasets;

    } catch (error) {
        console.error('Error listing datasets:', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack
        });
        throw new Error(`Failed to load datasets: ${error.message}`);
    }
};

// Run the test
listDatasets().then(datasets => {
    console.log('\n=== FINAL RESULTS ===');
    console.log('Datasets found:', datasets.length);
    datasets.forEach((dataset, index) => {
        console.log(`${index + 1}. ${dataset.name} (${dataset.source})`);
        console.log(`   Path: ${dataset.path}`);
        console.log(`   Files: ${dataset.fileCount}`);
        console.log(`   Size: ${(dataset.size / 1024 / 1024).toFixed(1)} MB`);
    });
}).catch(error => {
    console.error('Test failed:', error);
});
