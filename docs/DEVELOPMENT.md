# RWDE Development Guide

## 🚀 Getting Started

### Prerequisites
```bash
# Required software
Node.js 18+ (recommended: use nvm)
Yarn package manager
Git version control
AWS CLI configured
Amplify CLI installed globally
```

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd rwde-clean

# Install dependencies
yarn install

# Configure Amplify (first time only)
amplify configure
amplify pull --appId d19vw9p5r2op8w --envName rwde

# Start development server
yarn start
```

## 🏗️ Project Structure Deep Dive

### Frontend Architecture
```
src/
├── App.js                 # Main application component
├── Router.js              # Route definitions
├── index.js               # Application entry point
├── components/            # Reusable UI components
│   ├── AIDatasetAssistant.jsx    # AI chat interface
│   ├── AINotebookGenerator.jsx   # Jupyter notebook generation
│   ├── DataViewer.js            # Tabular data display
│   ├── Layout.js                # Main layout wrapper
│   ├── Navbar.js                # Navigation bar
│   └── ProtectedRoute.js        # Auth-required routes
├── context/               # React context providers
│   ├── AuthContext.js           # Authentication state
│   ├── SettingsContext.js       # App settings
│   ├── SessionContext.js        # Session management
│   └── NotificationContext.js   # Toast notifications
├── pages/                 # Top-level route components
│   ├── Login.js                 # Authentication page
│   ├── Settings.js              # User settings
│   ├── Upload.js                # File upload interface
│   └── VideoTutorials.js        # Help content
├── sections/              # Feature-specific layouts
│   ├── Dashboard/               # Dashboard components
│   ├── Explore/                 # Data exploration
│   └── Projects/                # Project management
├── services/              # API integration
│   ├── bedrockAIService.js      # AWS Bedrock integration
│   ├── notebookGeneratorService.js  # Notebook generation
│   └── projectService.js       # Project CRUD operations
├── utils/                 # Utility functions
│   ├── amplifyConfig.js         # Amplify configuration
│   ├── chartUtils.js            # Chart helpers
│   └── storageUtils.js          # S3 operations
└── styles/                # Global styles
    ├── index.css                # Main CSS file
    ├── tokens.css               # Design tokens
    └── login-animations.css     # Login page styles
```

### Backend Architecture (AWS Amplify)
```
amplify/
├── backend/
│   ├── api/
│   │   └── rwdeapi/             # REST API configuration
│   ├── auth/
│   │   └── rwde37fb9rwde/       # Cognito configuration
│   ├── function/
│   │   ├── ainotebookgenerator/ # AI notebook Lambda
│   │   └── kaggle/              # Data integration Lambda
│   ├── hosting/
│   │   └── amplifyhosting/      # CloudFront hosting
│   └── storage/
│       └── rwdedevstorage/      # S3 storage configuration
└── cli.json                     # Amplify CLI configuration
```

## 🔧 Development Workflow

### Daily Development
```bash
# Start development environment
yarn start                 # Frontend (localhost:3000)

# Backend development
amplify mock              # Mock backend services locally
amplify status            # Check backend resource status

# Database operations (if using)
amplify console storage   # Open S3 console
amplify console auth      # Open Cognito console
```

### Making Changes

#### Frontend Changes
```bash
# Create new component
touch src/components/NewComponent.js

# Add to routing (if needed)
# Edit src/App.js or src/Router.js

# Test changes
yarn start
```

#### Backend Changes
```bash
# Modify Lambda function
# Edit amplify/backend/function/functionName/src/index.js

# Deploy backend changes
amplify push

# Test API changes
curl -X GET "https://api-endpoint/test"
```

### Code Style Guidelines

#### React Component Pattern
```javascript
// Preferred component structure
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ComponentName = ({ prop1, prop2 }) => {
  // State declarations
  const [localState, setLocalState] = useState(null);
  
  // Context usage
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Early returns
  if (!user) return <div>Loading...</div>;
  
  // Main render
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

#### Styling Conventions
```javascript
// Use design tokens from tokens.css
<div className="card">                    // ✅ Design token
<div className="bg-white dark:bg-gray-800"> // ✅ Theme-aware

// Consistent responsive patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Component-specific styles
<div className="dashboard-header">        // ✅ BEM-like naming
```

#### API Integration Pattern
```javascript
// Service layer pattern
// src/services/exampleService.js
const exampleService = {
  async getData() {
    try {
      const response = await fetch('/api/data');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// Component usage
const Component = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await exampleService.getData();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
};
```

## 🧪 Testing Strategy

### Component Testing
```javascript
// src/components/__tests__/Component.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
  
  test('handles user interaction', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    // Assert expected behavior
  });
});
```

### Integration Testing
```javascript
// Test with context providers
import { renderWithProviders } from '../utils/testUtils';

test('component with auth context', () => {
  renderWithProviders(<Component />, {
    authContext: { user: mockUser }
  });
});
```

### E2E Testing Setup
```bash
# Install Cypress (if needed)
yarn add --dev cypress

# Run tests
yarn cypress open
```

## 🔍 Debugging

### Development Tools
```javascript
// React Developer Tools
// Available in browser extensions

// Debug context values
const { user } = useAuth();
console.log('Current user:', user);

// Debug API calls
console.log('API Response:', response);

// Debug state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

### AWS Debugging
```bash
# Lambda function logs
aws logs tail /aws/lambda/function-name --follow

# API Gateway logs
aws logs tail API-Gateway-Execution-Logs --follow

# S3 access logs
aws s3api get-bucket-logging --bucket bucket-name
```

### Common Issues & Solutions

#### Authentication Issues
```javascript
// Check auth state
import { Auth } from 'aws-amplify';

Auth.currentAuthenticatedUser()
  .then(user => console.log('Current user:', user))
  .catch(err => console.log('Not authenticated:', err));
```

#### S3 Upload Issues
```javascript
// Debug S3 operations
import { Storage } from 'aws-amplify';

Storage.configure({
  AWSS3: {
    bucket: 'bucket-name',
    region: 'us-east-1',
    customPrefix: {
      public: '',
      protected: '',
      private: ''
    }
  }
});
```

#### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules yarn.lock .next build
yarn install
yarn build

# Check for TypeScript errors
yarn type-check

# Analyze bundle size
yarn build --analyze
```

## 🚀 Performance Best Practices

### Code Splitting
```javascript
// Route-based splitting
const LazyComponent = lazy(() => import('./LazyComponent'));

// Component wrapping with Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### State Management
```javascript
// Optimize re-renders with useMemo
const expensiveValue = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// Optimize callbacks with useCallback
const handleClick = useCallback(() => {
  onItemClick(item.id);
}, [item.id, onItemClick]);
```

### Bundle Optimization
```javascript
// Tree shaking - import only what you need
import { specific } from 'library';        // ✅
import * as entire from 'library';        // ❌

// Lazy load heavy dependencies
const Chart = lazy(() => import('heavy-chart-library'));
```

## 📚 Key Libraries & Tools

### Core Dependencies
- **React 18**: Main UI framework
- **React Router 6**: Client-side routing
- **AWS Amplify**: Backend integration
- **Tailwind CSS 4**: Utility-first styling

### UI Components
- **Material-UI 5**: Component library
- **React Icons**: Icon sets (Feather, FontAwesome, Heroicons)
- **Framer Motion**: Animations
- **ApexCharts**: Standard charts
- **ECharts**: Advanced visualizations

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **React Developer Tools**: Browser debugging
- **AWS CLI**: Backend management

This development guide ensures consistent coding practices and smooth collaboration for the RWDE platform.
