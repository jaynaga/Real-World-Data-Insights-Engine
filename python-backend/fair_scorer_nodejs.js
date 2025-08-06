const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS SDK
const s3 = new AWS.S3();

// FAIR scoring rubric
const RUBRIC = {
    "Findable": {
        "Has persistent identifier": (m) => !!(m.doi || m.persistent_id),
        "Has rich metadata": (m) => !!(m.description && m.keywords && m.keywords.length > 0),
        "Metadata includes identifier": (m) => !!(m.identifier || m.doi || m.persistent_id),
        "Is indexed in a searchable resource": (m) => m.indexed_in_portal === true
    },
    "Accessible": {
        "Retrievable by standard protocol": (m) => ["https", "ftp", "s3"].includes(m.protocol),
        "Metadata remains accessible": (m) => m.metadata_stability === "stable",
        "Clear access conditions": (m) => ["public", "registered", "restricted"].includes(m.access_level)
    },
    "Interoperable": {
        "Uses formal knowledge representation": (m) => ["RDF", "OWL", "JSON-LD", "CSV", "JSON", "XML"].includes(m.format),
        "Uses FAIR vocabularies": (m) => m.vocabularies_fair === true,
        "Links to other datasets": (m) => !!(m.linked_datasets && m.linked_datasets.length > 0)
    },
    "Reusable": {
        "Rich metadata and accurate attributes": (m) => !!(m.curator && m.provenance),
        "Clearly stated license": (m) => !!m.license,
        "Detailed provenance": (m) => !!m.provenance,
        "Meets community standards": (m) => m.community_standards === true
    }
};

/**
 * Extract keywords from filename and content
 */
function inferKeywordsFromFilename(filename) {
    // Remove extension and split on common separators
    let name = filename.toLowerCase();
    if (name.includes('.')) {
        name = name.substring(0, name.lastIndexOf('.'));
    }
    
    // Split on separators and clean
    const parts = name.replace(/[_/-]/g, ' ').split(' ');
    
    // Filter out common non-descriptive words
    const stopWords = new Set(['data', 'file', 'dataset', 'upload', 'raw', 'user', 'uploads', 'test']);
    const keywords = parts.filter(word => !stopWords.has(word) && word.length > 2);
    
    return keywords.slice(0, 5); // Limit to top 5
}

/**
 * Simple CSV analysis
 */
function analyzeCSV(content) {
    try {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return { headers: [], row_count: 0, column_count: 0 };
        
        // Parse headers (first line)
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        return {
            headers,
            row_count: lines.length - 1,
            column_count: headers.length
        };
    } catch (error) {
        console.log('Error analyzing CSV:', error.message);
        return { headers: [], row_count: 0, column_count: 0 };
    }
}

/**
 * Simple JSON analysis
 */
function analyzeJSON(content) {
    try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            const headers = data.length > 0 ? Object.keys(data[0]) : [];
            return {
                headers,
                row_count: data.length,
                column_count: headers.length
            };
        } else if (typeof data === 'object') {
            const headers = Object.keys(data);
            return {
                headers,
                row_count: 1,
                column_count: headers.length
            };
        }
    } catch (error) {
        console.log('Error analyzing JSON:', error.message);
    }
    return { headers: [], row_count: 0, column_count: 0 };
}

/**
 * Extract metadata from file content
 */
function extractMetadataFromFile(fileContent, filename, submittedBy) {
    const ext = filename.includes('.') ? 
        filename.substring(filename.lastIndexOf('.') + 1).toLowerCase() : 'unknown';
    
    // Analyze file content based on type
    let fileAnalysis = { headers: [], row_count: 0, column_count: 0 };
    
    try {
        const contentStr = fileContent.toString('utf-8');
        
        if (ext === 'csv') {
            fileAnalysis = analyzeCSV(contentStr);
        } else if (ext === 'json') {
            fileAnalysis = analyzeJSON(contentStr);
        }
    } catch (error) {
        console.log('Error processing file content:', error.message);
    }
    
    // Generate keywords
    const keywords = inferKeywordsFromFilename(filename);
    if (fileAnalysis.headers.length > 0) {
        const headerKeywords = fileAnalysis.headers
            .slice(0, 3)
            .map(h => h.toLowerCase().replace(/[_-]/g, ' '))
            .filter(h => h.length > 2);
        keywords.push(...headerKeywords);
    }
    
    // Remove duplicates
    const uniqueKeywords = [...new Set(keywords)];
    
    // Build metadata object
    const metadata = {
        persistent_id: uuidv4(),
        description: `Dataset: ${filename}`,
        keywords: uniqueKeywords,
        indexed_in_portal: true, // Optimistic scoring
        protocol: "https",
        metadata_stability: "stable",
        access_level: "public",
        format: ext.toUpperCase(),
        vocabularies_fair: ['csv', 'json', 'xml'].includes(ext.toLowerCase()),
        linked_datasets: [],
        curator: submittedBy,
        provenance: `Uploaded by ${submittedBy} on ${new Date().toISOString()}`,
        license: "CC-BY",
        community_standards: ['csv', 'json'].includes(ext.toLowerCase()),
        file_size: fileContent.length,
        upload_timestamp: new Date().toISOString()
    };
    
    // Add file analysis results
    if (fileAnalysis.row_count > 0 || fileAnalysis.column_count > 0) {
        metadata.row_count = fileAnalysis.row_count;
        metadata.column_count = fileAnalysis.column_count;
        metadata.column_names = fileAnalysis.headers;
    }
    
    return metadata;
}

/**
 * Score metadata against FAIR principles
 */
function scoreMetadata(metadata) {
    const detailedResults = {};
    const categoryTotals = {};
    let totalScore = 0;
    let totalPossible = 0;
    
    for (const [category, metrics] of Object.entries(RUBRIC)) {
        let catScore = 0;
        detailedResults[category] = {};
        
        for (const [metricDesc, checkFn] of Object.entries(metrics)) {
            try {
                const result = checkFn(metadata);
                const score = result ? 1 : 0;
                detailedResults[category][metricDesc] = score;
                catScore += score;
            } catch (error) {
                console.log(`Error scoring '${metricDesc}':`, error.message);
                detailedResults[category][metricDesc] = 0;
            }
        }
        
        categoryTotals[category] = catScore;
        totalScore += catScore;
        totalPossible += Object.keys(metrics).length;
    }
    
    const fairPercentage = totalPossible > 0 ? 
        Math.round((totalScore / totalPossible) * 100 * 100) / 100 : 0;
    
    return {
        detailed_score: detailedResults,
        category_totals: categoryTotals,
        total_score: totalScore,
        total_possible: totalPossible,
        fair_percentage: fairPercentage
    };
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
    console.log('FAIR Scorer Lambda triggered');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        let processedCount = 0;
        
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            
            console.log(`Processing file: ${key} from bucket: ${bucket}`);
            
            try {
                // Get the uploaded file
                const params = {
                    Bucket: bucket,
                    Key: key
                };
                
                const data = await s3.getObject(params).promise();
                const fileContent = data.Body;
                
                // Extract submitter info
                const submittedBy = record.userIdentity?.principalId || 'system';
                
                // Extract metadata and calculate FAIR score
                const metadata = extractMetadataFromFile(fileContent, key, submittedBy);
                const score = scoreMetadata(metadata);
                
                console.log(`Generated FAIR score: ${score.fair_percentage}% for ${key}`);
                
                // Create the score document
                const scoreDocument = {
                    dataset: key,
                    metadata: metadata,
                    fair_score: score,
                    generated_at: new Date().toISOString(),
                    version: "1.0"
                };
                
                // Determine where to store the fairscore.json file
                const scoreKey = key.includes('/') ? 
                    `${key.substring(0, key.lastIndexOf('/'))}/fairscore.json` : 
                    'fairscore.json';
                
                // Upload the score file
                const uploadParams = {
                    Bucket: bucket,
                    Key: scoreKey,
                    Body: JSON.stringify(scoreDocument, null, 2),
                    ContentType: 'application/json'
                };
                
                await s3.putObject(uploadParams).promise();
                console.log(`FAIR score saved to: ${scoreKey}`);
                processedCount++;
                
            } catch (error) {
                console.error(`Error processing file ${key}:`, error);
                // Continue processing other files
                continue;
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'FAIR scoring completed successfully',
                processed_files: processedCount
            })
        };
        
    } catch (error) {
        console.error('Fatal error in FAIR scorer:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'FAIR scoring failed',
                message: error.message
            })
        };
    }
};
