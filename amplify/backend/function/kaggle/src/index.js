
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

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
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
    const { httpMethod, path, queryStringParameters } = event;
    
    console.log('Request details:', { httpMethod, path, queryStringParameters });
    
    // Parse query parameters from path if not provided (API Gateway workaround)
    let parsedParams = queryStringParameters || {};
    if (!queryStringParameters && path.includes('?')) {
      const [, queryString] = path.split('?');
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        parsedParams[key] = decodeURIComponent(value || '');
      });
    }
    
    const action = parsedParams.action;
    console.log('Parsed action:', action);
    
    const kaggleClient = createKaggleClient();

    // Route: Check Kaggle access
    if (action === 'check' && httpMethod === 'GET') {
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

    // Route: Get psychiatric datasets
    if (action === 'datasets' && httpMethod === 'GET') {
      const page = parseInt(parsedParams.page) || 1;
      const pageSize = parseInt(parsedParams.pageSize) || 20;
      
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

    // Default route - return function info for unknown actions
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Kaggle Proxy Function - Missing or Invalid Action',
        availableActions: ['check', 'datasets'],
        usage: 'Use ?action=check or ?action=datasets',
        received: { action, path, method: httpMethod, queryParams: parsedParams }
      })
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
