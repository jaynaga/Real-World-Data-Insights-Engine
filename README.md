# 🏥 RWDE - Healthcare Data Commons Platform

[![Production Status](https://img.shields.io/badge/Status-Live%20Production-green.svg)](https://dksl9b55tgml3.cloudfront.net)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify%20Serverless-orange.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![Code Quality](https://img.shields.io/badge/ESLint-Clean-brightgreen.svg)]()
[![Try the Live Demo](https://img.shields.io/badge/Try%20the%20Live%20Demo-Click%20Here-7c3aed?style=for-the-badge)](https://dksl9b55tgml3.cloudfront.net)

A production-ready healthcare data commons platform enabling researchers to upload, analyze, and visualize datasets with AI-powered assistance.

## ⚡ Quick Start

```bash
# Clone and setup
git clone https://github.com/jaynaga/RWDE.git
cd rwde-clean
yarn install

# Start development server
yarn start
# → Opens http://localhost:3000
```

## 🌐 Live Application
- **Production**: https://dksl9b55tgml3.cloudfront.net
- **API**: https://nz0a9n72i0.execute-api.us-east-1.amazonaws.com/rwde
- **Status**: ✅ Fully operational

## 🏗️ Architecture Overview

### Core Features
- 🔐 **Authentication**: AWS Cognito with email verification
- 📊 **Data Upload**: Secure S3 integration with processing pipeline
- 🤖 **AI Assistant**: Bedrock-powered dataset recommendations
- 📈 **Visualization**: Interactive charts with drag-drop interface
- 📓 **AI Notebooks**: Automated Jupyter notebook generation
- 🎨 **Modern UI**: Tailwind CSS 4 with dark/light theme support

### Tech Stack
```
Frontend: React 18 + Tailwind CSS 4 + Material-UI 5
Backend:  AWS Amplify (Cognito, S3, Lambda, API Gateway)
AI:       AWS Bedrock (Claude) + Jupyter notebook generation
Charts:   ApexCharts + ECharts with @dnd-kit drag-drop
```

## 📚 Documentation

**For Manager Handoff**: Read [`HANDOFF.md`](./HANDOFF.md) for complete handoff guide

### Comprehensive Guides
- 📖 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - Component architecture
- 🔧 [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) - Developer workflow  
- 🚀 [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) - Production deployment
- 📡 [`docs/API.md`](./docs/API.md) - Complete API reference
- ☁️ [`docs/CLOUD_STORAGE_SETUP.md`](./docs/CLOUD_STORAGE_SETUP.md) - AWS configuration

## �️ Repository Structure

```
rwde-clean/
├── 📖 docs/                    # Comprehensive documentation
├── 📱 src/                     # React application source  
│   ├── components/             # Reusable UI components
│   ├── context/               # React context providers
│   ├── pages/                 # Top-level route components
│   ├── sections/              # Feature-specific layouts
│   ├── services/              # API integration layer
│   └── utils/                 # Utility functions & config
├── ⚡ amplify/                 # AWS Amplify backend config
├── 🔧 scripts/                 # Development & testing scripts
├── 📦 public/                  # Static assets
├── 🧪 examples/                # Jupyter notebook examples
└── 📋 HANDOFF.md               # Complete manager handoff guide
```

## ✅ Production Status

### Current State
- **Live Application**: ✅ Fully operational 
- **Authentication**: ✅ Cognito integration working
- **File Upload**: ✅ S3 pipeline functional
- **AI Features**: ✅ Bedrock integration active
- **Data Visualization**: ✅ Interactive charts working
- **Code Quality**: ✅ ESLint clean, no build errors
- **Documentation**: ✅ Comprehensive guides complete
- **AWS Resources**: ✅ All services configured and running

### Commands
```bash
# Development
yarn start              # Start React dev server
yarn build              # Build for production
yarn test               # Run tests

# AWS Amplify
amplify status          # Check deployment status  
amplify console         # Open Amplify console
amplify push            # Deploy backend changes
amplify pull            # Pull latest backend config
```

## 🚀 Getting Started (New Team Member)

1. **Read Documentation**: Start with [`HANDOFF.md`](./HANDOFF.md)
2. **Setup Environment**: Follow quick start commands above
3. **AWS Access**: Ensure AWS console access to region `us-east-1`
4. **Test Features**: Browse live app and test major functionality
5. **Review Architecture**: Study the docs/ folder for deep understanding

---

**Ready for immediate handoff and continued development!** 🎉
- 🚀 **Deployment Guide** - Production deployment steps

This codebase represents a **professional, production-ready healthcare research platform** ready for enterprise use and continued development.
