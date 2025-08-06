# RWDE Component Architecture

## 🏗️ Component Hierarchy

### App Structure
```
App.js
├── AuthProvider
├── SettingsProvider
├── SessionProvider
└── Layout
    ├── Navbar
    └── Routes
        ├── Login
        ├── Dashboard
        ├── Explore
        ├── Projects
        └── Settings
```

## 📁 Component Categories

### 1. **Layout Components** (`src/components/`)
- **`Layout.js`** - Main app wrapper with navbar and footer
- **`Navbar.js`** - Top navigation with user menu
- **`ProtectedRoute.js`** - Route wrapper requiring authentication
- **`Footer.js`** - App footer (if exists)

### 2. **Auth Components** (`src/pages/` & `src/context/`)
- **`Login.js`** - Authentication page with sign up/in
- **`AuthContext.js`** - Authentication state management
- **`OAuthCallback.js`** - OAuth redirect handler

### 3. **Dashboard Components** (`src/sections/Dashboard/`)
- **`index.js`** - Main dashboard page
- **`widgets/StatCard.js`** - Dashboard statistics cards
- **`widgets/ActivityFeed.js`** - Recent activity feed
- **`DashboardLayout.js`** - Dashboard-specific layout

### 4. **Data Exploration** (`src/sections/Explore/`)
- **`index.js`** - Dataset explorer main page
- **`ExploreSidebar.js`** - Filters and search sidebar
- **`DatasetCard.js`** - Individual dataset display
- **`DatasetPreview.js`** - Dataset content preview

### 5. **Project Management** (`src/sections/Projects/`)
- **`index.js`** - Projects listing page
- **`SingleProject.js`** - Individual project view
- **`ProjectDetails.js`** - Project information display
- **`ProjectVisualization*.js`** - Various visualization components
- **`CreateProject.js`** - Project creation form

### 6. **Data Visualization** (`src/components/`)
- **`DataViewer.js`** - Tabular data display
- **`DataVisualizer/`** - Chart creation components
- **`ChartBuilder.js`** - Interactive chart builder
- **`ApexChartWrapper.js`** - ApexCharts integration

### 7. **AI Components** (`src/components/`)
- **`AIDatasetAssistant.jsx`** - AI-powered dataset recommendations
- **`AINotebookGenerator.jsx`** - Jupyter notebook generation
- **`AIDatasetAssistant.jsx`** - Bedrock AI integration

### 8. **Utility Components** (`src/components/`)
- **`LoadingSpinner.js`** - Loading states
- **`ErrorBoundary.js`** - Error handling
- **`Modal.js`** - Reusable modal component
- **`Tooltip.js`** - Help tooltips

## 🔄 Data Flow Patterns

### 1. **Authentication Flow**
```javascript
Login.js → AuthContext → ProtectedRoute → App Components
```

### 2. **Data Management Flow**
```javascript
Upload.js → S3 Storage → Lambda Processing → DataViewer.js
```

### 3. **AI Assistance Flow**
```javascript
AIDatasetAssistant → BedrockAI Service → Recommendations → Project Integration
```

### 4. **Project Management Flow**
```javascript
CreateProject → ProjectService → SingleProject → Visualization Components
```

## 🎨 Styling Architecture

### Design System
```css
/* Base Styles */
src/styles/
├── index.css        # Global styles & Tailwind imports
├── tokens.css       # Design tokens & component classes
└── login-animations.css # Login page animations
```

### Component Styling Pattern
```javascript
// Consistent class structure
const Component = () => (
  <div className="card">           {/* Design token */}
    <h1 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
      Title
    </h1>
  </div>
);
```

### Dark Mode Implementation
```javascript
// Theme toggle in SettingsContext
const { theme, toggleTheme } = useSettings();

// CSS classes respond to 'dark' class on html element
<div className="bg-white dark:bg-gray-800">
```

## 🔌 Service Integration

### AWS Services
```javascript
// Authentication
src/context/AuthContext.js → AWS Cognito

// File Storage  
src/utils/storageUtils.js → AWS S3

// AI Features
src/services/bedrockAIService.js → AWS Bedrock

// API Calls
src/services/ → AWS API Gateway + Lambda
```

### External Services
```javascript
// Charts
import ApexCharts from 'apexcharts'
import * as echarts from 'echarts'

// Icons
import { Fi*, Fa*, Hi*, Md* } from 'react-icons/*'

// Drag & Drop
import { DndContext, useDraggable } from '@dnd-kit/core'
```

## 📱 Responsive Design

### Breakpoint Strategy
```css
/* Mobile-first approach */
.component {
  /* Mobile styles */
  
  @screen md {
    /* Tablet styles */
  }
  
  @screen lg {
    /* Desktop styles */
  }
}
```

### Component Responsiveness
```javascript
// Responsive grid example
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Responsive navigation
<nav className="hidden md:flex lg:space-x-8">
  {/* Desktop nav */}
</nav>
```

## 🧪 Testing Strategy

### Component Testing Structure
```
src/
├── components/
│   ├── Component.js
│   └── __tests__/
│       └── Component.test.js
├── pages/
│   ├── Page.js
│   └── __tests__/
│       └── Page.test.js
```

### Testing Patterns
```javascript
// Context testing
import { renderWithContext } from '../utils/testUtils';

// Component testing
import { render, screen } from '@testing-library/react';

// Integration testing
import { renderWithRouter } from '../utils/routerTestUtils';
```

## 🚀 Performance Optimizations

### Code Splitting
```javascript
// Route-level splitting
const Dashboard = lazy(() => import('./sections/Dashboard'));
const Projects = lazy(() => import('./sections/Projects'));

// Component-level splitting for large components
const DataVisualizer = lazy(() => import('./components/DataVisualizer'));
```

### Memoization
```javascript
// Expensive computations
const processedData = useMemo(() => {
  return heavyDataProcessing(rawData);
}, [rawData]);

// Component memoization
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});
```

### Virtual Scrolling
```javascript
// Large dataset handling
const VirtualizedTable = ({ data }) => {
  // Implementation with react-window or similar
};
```

## 🔧 Development Patterns

### Custom Hooks
```javascript
// Common patterns extracted to hooks
export const useAPI = (endpoint) => { /* ... */ };
export const useLocalStorage = (key) => { /* ... */ };
export const useDebounce = (value, delay) => { /* ... */ };
```

### Error Boundaries
```javascript
// Component-level error handling
<ErrorBoundary>
  <DataVisualizationComponent />
</ErrorBoundary>
```

### Context Usage
```javascript
// Multiple contexts for separation of concerns
const { user, login, logout } = useAuth();
const { theme, settings } = useSettings();
const { projects, createProject } = useProjects();
```

This architecture supports scalable development while maintaining clean separation of concerns and optimal performance.
