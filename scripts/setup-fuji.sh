#!/bin/bash

# Quick F-UJI Setup for RWDE Demo
# This script sets up F-UJI locally using Docker

echo "🚀 Setting up F-UJI for RWDE Demo..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "🐳 Starting F-UJI Docker container..."

# Pull and run F-UJI Docker container
docker run -d \
    --name fuji-rwde \
    -p 1071:1071 \
    ghcr.io/pangaea-data-publisher/fuji

# Wait a moment for the container to start
echo "⏳ Waiting for F-UJI to start..."
sleep 10

# Test if F-UJI is running
if curl -s http://localhost:1071/fuji/api/v1/ui/ > /dev/null; then
    echo "✅ F-UJI is running!"
    echo "🌐 Web UI: http://localhost:1071/fuji/api/v1/ui/"
    echo "📡 API: http://localhost:1071/fuji/api/v1/"
    echo ""
    echo "🎯 F-UJI is now ready for your RWDE demo!"
    echo ""
    echo "💡 To test F-UJI with a real dataset:"
    echo "   curl -X POST 'http://localhost:1071/fuji/api/v1/evaluate' \\"
    echo "        -H 'Content-Type: application/json' \\"
    echo "        -H 'Authorization: Basic ZGVtbzpkZW1v' \\"
    echo "        -d '{\"object_identifier\": \"https://doi.org/10.5281/zenodo.3778056\"}'"
    echo ""
    echo "🛠️  To stop F-UJI later: docker stop fuji-rwde"
    echo "🗑️  To remove F-UJI: docker rm fuji-rwde"
else
    echo "❌ F-UJI failed to start. Check Docker logs:"
    echo "   docker logs fuji-rwde"
fi
