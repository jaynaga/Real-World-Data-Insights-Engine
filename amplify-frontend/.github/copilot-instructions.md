# RWDE Data Commons Platform - AI Coding Guidelines

## Architecture Overview

This is a React-based data commons platform for healthcare research data, built with AWS Amplify and serverless backend. The system follows a modular architecture with clear separation between frontend pages, reusable components, and backend services.

### Core Technologies
- **Frontend**: React 18 + Tailwind CSS 4 + React Router 6
- **Backend**: AWS Amplify (Cognito Auth, API Gateway, Lambda, S3)
- **Data Visualization**: ApexCharts + react-apexcharts + ECharts
- **UI Components**: Material-UI 5 + React Icons
- **Drag & Drop**: @dnd-kit for data visualization interface

## Key Architectural Patterns

### 1. Context-Based State Management
The app uses React Context for global state across three providers (wrap in this order):
```javascript
<AuthProvider>
  <SettingsProvider>
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  </SettingsProvider>
</AuthProvider>
```

### 2. Theme System
- **Dark/Light Mode**: Class-based (`document.documentElement.classList.toggle('dark')`)
- **CSS Tokens**: Use `src/styles/tokens.css` component classes (`.card`, `.btn-accent`, `.page-bg`)
- **Tailwind Extensions**: Custom color palette in `tailwind.config.js` with semantic naming (`textPrimary-light`, `surface-dark`)

### 3. Routing Structure
- **Protected Routes**: All main pages wrapped in `<ProtectedRoute>`
- **Nested Routes**: `/explore/*` and `/projects/:id/*` use nested routing
- **Layout**: Single `<Layout>` component provides navbar, footer, and responsive container

### 4. Component Organization
- **Pages**: `/pages/` - Top-level route components
- **Sections**: `/sections/` - Feature-specific layouts (Dashboard, Explore, Projects)
- **Components**: `/components/` - Reusable UI components
- **Services**: `/services/` - API integration layers

## Data Flow Patterns

### S3 Integration
- **Upload Flow**: User uploads → `user-uploads/` → S3 Trigger → `processed/` folder
- **File Access**: Uses Amplify Storage with custom prefixes (no default `public/`)
- **Configuration**: `src/utils/amplifyConfig.js` overrides default Storage settings

### API Communication
- **GraphQL**: Not used - relies on REST API Gateway + Lambda
- **Auth**: Cognito User Pools with AWS_IAM for API Gateway
- **Endpoints**: `/generate-notebook` for AI notebook generation

### Data Visualization
- **Dual Chart Libraries**: ApexCharts for basic charts, ECharts for advanced drag-drop interface
- **Drag-Drop Interface**: Uses @dnd-kit with droppable zones for X/Y axis mapping
- **Chart Generation**: `chartUtils.js` contains type-specific option generators

## Development Workflows

### Local Development
```bash
npm start              # Start React dev server
amplify mock          # Mock backend services locally
amplify push          # Deploy backend changes
```

### File Structure Conventions
- **Dual Visualizers**: Both `/components/DataVisualizer/` and `/sections/Projects/DataVisualizer/` exist
- **Widget Pattern**: Dashboard widgets in `/sections/Dashboard/widgets/`
- **Shared Utilities**: `/utils/` for configuration, `/services/` for API calls

### Component Patterns
- **Conditional Rendering**: Extensive use of loading states and error boundaries
- **Mock Data**: Most components include development mock data
- **Icon Usage**: React Icons (Fi* for Feather, Fa* for FontAwesome, Hi* for Heroicons)

## AI Notebook Generation

The platform includes an AI-powered Jupyter notebook generator:
- **Service**: `notebookGeneratorService.js` handles API communication
- **Component**: `AINotebookGenerator.jsx` provides the UI interface
- **Backend**: Python Lambda function generates notebooks based on research goals and datasets
- **Workflow**: Research goal → File selection → Lambda generation → S3 storage → Download link

## Testing & Debugging

### Available Tools
- **S3 Debug**: `debug-s3.js` and `DatasetDebugger.js` for S3 troubleshooting
- **Environment**: Backend server in `amplify/backend/server.js` for local S3 testing
- **Mock Data**: Extensive mock datasets in explore and dashboard sections

### Common Patterns
- **Error Handling**: All API calls wrapped in try-catch with user-friendly error messages
- **Loading States**: Consistent loading patterns with React state management
- **Responsive Design**: Mobile-first approach with Tailwind responsive utilities

## Healthcare Domain Context

This platform is designed for healthcare research data analysis:
- **Data Types**: Patient demographics, encounters, conditions, medications
- **Research Focus**: Treatment outcomes, healthcare utilization, demographic analysis
- **Compliance**: Built with healthcare data privacy considerations
- **Visualization**: Specialized charts for medical data analysis (demographics, outcomes, utilization patterns)

When working with this codebase, prioritize healthcare data privacy, ensure responsive design across all components, and maintain consistency with the established design token system.
