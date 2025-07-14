require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand,
  ListObjectsV2Command 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Verify required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize S3 client - will use AWS CLI credentials automatically
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// List files in S3 bucket
app.get('/api/files', async (req, res) => {
  try {
    const { prefix = '' } = req.query;
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix
    });
    
    const response = await s3Client.send(command);
    const files = response.Contents || [];
    
    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(files.map(async (file) => {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.Key
      });
      const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      
      return {
        name: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        url
      };
    }));
    
    res.json(filesWithUrls);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get upload URL
app.post('/api/upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }

    const key = `uploads/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    
    res.json({
      uploadUrl,
      key,
      expiresIn: 600
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`S3 bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`AWS region: ${process.env.AWS_REGION}`);
});
