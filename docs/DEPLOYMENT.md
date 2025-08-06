# Deployment Guide

## 🚀 Production Deployment

The RWDE platform is deployed using AWS Amplify with CloudFront distribution.

### Current Production Environment
- **Frontend**: `https://dksl9b55tgml3.cloudfront.net`
- **API Gateway**: `https://nz0a9n72i0.execute-api.us-east-1.amazonaws.com/rwde`
- **Cognito User Pool**: `us-east-1_du9uYmqHL`
- **S3 Bucket**: `rwde-dev-datasets37fb9-rwde`

### Prerequisites
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS credentials
aws configure
amplify configure
```

### Deployment Commands

#### Deploy Frontend Changes
```bash
# Build and deploy frontend
yarn build
amplify publish

# Or deploy hosting only
amplify publish --yes
```

#### Deploy Backend Changes
```bash
# Deploy backend resources (Lambda, API, etc.)
amplify push

# Deploy specific category
amplify push function
amplify push api
```

#### Full Deployment
```bash
# Deploy everything (backend + frontend)
amplify publish
```

### Environment Management

#### Check Current Status
```bash
amplify status
```

#### Switch Environments
```bash
amplify env list
amplify env checkout production
amplify env checkout development
```

#### Add New Environment
```bash
amplify env add
amplify push
```

## 🔧 CI/CD Pipeline (Optional Setup)

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy RWDE Platform

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'yarn'
    
    - name: Install dependencies
      run: yarn install
    
    - name: Run tests
      run: yarn test --ci --coverage
    
    - name: Build application
      run: yarn build
    
    - name: Deploy to Amplify
      run: |
        npm install -g @aws-amplify/cli
        amplify publish --yes
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_REGION: us-east-1
```

### Manual Deployment Steps

#### 1. Pre-deployment Checks
```bash
# Run tests
yarn test

# Check build
yarn build

# Verify environment
amplify status
```

#### 2. Backend Deployment
```bash
# Push backend changes
amplify push

# Verify API endpoints
curl https://your-api-gateway-url/health
```

#### 3. Frontend Deployment
```bash
# Build and deploy
amplify publish

# Verify CloudFront distribution
curl https://your-cloudfront-url
```

## 🔍 Monitoring & Troubleshooting

### AWS Console Access
- **Amplify Console**: Monitor deployments and builds
- **CloudWatch**: View logs and metrics
- **S3 Console**: Manage file storage
- **Cognito Console**: User management

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules yarn.lock
yarn install
yarn build
```

#### Backend Sync Issues
```bash
# Pull latest backend config
amplify pull --appId d19vw9p5r2op8w --envName rwde

# Reset local backend
amplify init
```

#### Permission Issues
```bash
# Reconfigure AWS credentials
aws configure
amplify configure
```

### Performance Optimization

#### CloudFront Settings
- **Caching**: Configure proper cache headers
- **Compression**: Enable Gzip/Brotli compression
- **Origin**: Optimize S3 bucket settings

#### Build Optimization
```bash
# Analyze bundle size
npx webpack-bundle-analyzer build/static/js/*.js

# Optimize build
yarn build --analyze
```

## 📊 Monitoring Setup

### CloudWatch Metrics
- API Gateway request counts
- Lambda function invocations
- S3 storage usage
- Cognito user activities

### Alerting
Set up CloudWatch alarms for:
- High error rates
- Slow response times
- Storage quota limits
- Failed authentications

## 🔐 Security Considerations

### Production Security Checklist
- [ ] Enable CloudFront HTTPS only
- [ ] Configure CORS properly
- [ ] Set up WAF rules if needed
- [ ] Review IAM permissions
- [ ] Enable VPC if required
- [ ] Configure backup policies

### Environment Variables
Production environment variables are managed through:
1. **Amplify Console**: Frontend environment variables
2. **Lambda Console**: Backend function environment variables
3. **AWS Systems Manager**: Secure parameter store

## 🚨 Rollback Procedures

### Frontend Rollback
```bash
# Revert to previous deployment
amplify publish --invalidate-cloudfront

# Manual rollback via console
# Go to Amplify Console → App → Deployments → Redeploy previous version
```

### Backend Rollback
```bash
# Revert backend changes
git checkout <previous-commit>
amplify push

# Or revert specific resources via AWS Console
```

This deployment guide ensures reliable and secure production deployments of the RWDE platform.
