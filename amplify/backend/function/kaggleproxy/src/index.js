const axios = require('axios');

// Kaggle API configuration
const KAGGLE_API_BASE = 'https://www.kaggle.com/api/v1';

// Psychiatric dataset keywords for filtering
const PSYCHIATRIC_KEYWORDS = [
  'mental health', 'depression', 'anxiety', 'psychiatric', 'psychology',
  'bipolar', 'schizophrenia', 'ptsd', 'stress', 'mood disorder',
  'cognitive', 'behavioral', 'therapy', 'counseling', 'wellbeing',
  'psychological', 'mental illness', 'emotional', 'psychotherapy',
  'neuropsychology', 'psychiatry', 'mental wellness', 'brain health',
  'suicide', 'self harm', 'addiction', 'substance abuse'
];

// Create axios instance with Kaggle credentials
const createKaggleClient = () => {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;
  
  if (!username || !key) {
    throw new Error('Kaggle API credentials not configured');
  }

  return axios.create({
    baseURL: KAGGLE_API_BASE,
    auth: {
      username: username,
      password: key
    },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'RWDE-Platform/1.0'
    },
    timeout: 30000
  });
};

// Check if a dataset is psychiatric-related
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

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, path, queryStringParameters = {} } = event;
    
    const kaggleClient = createKaggleClient();

    // Route: GET /kaggle-check
    if (path.includes('kaggle-check') && httpMethod === 'GET') {
      try {
        await kaggleClient.get('/datasets/list', { params: { pageSize: 1 } });
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ hasAccess: true, message: 'Kaggle API access confirmed' })
        };
      } catch (error) {
        console.error('Kaggle access check failed:', error.response?.data || error.message);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ hasAccess: false, error: error.message })
        };
      }
    }

    // Route: GET /kaggle-datasets
    if (path.includes('kaggle-datasets') && httpMethod === 'GET') {
      const page = parseInt(queryStringParameters.page) || 1;
      const pageSize = parseInt(queryStringParameters.pageSize) || 20;
      
      // Search for datasets with psychiatric keywords
      const searchQuery = PSYCHIATRIC_KEYWORDS.slice(0, 8).join(' OR ');
      
      const response = await kaggleClient.get('/datasets/list', {
        params: {
          search: searchQuery,
          page,
          pageSize,
          sortBy: 'relevance',
          group: 'public',
          filetype: 'csv,json,tsv',
          license: 'cc,cc0,mit,apache,other',
          minSize: 1000,
          maxSize: 104857600
        }
      });

      // Filter results to ensure they are psychiatric-related
      const filteredDatasets = response.data.datasets?.filter(isPsychiatricDataset) || [];

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          datasets: filteredDatasets,
          totalCount: filteredDatasets.length,
          page,
          pageSize,
          hasMore: response.data.hasMore && filteredDatasets.length === pageSize
        })
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Route not found', path, method: httpMethod })
    };

  } catch (error) {
    console.error('Lambda function error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: error.response?.data || null
      })
    };
  }
};
