
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async function (event) {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  
  try {
    // Get bucket and key from the event
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;
    console.log(`Processing file - Bucket: ${bucket}, Key: ${key}`);

    // Only process files in the user-uploads directory
    if (!key.startsWith('user-uploads/')) {
      console.log('File not in user-uploads directory, skipping processing');
      return;
    }

    // Get file metadata
    const headData = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    const metadata = headData.Metadata || {};
    const contentType = headData.ContentType;
    
    // Validate file type
    const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(contentType)) {
      console.error(`Invalid file type: ${contentType}`);
      return;
    }

    // Create metadata object
    const processingMetadata = {
      ...metadata,
      processedAt: new Date().toISOString(),
      status: 'validated',
      originalKey: key
    };

    // Move file to processed directory
    const newKey = key.replace('user-uploads/', 'processed/');
    await s3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: newKey,
      Metadata: processingMetadata,
      MetadataDirective: 'REPLACE'
    }).promise();

    // Delete the original file
    await s3.deleteObject({
      Bucket: bucket,
      Key: key
    }).promise();

    console.log(`Successfully processed file: ${key} -> ${newKey}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File processed successfully',
        newKey: newKey
      })
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};