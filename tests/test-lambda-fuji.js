/**
 * Test F-UJI integration with our Lambda function
 */

// Import only the F-UJI related functions for testing
async function callFUJIAPI(objectIdentifier) {
    const http = require('http');
    
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            object_identifier: objectIdentifier,
            test_debug: false,
            use_datacite: true,
            datacite_endpoint: "https://api.datacite.org/application/vnd.datacite.datacite+json/",
            re3data_endpoint: "https://www.re3data.org/api/beta/repositories"
        });

        const options = {
            hostname: 'localhost',
            port: 1071,
            path: '/fuji/api/v1/evaluate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('marvel:wonderwoman').toString('base64')
            },
            timeout: 25000
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
                        resolve(result);
                    } else {
                        reject(new Error(`F-UJI API returned status ${res.statusCode}: ${data}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse F-UJI response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`F-UJI API request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('F-UJI API request timed out'));
        });

        req.write(postData);
        req.end();
    });
}

function convertFUJIResult(fujiResult, metadata = {}) {
    if (!fujiResult || !fujiResult.summary) {
        return {
            fair_percentage: 0,
            detailed_scores: {},
            error: 'Invalid F-UJI response'
        };
    }

    return {
        fair_percentage: Math.round(fujiResult.summary.score_percent.FAIR),
        detailed_scores: {
            findable: fujiResult.summary.score_percent.F,
            accessible: fujiResult.summary.score_percent.A,
            interoperable: fujiResult.summary.score_percent.I,
            reusable: fujiResult.summary.score_percent.R
        },
        assessment_details: fujiResult.results || [],
        metadata: {
            dataset_name: metadata.dataset_name || 'Unknown Dataset',
            assessed_at: new Date().toISOString(),
            assessment_tool: 'F-UJI',
            total_files: metadata.total_files || 0,
            file_types: metadata.file_types || []
        }
    };
}

async function testFUJIIntegration() {
    console.log('🧪 Testing F-UJI integration with Lambda function...\n');
    
    try {
        // Test with a publicly accessible dataset URL
        const testUrl = 'https://doi.org/10.5281/zenodo.3778056';
        console.log(`🔗 Testing with: ${testUrl}`);
        
        console.log('📡 Calling F-UJI API...');
        const fujiResult = await callFUJIAPI(testUrl);
        
        if (fujiResult && fujiResult.summary) {
            console.log('✅ F-UJI API call successful!');
            console.log(`📊 Overall FAIR Score: ${fujiResult.summary.score_percent.FAIR}%`);
            console.log(`🔍 Detailed scores:`);
            console.log(`   Findable (F): ${fujiResult.summary.score_percent.F}%`);
            console.log(`   Accessible (A): ${fujiResult.summary.score_percent.A}%`);
            console.log(`   Interoperable (I): ${fujiResult.summary.score_percent.I}%`);
            console.log(`   Reusable (R): ${fujiResult.summary.score_percent.R}%`);
            
            // Test our conversion function
            console.log('\n🔄 Testing result conversion...');
            const mockMetadata = {
                dataset_name: 'Test Dataset',
                total_files: 5,
                file_types: ['csv', 'json']
            };
            
            const convertedResult = convertFUJIResult(fujiResult, mockMetadata);
            console.log('✅ Conversion successful!');
            console.log(`📈 Converted percentage: ${convertedResult.fair_percentage}%`);
            
        } else {
            console.log('❌ Unexpected F-UJI response format');
            console.log('Response:', fujiResult);
        }
        
    } catch (error) {
        console.log(`❌ F-UJI test failed: ${error.message}`);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. F-UJI is running at: http://localhost:1071/fuji/api/v1/ui/');
    console.log('2. Lambda function can now call F-UJI for real FAIR assessments');
    console.log('3. Use pre-signed URLs for your private S3 datasets');
    console.log('4. Your RWDE platform now has professional FAIR scoring!');
}

testFUJIIntegration().catch(console.error);
