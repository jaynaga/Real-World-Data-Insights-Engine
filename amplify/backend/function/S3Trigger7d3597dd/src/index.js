
const { S3Client, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const s3 = new S3Client();
const lambda = new LambdaClient();

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
    const headData = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const metadata = headData.Metadata || {};
    const contentType = headData.ContentType;
    
    // Validate file type - expanded to support more dataset formats
    const validTypes = [
      // Spreadsheet and structured data
      'text/csv', 
      'application/json', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/tab-separated-values',
      'application/x-sqlite3',
      
      // Text and document formats
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/xml',
      'application/xml',
      
      // Data interchange formats
      'application/x-parquet',
      'application/x-hdf5',
      'application/x-netcdf',
      
      // Image formats (for image datasets)
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/gif',
      
      // Audio formats (for audio datasets)
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/flac',
      
      // Video formats (for video datasets)
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/webm',
      
      // Compressed archives
      'application/zip',
      'application/x-tar',
      'application/gzip',
      'application/x-7z-compressed'
    ];
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
    await s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: newKey,
      Metadata: processingMetadata,
      MetadataDirective: 'REPLACE'
    }));

    // Invoke FAIR scorer Lambda function
    try {
      const fairScorerPayload = {
        Records: [{
          s3: {
            bucket: { name: bucket },
            object: { key: newKey }
          },
          userIdentity: {
            principalId: metadata.submittedBy || 'system'
          }
        }]
      };

      console.log('Invoking FAIR scorer for:', newKey);
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.FAIR_SCORER_FUNCTION_NAME || 'fairscorer',
        InvocationType: 'Event', // Asynchronous invocation
        Payload: JSON.stringify(fairScorerPayload)
      }));

      console.log('FAIR scorer invoked successfully');
    } catch (fairScorerError) {
      console.error('Error invoking FAIR scorer:', fairScorerError);
      // Don't fail the main process if FAIR scoring fails
    }

    // Delete the original file
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));

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