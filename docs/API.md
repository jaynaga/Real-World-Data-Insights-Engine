# RWDE API Reference

## 🌐 Base URLs

### Production
- **API Gateway**: `https://nz0a9n72i0.execute-api.us-east-1.amazonaws.com/rwde`
- **Region**: `us-east-1`

### Authentication
All API endpoints require AWS Cognito authentication via AWS_IAM authorization.

```javascript
// Request headers
{
  "Authorization": "AWS4-HMAC-SHA256 Credential=...",
  "X-Amz-Date": "20250806T120000Z",
  "Content-Type": "application/json"
}
```

## 📋 Endpoint Documentation

### 1. AI Notebook Generation

#### Generate Notebook
```http
POST /generate-notebook
Content-Type: application/json
Authorization: AWS_IAM

{
  "researchGoal": "Study depression factors in elderly patients",
  "selectedDatasets": [
    {
      "id": "dataset-123",
      "name": "Elderly Patient Records",
      "columns": ["age", "diagnosis", "treatment"],
      "rowCount": 1500
    }
  ],
  "analysisType": "statistical",
  "outputFormat": "jupyter"
}
```

**Response:**
```json
{
  "success": true,
  "notebookUrl": "https://s3.amazonaws.com/bucket/notebooks/notebook-456.ipynb",
  "notebookContent": {
    "cells": [...],
    "metadata": {...}
  },
  "executionTime": 2.3
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid dataset format",
  "code": "DATASET_ERROR",
  "details": "Dataset must contain numeric columns for statistical analysis"
}
```

### 2. Dataset Management

#### List User Datasets
```http
GET /datasets
Authorization: AWS_IAM
```

**Response:**
```json
{
  "datasets": [
    {
      "id": "dataset-123",
      "name": "Patient Survey Data",
      "source": "User Dataset",
      "uploadDate": "2025-08-06T10:30:00Z",
      "fileCount": 3,
      "size": 2048576,
      "status": "processed",
      "columns": ["age", "gender", "score"],
      "rowCount": 1200
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

#### Upload Dataset Metadata
```http
POST /datasets/metadata
Content-Type: application/json
Authorization: AWS_IAM

{
  "name": "Depression Survey 2024",
  "description": "Annual depression screening survey data",
  "tags": ["depression", "survey", "2024"],
  "dataType": "Survey Data",
  "isPublic": false,
  "s3Key": "user-uploads/user123/survey-2024.csv"
}
```

### 3. Project Management

#### Create Project
```http
POST /projects
Content-Type: application/json
Authorization: AWS_IAM

{
  "title": "Depression Social Factors Study",
  "description": "Investigating social determinants of depression in urban populations",
  "datasets": ["dataset-123", "dataset-456"],
  "collaborators": ["user@example.com"],
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "project-789",
    "title": "Depression Social Factors Study",
    "createdAt": "2025-08-06T10:30:00Z",
    "owner": "user123",
    "status": "active"
  }
}
```

#### List Projects
```http
GET /projects?status=active&limit=20
Authorization: AWS_IAM
```

#### Get Project Details
```http
GET /projects/{projectId}
Authorization: AWS_IAM
```

#### Update Project
```http
PUT /projects/{projectId}
Content-Type: application/json
Authorization: AWS_IAM

{
  "title": "Updated Project Title",
  "description": "Updated description",
  "datasets": ["dataset-123", "dataset-456", "dataset-789"]
}
```

#### Delete Project
```http
DELETE /projects/{projectId}
Authorization: AWS_IAM
```

### 4. FUJI Integration (FAIR Assessment)

#### Assess Dataset Fairness
```http
POST /fuji/assess
Content-Type: application/json
Authorization: AWS_IAM

{
  "datasetId": "dataset-123",
  "metadataUrl": "https://s3.amazonaws.com/bucket/metadata.json",
  "assessmentType": "full"
}
```

**Response:**
```json
{
  "assessmentId": "fair-assessment-456",
  "scores": {
    "findable": 85,
    "accessible": 92,
    "interoperable": 78,
    "reusable": 88,
    "overall": 86
  },
  "recommendations": [
    "Add more descriptive keywords to metadata",
    "Include data usage license information"
  ],
  "completedAt": "2025-08-06T10:35:00Z"
}
```

### 5. Kaggle Integration

#### Search Kaggle Datasets
```http
GET /kaggle/search?query=healthcare&category=healthcare&limit=10
Authorization: AWS_IAM
```

**Response:**
```json
{
  "datasets": [
    {
      "id": "kaggle-dataset-123",
      "title": "Healthcare Provider Dataset",
      "author": "kaggle-user",
      "url": "https://www.kaggle.com/datasets/example",
      "description": "Comprehensive healthcare provider data",
      "size": "15.2 MB",
      "lastUpdated": "2025-07-15T00:00:00Z",
      "license": "CC0",
      "downloadCount": 1500
    }
  ]
}
```

#### Import Kaggle Dataset
```http
POST /kaggle/import
Content-Type: application/json
Authorization: AWS_IAM

{
  "kaggleDatasetId": "user/dataset-name",
  "projectId": "project-789"
}
```

## 🔧 SDK Integration

### JavaScript/React Integration

```javascript
import { API, Auth } from 'aws-amplify';

// Configure API
API.configure({
  endpoints: [
    {
      name: 'rwdeapi',
      endpoint: 'https://nz0a9n72i0.execute-api.us-east-1.amazonaws.com/rwde',
      region: 'us-east-1'
    }
  ]
});

// Generate notebook
const generateNotebook = async (researchGoal, datasets) => {
  try {
    const response = await API.post('rwdeapi', '/generate-notebook', {
      body: {
        researchGoal,
        selectedDatasets: datasets,
        analysisType: 'statistical',
        outputFormat: 'jupyter'
      }
    });
    return response;
  } catch (error) {
    console.error('Notebook generation error:', error);
    throw error;
  }
};

// List projects
const listProjects = async () => {
  try {
    const response = await API.get('rwdeapi', '/projects');
    return response.projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
};

// Create project
const createProject = async (projectData) => {
  try {
    const response = await API.post('rwdeapi', '/projects', {
      body: projectData
    });
    return response.project;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
};
```

### Python Integration

```python
import boto3
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

class RWDEClient:
    def __init__(self, region='us-east-1'):
        self.base_url = 'https://nz0a9n72i0.execute-api.us-east-1.amazonaws.com/rwde'
        self.session = boto3.Session()
        self.credentials = self.session.get_credentials()
        self.region = region
    
    def _make_request(self, method, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        request = AWSRequest(method=method, url=url, data=data)
        SigV4Auth(self.credentials, "execute-api", self.region).add_auth(request)
        
        prepared = request.prepare()
        response = requests.request(
            method=prepared.method,
            url=prepared.url,
            headers=prepared.headers,
            data=prepared.body
        )
        return response.json()
    
    def generate_notebook(self, research_goal, datasets):
        return self._make_request('POST', '/generate-notebook', {
            'researchGoal': research_goal,
            'selectedDatasets': datasets,
            'analysisType': 'statistical',
            'outputFormat': 'jupyter'
        })
    
    def list_projects(self):
        return self._make_request('GET', '/projects')
    
    def create_project(self, project_data):
        return self._make_request('POST', '/projects', project_data)

# Usage example
client = RWDEClient()
projects = client.list_projects()
print(f"Found {len(projects)} projects")
```

## 📊 Rate Limits

### Current Limits
- **AI Notebook Generation**: 10 requests per minute per user
- **Dataset Operations**: 100 requests per minute per user
- **Project Management**: 50 requests per minute per user
- **FUJI Assessment**: 5 requests per minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1691332800
```

## ❌ Error Codes

### Standard HTTP Status Codes
- **200**: Success
- **400**: Bad Request - Invalid input parameters
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error

### Custom Error Codes
```json
{
  "error": "DATASET_NOT_FOUND",
  "message": "The specified dataset could not be found",
  "code": 40401,
  "timestamp": "2025-08-06T10:30:00Z"
}
```

#### Error Code Reference
- **40001**: `INVALID_RESEARCH_GOAL` - Research goal format invalid
- **40002**: `DATASET_FORMAT_ERROR` - Dataset structure incompatible
- **40003**: `INSUFFICIENT_DATA` - Not enough data for analysis
- **40401**: `DATASET_NOT_FOUND` - Dataset ID doesn't exist
- **40402**: `PROJECT_NOT_FOUND` - Project ID doesn't exist
- **40901**: `NOTEBOOK_GENERATION_FAILED` - AI service unavailable
- **42901**: `RATE_LIMIT_EXCEEDED` - Too many requests

## 🔍 Testing

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.2.0",
  "timestamp": "2025-08-06T10:30:00Z",
  "services": {
    "database": "healthy",
    "ai": "healthy",
    "storage": "healthy"
  }
}
```

### API Testing Tools
```bash
# Using curl
curl -X GET "https://nz0a9n72i0.execute-api.us-east-1.amazonaws.com/rwde/health"

# Using Postman
# Import AWS signature authentication
# Set region to us-east-1
# Use Cognito credentials

# Using AWS CLI
aws apigateway test-invoke-method \
  --rest-api-id nz0a9n72i0 \
  --resource-id resource-id \
  --http-method GET \
  --path-with-query-string /health
```

This API reference provides comprehensive documentation for integrating with the RWDE platform services.
