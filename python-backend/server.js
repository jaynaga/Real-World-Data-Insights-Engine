require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand,
  ListObjectsV2Command 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cors = require('cors');

const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const app = express();
app.use(cors());
app.use(express.json());

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const DYNAMO_TABLE = process.env.DYNAMO_TABLE_NAME || 'NotebookJobs';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
// Async notebook job creation endpoint
app.post('/api/notebook/async-generate', async (req, res) => {
  try {
    const { projectId, goal, files } = req.body;
    if (!projectId || !goal || !files) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const jobId = uuidv4();
    // Create job in DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: DYNAMO_TABLE,
      Item: {
        jobId: { S: jobId },
        status: { S: 'pending' },
        createdAt: { S: new Date().toISOString() },
        projectId: { S: projectId },
        goal: { S: goal },
        files: { S: JSON.stringify(files) }
      }
    }));
    // Send job to SQS for processing
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({ jobId, projectId, goal, files })
    }));
    res.json({ jobId });
  } catch (error) {
    console.error('Error creating async notebook job:', error);
    res.status(500).json({ error: 'Failed to create notebook job' });
  }
});

// Async notebook job status endpoint
app.get('/api/notebook/job-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await dynamoClient.send(new GetItemCommand({
      TableName: DYNAMO_TABLE,
      Key: { jobId: { S: jobId } }
    }));
    if (!result.Item) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const status = result.Item.status.S;
    const response = {
      jobId,
      status,
      createdAt: result.Item.createdAt.S,
      projectId: result.Item.projectId.S,
      goal: result.Item.goal.S,
      files: JSON.parse(result.Item.files.S)
    };
    if (result.Item.resultUrl) {
      response.resultUrl = result.Item.resultUrl.S;
    }
    if (result.Item.notebookKey) {
      response.notebookKey = result.Item.notebookKey.S;
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching notebook job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// List files in bucket
app.get('/api/s3/files', async (req, res) => {
  try {
    const { prefix = '' } = req.query;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });
    
    const response = await s3Client.send(command);
    const files = response.Contents || [];
    
    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(files.map(async (file) => {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file.Key
      });
      const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // 1 hour expiry
      
      return {
        ...file,
        signedUrl: url
      };
    }));
    
    res.json(filesWithUrls);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get upload URL
app.post('/api/s3/upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    const key = `uploads/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10 minutes expiry
    
    res.json({
      uploadUrl: signedUrl,
      key: key
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Kaggle API Configuration
const KAGGLE_API_BASE = 'https://www.kaggle.com/api/v1';
const KAGGLE_USERNAME = process.env.KAGGLE_USERNAME;
const KAGGLE_KEY = process.env.KAGGLE_KEY;

// Keywords to identify psychiatric/mental health datasets
const PSYCHIATRIC_KEYWORDS = [
  'psychiatric', 'mental health', 'depression', 'anxiety', 'bipolar', 'schizophrenia',
  'ptsd', 'adhd', 'autism', 'psychological', 'therapy', 'counseling', 'suicide',
  'mental illness', 'behavioral health', 'mood disorder', 'panic disorder',
  'eating disorder', 'addiction', 'substance abuse', 'psychotherapy', 'psychiatry',
  'wellbeing', 'wellness', 'stress', 'trauma', 'cognitive', 'emotional health'
];

// Create axios instance for Kaggle API
const kaggleApi = axios.create({
  baseURL: KAGGLE_API_BASE,
  auth: {
    username: KAGGLE_USERNAME,
    password: KAGGLE_KEY
  },
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'RWDE-Platform/1.0'
  },
  timeout: 30000
});

// Helper function to check if a dataset is psychiatric-related
const isPsychiatricDataset = (dataset) => {
  const searchableText = [
    dataset.title || '',
    dataset.subtitle || '',
    dataset.description || '',
    ...(dataset.tags?.map(tag => tag.name) || [])
  ].join(' ').toLowerCase();
  
  return PSYCHIATRIC_KEYWORDS.some(keyword => 
    searchableText.includes(keyword.toLowerCase())
  );
};

// Kaggle API Proxy Endpoints
app.get('/api/kaggle/check-access', async (req, res) => {
  try {
    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
      return res.json({ 
        hasAccess: false, 
        message: 'Kaggle credentials not configured' 
      });
    }

    const response = await kaggleApi.get('/datasets/list', {
      params: { pageSize: 1 }
    });
    
    res.json({ 
      hasAccess: true, 
      message: 'Kaggle API access verified' 
    });
  } catch (error) {
    console.error('Kaggle access check failed:', error.message);
    res.json({ 
      hasAccess: false, 
      message: `Kaggle API error: ${error.message}` 
    });
  }
});

app.get('/api/kaggle/psychiatric-datasets', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
      return res.status(401).json({ 
        error: 'Kaggle API credentials not configured' 
      });
    }

    // Create search query combining psychiatric keywords
    const searchQuery = PSYCHIATRIC_KEYWORDS.slice(0, 8).join(' OR ');
    
    console.log('Searching Kaggle for psychiatric datasets...');
    
    const response = await kaggleApi.get('/datasets/list', {
      params: {
        search: searchQuery,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sortBy: 'relevance',
        group: 'public',
        filetype: 'csv,json,tsv',
        license: 'cc,cc0,mit,apache,other',
        minSize: 1000,
        maxSize: 104857600
      }
    });

    // Filter results to ensure they are actually psychiatric-related
    const filteredDatasets = response.data.datasets?.filter(dataset => 
      isPsychiatricDataset(dataset)
    ) || [];

    console.log(`Found ${filteredDatasets.length} psychiatric datasets`);

    res.json({
      datasets: filteredDatasets,
      totalCount: filteredDatasets.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      hasMore: response.data.hasMore && filteredDatasets.length === parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error fetching Kaggle datasets:', error);
    res.status(500).json({ 
      error: `Failed to fetch datasets: ${error.message}` 
    });
  }
});

app.get('/api/kaggle/dataset/:owner/:dataset', async (req, res) => {
  try {
    const { owner, dataset } = req.params;
    
    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
      return res.status(401).json({ 
        error: 'Kaggle API credentials not configured' 
      });
    }

    const response = await kaggleApi.get(`/datasets/view/${owner}/${dataset}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Kaggle dataset details:', error);
    res.status(500).json({ 
      error: `Failed to fetch dataset details: ${error.message}` 
    });
  }
});

app.get('/api/kaggle/dataset/:owner/:dataset/files', async (req, res) => {
  try {
    const { owner, dataset } = req.params;
    
    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
      return res.status(401).json({ 
        error: 'Kaggle API credentials not configured' 
      });
    }

    const response = await kaggleApi.get(`/datasets/list/${owner}/${dataset}/files`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Kaggle dataset files:', error);
    res.status(500).json({ 
      error: `Failed to fetch dataset files: ${error.message}` 
    });
  }
});

app.get('/api/kaggle/dataset/:owner/:dataset/download/:filename', async (req, res) => {
  try {
    const { owner, dataset, filename } = req.params;
    
    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
      return res.status(401).json({ 
        error: 'Kaggle API credentials not configured' 
      });
    }

    const response = await kaggleApi.get(
      `/datasets/download/${owner}/${dataset}/${filename}`,
      { responseType: 'stream' }
    );
    
    // Forward the file stream
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading Kaggle file:', error);
    res.status(500).json({ 
      error: `Failed to download file: ${error.message}` 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
