const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client();

exports.handler = async (event) => {
    console.log('Get FAIR Score Lambda triggered with event:', JSON.stringify(event, null, 2));
    
    try {
        // Parse the request
        const body = event.body ? JSON.parse(event.body) : {};
        const { datasetKey } = body;
        
        if (!datasetKey) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'datasetKey is required'
                })
            };
        }
        
        // Extract folder path from the dataset key
        const folderPath = datasetKey.includes('/') ? 
            datasetKey.substring(0, datasetKey.lastIndexOf('/')) : '';
        
        // Construct the fair score file path
        const fairScoreKey = folderPath ? `${folderPath}/fairscore.json` : 'fairscore.json';
        
        console.log(`Attempting to fetch FAIR score from: ${fairScoreKey}`);
        
        // Get the bucket from environment or event
        const bucket = process.env.STORAGE_BUCKET || 'rwde-dev-datasets37fb9-rwde';
        
        try {
            // Try to get the fair score file from S3
            const response = await s3.send(new GetObjectCommand({
                Bucket: bucket,
                Key: fairScoreKey
            }));
            
            if (response.Body) {
                const scoreText = await response.Body.transformToString();
                const scoreData = JSON.parse(scoreText);
                
                console.log('FAIR score found:', scoreData);
                
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS'
                    },
                    body: JSON.stringify({
                        success: true,
                        fairScore: scoreData
                    })
                };
            }
        } catch (fetchError) {
            console.log('No FAIR score found:', fetchError.message);
            
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'FAIR score not found',
                    message: 'No FAIR score exists for this dataset. Try generating one first.'
                })
            };
        }
        
    } catch (error) {
        console.error('Error in get FAIR score Lambda:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
