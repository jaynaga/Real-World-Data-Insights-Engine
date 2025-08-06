#!/bin/bash

# Deploy updated FAIR scorer Lambda function with F-UJI integration
echo "🚀 Deploying FAIR scorer Lambda function with F-UJI integration..."

# Change to the amplify-frontend directory
cd "$(dirname "$0")"

# Check if amplify CLI is available
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Please install it first:"
    echo "npm install -g @aws-amplify/cli"
    exit 1
fi

# Deploy the backend function
echo "📦 Pushing Lambda function to AWS..."
amplify push function fairscorer --yes

if [ $? -eq 0 ]; then
    echo "✅ FAIR scorer Lambda function deployed successfully!"
    echo ""
    echo "🔧 New features:"
    echo "   • F-UJI Professional FAIR Assessment (primary)"
    echo "   • Local RWDE Assessment (fallback)"
    echo "   • Rate limiting: Max 10 F-UJI requests per minute"
    echo "   • Circuit breaker: Auto-disable after 3 failures"
    echo "   • Intelligent delays between requests"
    echo "   • Enhanced error handling and logging"
    echo "   • Version 2.0 score format"
    echo ""
    echo "🛡️ Protection features:"
    echo "   • Rate limit prevents API abuse"
    echo "   • Circuit breaker protects against outages"
    echo "   • Graceful fallback ensures platform reliability"
    echo "   • Can be disabled: Set ENABLE_FUJI=false in Lambda env"
    echo ""
    echo "🧪 To test:"
    echo "   1. Upload a new dataset to your S3 bucket"
    echo "   2. Check CloudWatch logs for 'F-UJI assessment successful' or 'local method'"
    echo "   3. Verify fairscore.json is created with assessment_method field"
    echo "   4. Monitor rate limiting logs in CloudWatch"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
