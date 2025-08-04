/**
 * Test script for F-UJI integration in Lambda function
 * Run this to test the F-UJI API from your Lambda environment
 */

const https = require('https');

/**
 * Test F-UJI API call
 */
async function testFUJI() {
    const objectIdentifier = 'https://doi.org/10.1594/PANGAEA.906092';
    
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
            timeout: 30000
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
                        console.log('✅ F-UJI API Test Successful!');
                        console.log('Score Summary:');
                        console.log('- Findable:', result.summary?.score_findable);
                        console.log('- Accessible:', result.summary?.score_accessible);
                        console.log('- Interoperable:', result.summary?.score_interoperable);
                        console.log('- Reusable:', result.summary?.score_reusable);
                        resolve(result);
                    } else {
                        console.log('❌ F-UJI API Error:', res.statusCode, data);
                        reject(new Error(`F-UJI API returned status ${res.statusCode}: ${data}`));
                    }
                } catch (error) {
                    console.log('❌ Parse Error:', error.message);
                    reject(new Error(`Failed to parse F-UJI response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            reject(new Error(`F-UJI API request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            console.log('❌ Request Timeout');
            reject(new Error('F-UJI API request timed out'));
        });

        req.write(postData);
        req.end();
    });
}

// Run the test
console.log('🧪 Testing F-UJI API integration from Lambda environment...');
testFUJI()
    .then(() => {
        console.log('🎉 Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.log('💥 Test failed:', error.message);
        console.log('This is expected if F-UJI requires authentication or has rate limits.');
        console.log('The Lambda function will gracefully fallback to local scoring.');
        process.exit(1);
    });
