#!/bin/bash

# Batch process existing datasets to generate FAIR scores
echo "📊 Batch FAIR Score Generator for Existing Datasets"
echo ""

# Check if we're in the right directory
if [ ! -f "amplify/backend/function/fairscorer/src/index.js" ]; then
    echo "❌ Error: Must be run from the amplify-frontend directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo "🔍 This script will:"
echo "   • Scan S3 for datasets without FAIR scores"
echo "   • Generate scores using F-UJI (with rate limiting) or local assessment"
echo "   • Process datasets with intelligent delays"
echo "   • Provide progress reports"
echo ""

# Options
DRY_RUN=false
FAST_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --fast)
            FAST_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run    Show what would be processed without actually doing it"
            echo "  --fast       Process 5 datasets concurrently (instead of 2)"
            echo "  --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Process all datasets"
            echo "  $0 --dry-run          # See what would be processed"
            echo "  $0 --fast             # Faster processing"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ "$DRY_RUN" = true ]; then
    echo "🧪 DRY RUN MODE - No changes will be made"
    echo ""
fi

if [ "$FAST_MODE" = true ]; then
    echo "🚀 FAST MODE - Processing 5 datasets concurrently"
    echo ""
fi

# Get bucket name from amplify backend config
BUCKET_NAME=""
if [ -f "src/aws-exports.js" ]; then
    BUCKET_NAME=$(grep -o 'aws_user_files_s3_bucket.*:.*"[^"]*"' src/aws-exports.js | cut -d'"' -f2)
fi

if [ -z "$BUCKET_NAME" ]; then
    echo "⚠️  Could not auto-detect S3 bucket name"
    read -p "Enter your S3 bucket name: " BUCKET_NAME
fi

echo "📦 Target bucket: $BUCKET_NAME"
echo ""

read -p "Proceed with batch processing? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting batch processing..."
echo ""

# Run the batch processor
cd amplify/backend/function/fairscorer/src

if [ "$DRY_RUN" = true ]; then
    STORAGE_BUCKET="$BUCKET_NAME" node batch-processor.js --dry-run
elif [ "$FAST_MODE" = true ]; then
    STORAGE_BUCKET="$BUCKET_NAME" node batch-processor.js --fast
else
    STORAGE_BUCKET="$BUCKET_NAME" node batch-processor.js
fi

exit_code=$?

cd - > /dev/null

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Batch processing completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   • Check your datasets in the UI - they should now show FAIR scores"
    echo "   • Review CloudWatch logs for detailed processing information"
    echo "   • New uploads will continue to be processed automatically"
else
    echo ""
    echo "❌ Batch processing failed (exit code: $exit_code)"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check your AWS credentials and permissions"
    echo "   • Verify the S3 bucket name is correct"
    echo "   • Check CloudWatch logs for detailed error information"
fi
