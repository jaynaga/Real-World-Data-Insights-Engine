/**
 * Batch F-UJI Processor for Existing S3 Datasets
 * This script will find existing datasets and generate FAIR scores for them
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { callFUJIAPI, convertFUJIResult, extractMetadataFromFile, scoreMetadata, CONFIG, shouldSkipFUJI, intelligentDelay } = require('./index');

// Initialize AWS SDK
const s3 = new S3Client();

/**
 * Generate a secure pre-signed URL for F-UJI access
 * This gives F-UJI temporary access to private S3 objects
 */
async function generatePresignedUrlForFUJI(bucketName, key, expiresIn = 3600) {
    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });
        
        const presignedUrl = await getSignedUrl(s3, command, { expiresIn });
        console.log(`🔐 Generated secure pre-signed URL for F-UJI: ${key}`);
        return presignedUrl;
    } catch (error) {
        console.error(`❌ Failed to generate pre-signed URL for ${key}:`, error.message);
        return null;
    }
}

/**
 * Create F-UJI compatible metadata for a dataset
 * This helps F-UJI understand the dataset structure
 */
function createFUJIMetadata(datasetMetadata, presignedUrls = []) {
    return {
        "@context": "https://schema.org/",
        "@type": "Dataset",
        "name": datasetMetadata.dataset_name,
        "description": `Dataset containing ${datasetMetadata.total_files} files with ${datasetMetadata.file_types.join(', ')} data types`,
        "url": presignedUrls[0] || null,
        "distribution": presignedUrls.map(url => ({
            "@type": "DataDownload",
            "contentUrl": url,
            "encodingFormat": "application/octet-stream"
        })),
        "creator": {
            "@type": "Organization",
            "name": "RWDE Platform"
        },
        "dateCreated": datasetMetadata.last_modified,
        "keywords": datasetMetadata.file_types,
        "license": "https://creativecommons.org/licenses/by/4.0/", // Default license
        "size": `${Math.round(datasetMetadata.total_size / 1024 / 1024)} MB`,
        "numberOfFiles": datasetMetadata.total_files,
        "fileFormat": datasetMetadata.file_types
    };
}

/**
 * Find all datasets in S3 that don't have FAIR scores
 * Groups files by dataset (common prefix) and checks for existing scores
 */
async function findDatasetsWithoutScores(bucketName, prefix = '') {
    console.log(`🔍 Scanning bucket ${bucketName} for datasets without FAIR scores...`);
    
    const datasets = new Map(); // Map of dataset prefix -> file list
    let continuationToken = null;
    
    do {
        const params = {
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken
        };
        
        const response = await s3.send(new ListObjectsV2Command(params));
        
        if (response.Contents) {
            for (const object of response.Contents) {
                const key = object.Key;
                
                // Skip files that are not data files or are already FAIR scores
                if (key.endsWith('/') || 
                    key.includes('fairscore.json') || 
                    key.includes('.DS_Store') ||
                    key.includes('Thumbs.db')) {
                    continue;
                }
                
                // Determine dataset prefix - group by dataset folder within /raw/
                let datasetPrefix;
                if (key.includes('/raw/')) {
                    // Extract dataset folder within /raw/
                    const pathParts = key.split('/');
                    const rawIndex = pathParts.findIndex(part => part === 'raw');
                    
                    if (rawIndex !== -1 && rawIndex + 1 < pathParts.length) {
                        // Dataset is everything up to and including the dataset folder after /raw/
                        datasetPrefix = pathParts.slice(0, rawIndex + 2).join('/');
                    } else {
                        // Fallback to folder structure
                        datasetPrefix = key.substring(0, key.lastIndexOf('/'));
                    }
                } else if (key.includes('/')) {
                    // For non-raw files, group by immediate parent folder
                    datasetPrefix = key.substring(0, key.lastIndexOf('/'));
                } else {
                    // Root level file - treat as its own dataset
                    datasetPrefix = key.replace(/\.[^/.]+$/, ''); // Remove extension
                }
                
                // Group files by dataset
                if (!datasets.has(datasetPrefix)) {
                    // Extract dataset name from path
                    const pathParts = datasetPrefix.split('/');
                    let datasetName = pathParts[pathParts.length - 1]; // Last folder name
                    
                    // For /raw/ datasets, use the dataset folder name
                    if (datasetPrefix.includes('/raw/')) {
                        const rawIndex = pathParts.findIndex(part => part === 'raw');
                        if (rawIndex !== -1 && rawIndex + 1 < pathParts.length) {
                            datasetName = pathParts[rawIndex + 1];
                        }
                    }
                    
                    datasets.set(datasetPrefix, {
                        prefix: datasetPrefix,
                        name: datasetName,
                        files: [],
                        scoreKey: datasetPrefix.includes('/') ? 
                            `${datasetPrefix}/fairscore.json` : 
                            `${datasetPrefix}/fairscore.json`,
                        totalSize: 0,
                        lastModified: object.LastModified
                    });
                }
                
                datasets.get(datasetPrefix).files.push({
                    key: key,
                    size: object.Size,
                    lastModified: object.LastModified
                });
                datasets.get(datasetPrefix).totalSize += object.Size;
                
                // Update last modified to most recent file
                if (object.LastModified > datasets.get(datasetPrefix).lastModified) {
                    datasets.get(datasetPrefix).lastModified = object.LastModified;
                }
            }
        }
        
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    // Now check which datasets don't have FAIR scores
    const datasetsNeedingScores = [];
    
    for (const [, dataset] of datasets) {
        try {
            await s3.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: dataset.scoreKey
            }));
            console.log(`✅ Dataset "${dataset.name}" already has FAIR score (${dataset.files.length} files)`);
        } catch (error) {
            // No FAIR score exists, add to processing list
            console.log(`📋 Dataset "${dataset.name}" needs FAIR score (${dataset.files.length} files, ${(dataset.totalSize / 1024 / 1024).toFixed(2)} MB)`);
            datasetsNeedingScores.push(dataset);
        }
    }
    
    console.log(`📊 Found ${datasetsNeedingScores.length} datasets without FAIR scores (${datasets.size} total datasets)`);
    return datasetsNeedingScores;
}

/**
 * Process a single dataset with rate limiting
 * Now handles multiple files per dataset and creates comprehensive metadata
 */
async function processDataset(bucketName, dataset) {
    console.log(`\n🔄 Processing dataset: ${dataset.name} (${dataset.files.length} files)`);
    
    try {
        // Process all files in the dataset to create comprehensive metadata
        const allMetadata = [];
        const fileDetails = [];
        
        console.log(`📁 Analyzing ${dataset.files.length} files in dataset...`);
        
        for (const file of dataset.files) {
            try {
                console.log(`  📄 Processing file: ${file.key}`);
                
                // Get the file content
                const data = await s3.send(new GetObjectCommand({
                    Bucket: bucketName,
                    Key: file.key
                }));
                
                const fileContent = data.Body;
                const metadata = extractMetadataFromFile(fileContent, file.key, 'batch-processor');
                
                allMetadata.push(metadata);
                fileDetails.push({
                    filename: file.key.split('/').pop(),
                    path: file.key,
                    size: file.size,
                    type: metadata.file_type,
                    rows: metadata.row_count || 0,
                    columns: metadata.column_count || 0,
                    headers: metadata.headers || []
                });
                
                console.log(`    ✅ ${metadata.file_type} - ${metadata.row_count || 0} rows, ${metadata.column_count || 0} cols`);
                
            } catch (fileError) {
                console.log(`    ❌ Error processing ${file.key}: ${fileError.message}`);
                // Continue with other files
            }
        }
        
        // Create comprehensive dataset metadata
        const datasetMetadata = {
            dataset_name: dataset.prefix.split('/').pop() || dataset.prefix,
            dataset_path: dataset.prefix,
            total_files: dataset.files.length,
            total_size: dataset.totalSize,
            file_types: [...new Set(allMetadata.map(m => m.file_type))],
            total_rows: allMetadata.reduce((sum, m) => sum + (m.row_count || 0), 0),
            total_columns: Math.max(...allMetadata.map(m => m.column_count || 0), 0),
            unique_headers: [...new Set(allMetadata.flatMap(m => m.headers || []))],
            files: fileDetails,
            last_modified: dataset.lastModified,
            has_documentation: dataset.files.some(f => 
                f.key.toLowerCase().includes('readme') || 
                f.key.toLowerCase().includes('documentation') ||
                f.key.toLowerCase().endsWith('.md') ||
                f.key.toLowerCase().endsWith('.txt')
            ),
            has_metadata_file: dataset.files.some(f => 
                f.key.toLowerCase().includes('metadata') ||
                f.key.toLowerCase().endsWith('.json') ||
                f.key.toLowerCase().endsWith('.xml')
            )
        };
        
        console.log(`📊 Dataset summary: ${datasetMetadata.total_files} files, ${datasetMetadata.file_types.join(', ')}, ${datasetMetadata.total_rows} total rows`);
        
        let scoreResult;
        let assessmentMethod = 'Local RWDE Assessment';
        
        // Try F-UJI assessment first (with rate limiting)
        if (CONFIG.enableFUJI && !shouldSkipFUJI()) {
            try {
                // Add intelligent delay before F-UJI call
                await intelligentDelay();
                
                // Option 1: Use pre-signed URL for primary dataset file
                let datasetUrl = null;
                
                // Generate pre-signed URLs for key files
                const keyFiles = dataset.files.slice(0, 3); // First 3 files
                const presignedUrls = [];
                
                for (const file of keyFiles) {
                    const presignedUrl = await generatePresignedUrlForFUJI(bucketName, file.key, 7200);
                    if (presignedUrl) {
                        presignedUrls.push(presignedUrl);
                    }
                }
                
                if (presignedUrls.length > 0) {
                    // Option A: Use first pre-signed URL directly
                    datasetUrl = presignedUrls[0];
                    
                    // Option B: Create structured metadata and upload to public location
                    const fujiMetadata = createFUJIMetadata(datasetMetadata, presignedUrls);
                    const metadataKey = `public/fuji-metadata/${dataset.prefix.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
                    
                    try {
                        await s3.send(new PutObjectCommand({
                            Bucket: bucketName,
                            Key: metadataKey,
                            Body: JSON.stringify(fujiMetadata, null, 2),
                            ContentType: 'application/json',
                            ACL: 'public-read' // Make this metadata file public
                        }));
                        
                        // Use the public metadata URL for F-UJI
                        datasetUrl = `https://${bucketName}.s3.amazonaws.com/${metadataKey}`;
                        console.log(`📄 Created public metadata file for F-UJI: ${datasetUrl}`);
                    } catch (metadataError) {
                        console.log('⚠️  Could not create public metadata, using pre-signed URL');
                        datasetUrl = presignedUrls[0];
                    }
                }
                
                if (!datasetUrl) {
                    console.log('⚠️  Could not generate secure URL for F-UJI, skipping');
                    throw new Error('No accessible URL available for F-UJI');
                }
                
                console.log(`🔍 Attempting F-UJI assessment with secure URL...`);
                const fujiResult = await callFUJIAPI(datasetUrl);
                
                if (fujiResult) {
                    console.log('✅ F-UJI assessment successful with secure access');
                    scoreResult = convertFUJIResult(fujiResult, datasetMetadata);
                    assessmentMethod = 'F-UJI Professional Assessment (Secure Access)';
                }
            } catch (fujiError) {
                console.log(`❌ F-UJI failed: ${fujiError.message}`);
                console.log('🔄 Falling back to local assessment');
            }
        } else {
            console.log('🔴 F-UJI skipped (disabled or rate limited)');
        }
        
        // Fallback to local scoring
        if (!scoreResult) {
            console.log('🏠 Using local FAIR scoring');
            scoreResult = scoreMetadata(datasetMetadata);
            scoreResult.assessment_method = assessmentMethod;
        }
        
        // Create comprehensive score document
        const scoreDocument = {
            dataset: dataset.prefix,
            metadata: datasetMetadata,
            fair_score: scoreResult,
            generated_at: new Date().toISOString(),
            version: "2.0",
            assessment_method: assessmentMethod,
            batch_processed: true
        };
        
        // Save the score
        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: dataset.scoreKey,
            Body: JSON.stringify(scoreDocument, null, 2),
            ContentType: 'application/json'
        }));
        
        console.log(`✅ FAIR score saved: ${scoreResult.fair_percentage}% (${assessmentMethod})`);
        return { success: true, score: scoreResult.fair_percentage, method: assessmentMethod, dataset: dataset.prefix };
        
    } catch (error) {
        console.error(`❌ Error processing dataset ${dataset.prefix}:`, error.message);
        return { success: false, error: error.message, dataset: dataset.prefix };
    }
}

/**
 * Batch process all datasets with progress reporting
 */
async function batchProcessDatasets(bucketName, options = {}) {
    const {
        maxConcurrent = 2, // Process 2 datasets at a time to avoid overwhelming F-UJI
        prefix = '',
        dryRun = false
    } = options;
    
    console.log(`🚀 Starting batch FAIR score processing...`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🔧 Max concurrent: ${maxConcurrent}`);
    console.log(`🧪 Dry run: ${dryRun}`);
    
    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No scores will be saved');
    }
    
    // Find datasets without scores
    const datasets = await findDatasetsWithoutScores(bucketName, prefix);
    
    if (datasets.length === 0) {
        console.log('🎉 All datasets already have FAIR scores!');
        return;
    }
    
    if (dryRun) {
        console.log('\n📋 Datasets that would be processed:');
        datasets.forEach((dataset, index) => {
            console.log(`${index + 1}. ${dataset.prefix} (${dataset.files.length} files, ${(dataset.totalSize / 1024 / 1024).toFixed(1)} MB)`);
        });
        return;
    }
    
    // Process datasets in batches
    const results = {
        total: datasets.length,
        processed: 0,
        successful: 0,
        failed: 0,
        fujiCount: 0,
        localCount: 0
    };
    
    console.log(`\n🔄 Processing ${datasets.length} datasets...`);
    
    for (let i = 0; i < datasets.length; i += maxConcurrent) {
        const batch = datasets.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(dataset => processDataset(bucketName, dataset));
        
        const batchResults = await Promise.all(batchPromises);
        
        // Update statistics
        batchResults.forEach(result => {
            results.processed++;
            if (result.success) {
                results.successful++;
                if (result.method.includes('F-UJI')) {
                    results.fujiCount++;
                } else {
                    results.localCount++;
                }
            } else {
                results.failed++;
            }
        });
        
        // Progress report
        const progress = Math.round((results.processed / results.total) * 100);
        console.log(`\n📊 Progress: ${results.processed}/${results.total} (${progress}%)`);
        console.log(`✅ Successful: ${results.successful}, ❌ Failed: ${results.failed}`);
        console.log(`🔍 F-UJI: ${results.fujiCount}, 🏠 Local: ${results.localCount}`);
        
        // Small delay between batches to be respectful to APIs
        if (i + maxConcurrent < datasets.length) {
            console.log('⏳ Batch delay...');
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }
    }
    
    // Final report
    console.log('\n🎉 Batch processing complete!');
    console.log(`📊 Final Results:`);
    console.log(`   Total datasets: ${results.total}`);
    console.log(`   Successfully processed: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   F-UJI assessments: ${results.fujiCount}`);
    console.log(`   Local assessments: ${results.localCount}`);
    
    if (results.failed > 0) {
        console.log(`\n⚠️  ${results.failed} datasets failed processing. Check logs above for details.`);
    }
}

// Export for Lambda usage
module.exports = {
    findDatasetsWithoutScores,
    processDataset,
    batchProcessDatasets
};

// If run directly, process datasets
if (require.main === module) {
    const bucketName = process.env.STORAGE_BUCKET || 'your-bucket-name';
    const dryRun = process.argv.includes('--dry-run');
    const maxConcurrent = process.argv.includes('--fast') ? 5 : 2;
    
    batchProcessDatasets(bucketName, { dryRun, maxConcurrent })
        .then(() => {
            console.log('✅ Batch processing completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Batch processing failed:', error);
            process.exit(1);
        });
}
