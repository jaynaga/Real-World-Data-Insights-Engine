#!/bin/bash

# RWDE Development Setup Script
# This script sets up the development environment for the RWDE platform

set -e  # Exit on any error

echo "🚀 Setting up RWDE Development Environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "📦 Installing Yarn..."
    npm install -g yarn
fi

echo "✅ Yarn $(yarn -v) detected"

# Install dependencies
echo "📦 Installing project dependencies..."
yarn install

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Install it from https://aws.amazon.com/cli/"
    echo "This is required for Amplify backend integration."
else
    echo "✅ AWS CLI $(aws --version | cut -d'/' -f2 | cut -d' ' -f1) detected"
fi

# Check Amplify CLI
if ! command -v amplify &> /dev/null; then
    echo "📱 Installing Amplify CLI..."
    npm install -g @aws-amplify/cli
fi

echo "✅ Amplify CLI detected"

# Setup environment files
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Pull Amplify backend (if configured)
echo "🔄 Checking Amplify backend status..."
if amplify status &> /dev/null; then
    echo "✅ Amplify backend is configured"
else
    echo "⚠️  Amplify backend not configured. Run:"
    echo "   amplify pull --appId d19vw9p5r2op8w --envName rwde"
    echo "   (or set up new backend with: amplify init)"
fi

# Start development server
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  yarn start"
echo ""
echo "The app will run at http://localhost:3000"
echo ""
echo "For backend configuration:"
echo "  amplify status    # Check backend status"
echo "  amplify console   # Open AWS console"
echo "  amplify push      # Deploy backend changes"
echo ""
echo "Happy coding! 🚀"
