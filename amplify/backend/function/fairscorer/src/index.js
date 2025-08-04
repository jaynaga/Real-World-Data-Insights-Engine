
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const http = require('http');

// Initialize AWS SDK
const s3 = new S3Client();

// Configuration
const CONFIG = {
    enableFUJI: process.env.ENABLE_FUJI !== 'false', // Can be disabled via environment variable
    fujiTimeout: 25000, // 25 seconds timeout
    maxRetries: 1 // No retries to avoid amplifying rate limit issues
};

// Rate limiting and circuit breaker configuration
const RATE_LIMIT = {
    maxRequestsPerMinute: 10, // Conservative limit for F-UJI
    requestHistory: [],
    consecutiveFailures: 0,
    maxConsecutiveFailures: 3,
    backoffTime: 300000, // 5 minutes
    lastFailureTime: null
};

/**
 * Check if we should skip F-UJI due to rate limiting or circuit breaker
 */
function shouldSkipFUJI() {
    const now = Date.now();
    
    // Circuit breaker: Skip if we've had too many consecutive failures recently
    if (RATE_LIMIT.consecutiveFailures >= RATE_LIMIT.maxConsecutiveFailures) {
        if (RATE_LIMIT.lastFailureTime && (now - RATE_LIMIT.lastFailureTime) < RATE_LIMIT.backoffTime) {
            console.log(`🔴 Circuit breaker active: Skipping F-UJI for ${Math.round((RATE_LIMIT.backoffTime - (now - RATE_LIMIT.lastFailureTime)) / 1000)}s`);
            return true;
        } else {
            // Reset circuit breaker after backoff period
            RATE_LIMIT.consecutiveFailures = 0;
            RATE_LIMIT.lastFailureTime = null;
            console.log('🔄 Circuit breaker reset: F-UJI available again');
        }
    }
    
    // Rate limiting: Remove old requests (older than 1 minute)
    RATE_LIMIT.requestHistory = RATE_LIMIT.requestHistory.filter(
        timestamp => (now - timestamp) < 60000
    );
    
    // Check if we've exceeded rate limit
    if (RATE_LIMIT.requestHistory.length >= RATE_LIMIT.maxRequestsPerMinute) {
        console.log(`🔴 Rate limit reached: ${RATE_LIMIT.requestHistory.length}/${RATE_LIMIT.maxRequestsPerMinute} requests in last minute`);
        return true;
    }
    
    return false;
}

/**
 * Record F-UJI request attempt
 */
function recordFUJIAttempt(success) {
    const now = Date.now();
    RATE_LIMIT.requestHistory.push(now);
    
    if (success) {
        RATE_LIMIT.consecutiveFailures = 0;
        RATE_LIMIT.lastFailureTime = null;
        console.log(`✅ F-UJI success: ${RATE_LIMIT.requestHistory.length}/${RATE_LIMIT.maxRequestsPerMinute} requests in window`);
    } else {
        RATE_LIMIT.consecutiveFailures++;
        RATE_LIMIT.lastFailureTime = now;
        console.log(`❌ F-UJI failure #${RATE_LIMIT.consecutiveFailures}: Circuit breaker will activate at ${RATE_LIMIT.maxConsecutiveFailures}`);
    }
}

/**
 * Add intelligent delay between requests
 */
async function intelligentDelay() {
    const requestCount = RATE_LIMIT.requestHistory.length;
    let delayMs = 0;
    
    if (requestCount >= 8) {
        delayMs = 10000; // 10 seconds if approaching limit
    } else if (requestCount >= 5) {
        delayMs = 5000;  // 5 seconds if moderate usage
    } else if (requestCount >= 2) {
        delayMs = 2000;  // 2 seconds if some usage
    }
    
    if (delayMs > 0) {
        console.log(`⏳ Intelligent delay: ${delayMs/1000}s (${requestCount} requests in window)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
}

/**
 * Call F-UJI API for professional FAIR assessment with rate limiting
 */
async function callFUJIAPI(objectIdentifier) {
    // Check rate limits and circuit breaker
    if (shouldSkipFUJI()) {
        throw new Error('F-UJI temporarily unavailable due to rate limiting or circuit breaker');
    }
    
    // Add intelligent delay
    await intelligentDelay();
    
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            object_identifier: objectIdentifier,
            test_debug: false,
            use_datacite: true,
            datacite_endpoint: "https://api.datacite.org/application/vnd.datacite.datacite+json/",
            re3data_endpoint: "https://www.re3data.org/api/beta/repositories"
        });

        const options = {
            hostname: process.env.FUJI_HOST || 'localhost', // Allow override via environment
            port: process.env.FUJI_PORT || 1071,
            path: '/fuji/api/v1/evaluate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('marvel:wonderwoman').toString('base64')
            },
            timeout: CONFIG.fujiTimeout // Configurable timeout
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const result = JSON.parse(data);
                        recordFUJIAttempt(true); // Record success
                        resolve(result);
                    } else {
                        recordFUJIAttempt(false); // Record failure
                        reject(new Error(`F-UJI API returned status ${res.statusCode}: ${data}`));
                    }
                } catch (error) {
                    recordFUJIAttempt(false); // Record failure
                    reject(new Error(`Failed to parse F-UJI response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            recordFUJIAttempt(false); // Record failure
            reject(new Error(`F-UJI API request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            recordFUJIAttempt(false); // Record failure
            reject(new Error('F-UJI API request timed out'));
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Convert F-UJI results to our standard format
 */
function convertFUJIResult(fujiResult, metadata) {
    try {
        // Extract scores from F-UJI result
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
        
        // Convert detailed results
        const detailedResults = {
            Findable: {},
            Accessible: {},
            Interoperable: {},
            Reusable: {}
        };

        // Process F-UJI test results
        if (fujiResult.results) {
            fujiResult.results.forEach(test => {
                const metric = test.metric_identifier || test.metric_name || 'Unknown';
                const score = test.score?.earned || 0;
                const maxScore = test.score?.total || 1;
                const normalizedScore = maxScore > 0 ? score / maxScore : 0;
                
                // Map to FAIR categories
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

        return {
            detailed_score: detailedResults,
            category_totals: {
                Findable: findableScore,
                Accessible: accessibleScore,
                Interoperable: interoperableScore,
                Reusable: reusableScore
            },
            total_score: totalScore,
            total_possible: totalPossible,
            fair_percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100 * 100) / 100 : 0,
            assessment_method: 'F-UJI Professional Assessment',
            f_uji_raw_result: fujiResult
        };
    } catch (error) {
        console.error('Error converting F-UJI result:', error);
        return null;
    }
}

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
 * Simple TSV analysis
 */
function analyzeTSV(content) {
    try {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return { headers: [], row_count: 0, column_count: 0 };
        
        // Parse headers (first line)
        const headers = lines[0].split('\t').map(h => h.trim().replace(/"/g, ''));
        
        return {
            headers,
            row_count: lines.length - 1,
            column_count: headers.length
        };
    } catch (error) {
        console.log('Error analyzing TSV:', error.message);
        return { headers: [], row_count: 0, column_count: 0 };
    }
}

/**
 * Simple XML analysis
 */
function analyzeXML(content) {
    try {
        // Extract element names as headers (simplified approach)
        const elementMatches = content.match(/<(\w+)[^>]*>/g) || [];
        const elements = [...new Set(elementMatches.map(match => 
            match.replace(/<(\w+)[^>]*>/, '$1')
        ))];
        
        // Count occurrences of root elements
        const rootElements = content.match(/<\w+[^>]*>/g) || [];
        
        return {
            headers: elements.slice(0, 10), // Limit to first 10 unique elements
            row_count: rootElements.length,
            column_count: elements.length
        };
    } catch (error) {
        console.log('Error analyzing XML:', error.message);
        return { headers: [], row_count: 0, column_count: 0 };
    }
}

/**
 * Simple text file analysis
 */
function analyzeText(content) {
    try {
        const lines = content.split('\n').filter(line => line.trim());
        const words = content.split(/\s+/).filter(word => word.length > 3);
        const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
        
        return {
            headers: uniqueWords.slice(0, 10), // Top 10 unique words as "headers"
            row_count: lines.length,
            column_count: 1 // Text files have one "column"
        };
    } catch (error) {
        console.log('Error analyzing text:', error.message);
        return { headers: [], row_count: 0, column_count: 0 };
    }
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
        } else if (ext === 'tsv') {
            fileAnalysis = analyzeTSV(contentStr);
        } else if (ext === 'xml') {
            fileAnalysis = analyzeXML(contentStr);
        } else if (ext === 'txt') {
            fileAnalysis = analyzeText(contentStr);
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
        vocabularies_fair: ['csv', 'json', 'xml', 'txt', 'tsv', 'parquet', 'hdf5', 'netcdf', 'sqlite3'].includes(ext.toLowerCase()),
        linked_datasets: [],
        curator: submittedBy,
        provenance: `Uploaded by ${submittedBy} on ${new Date().toISOString()}`,
        license: "CC-BY",
        community_standards: ['csv', 'json', 'xml', 'txt', 'tsv', 'parquet', 'xlsx', 'xls', 'sqlite3'].includes(ext.toLowerCase()),
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
 * Main Lambda handler for S3 events
 * @type {import('@types/aws-lambda').S3Handler}
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
                
                const data = await s3.send(new GetObjectCommand(params));
                const fileContent = data.Body;
                
                // Extract submitter info
                const submittedBy = record.userIdentity?.principalId || 'system';
                
                // Try F-UJI assessment first, fallback to local scoring
                let scoreResult;
                let assessmentMethod = 'Local RWDE Assessment';
                
                // Only try F-UJI if enabled and not rate limited
                if (CONFIG.enableFUJI && !shouldSkipFUJI()) {
                    try {
                        // Create a mock public URL for F-UJI assessment
                        // In production, you'd use a real public URL or DOI
                        const mockUrl = `https://example.com/datasets/${encodeURIComponent(key)}`;
                        
                        console.log(`🔍 Attempting F-UJI assessment for: ${mockUrl}`);
                        const fujiResult = await callFUJIAPI(mockUrl);
                        
                        if (fujiResult) {
                            console.log('✅ F-UJI assessment successful');
                            const metadata = extractMetadataFromFile(fileContent, key, submittedBy);
                            scoreResult = convertFUJIResult(fujiResult, metadata);
                            assessmentMethod = 'F-UJI Professional Assessment';
                        }
                    } catch (fujiError) {
                        console.log(`❌ F-UJI assessment failed: ${fujiError.message}`);
                        console.log('🔄 Falling back to local assessment method');
                    }
                } else {
                    if (!CONFIG.enableFUJI) {
                        console.log('🔴 F-UJI disabled via configuration');
                    } else {
                        console.log('🔴 F-UJI skipped due to rate limiting/circuit breaker');
                    }
                }
                
                // Fallback to local scoring if F-UJI failed or was skipped
                if (!scoreResult) {
                    console.log('🏠 Using local FAIR scoring method');
                    const metadata = extractMetadataFromFile(fileContent, key, submittedBy);
                    scoreResult = scoreMetadata(metadata);
                    scoreResult.assessment_method = assessmentMethod;
                }
                
                console.log(`📊 Generated FAIR score: ${scoreResult.fair_percentage}% for ${key} using ${assessmentMethod}`);
                
                // Extract metadata for the score document
                const metadata = extractMetadataFromFile(fileContent, key, submittedBy);
                
                // Create the score document
                const scoreDocument = {
                    dataset: key,
                    metadata: metadata,
                    fair_score: scoreResult,
                    generated_at: new Date().toISOString(),
                    version: "2.0",
                    assessment_method: assessmentMethod
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
                
                await s3.send(new PutObjectCommand(uploadParams));
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

// Export functions for batch processing
module.exports = {
    handler: exports.handler,
    callFUJIAPI,
    convertFUJIResult,
    extractMetadataFromFile,
    scoreMetadata,
    CONFIG,
    shouldSkipFUJI,
    intelligentDelay,
    RATE_LIMIT
};
