/**
 * Test F-UJI integration with a publicly accessible dataset
 */

const https = require('https');

// F-UJI API call function (copied from main function)
async function callFUJIAPI(objectIdentifier) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            object_identifier: objectIdentifier,
            test_debug: false,
            metadata_service_endpoint: null,
            metadata_service_type: null,
            use_datacite: true,
            datacite_endpoint: "https://api.datacite.org/application/vnd.datacite.datacite+json/",
            re3data_endpoint: "https://www.re3data.org/api/beta/repositories"
        });

        const options = {
            hostname: 'www.f-uji.net',
            port: 443,
            path: '/fuji/api/v1/evaluate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('demo:demo').toString('base64')
            },
            timeout: 25000
        };

        const req = https.request(options, (res) => {
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
                } catch (parseError) {
                    reject(new Error(`Failed to parse F-UJI response: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`F-UJI request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('F-UJI API request timed out'));
        });

        req.write(postData);
        req.end();
    });
}

// Test with different types of URLs
async function testFUJI() {
    console.log('🧪 Testing F-UJI API integration...\n');
    
    const testUrls = [
        {
            name: 'DOI-based dataset',
            url: 'https://doi.org/10.5281/zenodo.3778056',
            description: 'A real research dataset with proper metadata'
        },
        {
            name: 'Direct dataset URL',
            url: 'https://zenodo.org/record/3778056',
            description: 'Direct link to a published dataset'
        }
    ];
    
    for (const test of testUrls) {
        console.log(`\n📋 Testing: ${test.name}`);
        console.log(`📄 Description: ${test.description}`);
        console.log(`🔗 URL: ${test.url}`);
        console.log('⏳ Calling F-UJI API...\n');
        
        try {
            const result = await callFUJIAPI(test.url);
            
            if (result && result.summary) {
                console.log('✅ F-UJI Assessment Successful!');
                console.log(`📊 Overall Score: ${result.summary.score_percent || 'N/A'}%`);
                console.log(`🔍 Details: ${result.summary.score_earned || 'N/A'}/${result.summary.score_total || 'N/A'} points`);
                
                if (result.results && result.results.length > 0) {
                    console.log('\n📋 FAIR Criteria Results:');
                    result.results.forEach(criterion => {
                        const status = criterion.test_passed ? '✅' : '❌';
                        console.log(`   ${status} ${criterion.metric_identifier}: ${criterion.metric_name}`);
                    });
                }
            } else {
                console.log('⚠️  F-UJI returned unexpected format:', result);
            }
            
        } catch (error) {
            console.log(`❌ F-UJI Error: ${error.message}`);
        }
        
        console.log('\n' + '='.repeat(80));
    }
    
    console.log('\n🎯 Summary:');
    console.log('• F-UJI works best with published research datasets that have DOIs');
    console.log('• It requires proper metadata (schema.org, datacite, etc.)');
    console.log('• For private S3 datasets, you can use pre-signed URLs + metadata files');
    console.log('• The secure approach I implemented should work for your datasets');
}

// Run the test
testFUJI().catch(console.error);
