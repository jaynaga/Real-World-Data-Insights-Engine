#!/bin/bash

# Emergency script to disable F-UJI integration if needed
echo "🚨 Emergency F-UJI Disable Script"
echo ""

read -p "Are you sure you want to disable F-UJI integration? (y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "🔴 Disabling F-UJI integration..."
    
    # Set environment variable to disable F-UJI
    amplify env pull --yes
    amplify function update fairscorer
    
    echo "📝 Add this environment variable in the Lambda console:"
    echo "   Key: ENABLE_FUJI"
    echo "   Value: false"
    echo ""
    echo "Or update amplify/backend/function/fairscorer/fairscorer-cloudformation-template.json"
    echo "to include the environment variable."
    echo ""
    echo "✅ F-UJI will be disabled on next deployment."
    echo "🔄 The system will automatically fallback to local scoring."
else
    echo "❌ Operation cancelled."
fi
