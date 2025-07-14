# RealWorld Insights Engine: Mental Health Analytics (Georgetown HIDS Capstone)

This repository contains code and documentation for the Georgetown University Health Informatics and Data Science Capstone Project in collaboration with ICA, focused on developing an AI-powered mental health analytics platform using AWS cloud tools and real-world public health data.

## Project Scope
- Mental health data ingestion and harmonization
- Predictive modeling and AI-based analysis of trends, disparities, and risk factors
- Real-time visualization tools and dashboards for public health users
- Modular web frontend for data exploration and project management

## Tech Stack
- **Frontend:**
  - React 18
  - React Router v6
  - Tailwind CSS for styling
  - AWS Amplify UI Components
  - Dark mode support
  - Session management with protected routes

- **AWS Services:**
  - S3: Storage for raw and processed datasets
  - Glue: ETL jobs for cleaning and harmonization
  - SageMaker: Model development and deployment
  - Bedrock: Natural language querying and hypothesis generation
  - QuickSight: Dashboard creation and visualization

- **Development Tools:**
  - Python (pandas, NumPy, scikit-learn, TensorFlow)
  - Jupyter Notebooks for analysis
  - Git for version control
  - Node.js and npm for frontend development

## Project Structure
```
├── amplify-frontend/     # React frontend application
│   ├── src/
│   │   ├── core/        # App entry point and main component
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── pages/       # Page components
│   │   ├── routes/      # Routing configuration
│   │   ├── sections/    # Feature-specific sections
│   │   ├── styles/      # Global styles & theming
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
├── data_ingestion/      # Data pipeline scripts
├── docs/                # Project documentation
├── notebooks/           # Jupyter notebooks for analysis
└── dashboards/          # QuickSight configurations
```

## Getting Started

### Frontend Development

1. Navigate to the frontend directory:
```bash
cd amplify-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000

### Development Features
- Dev login bypass for quick testing (development mode only)
- Dark mode support based on system preferences
- Protected routes with session management
- Responsive design for all screen sizes

## Project Status

### Completed
- [x] Project structure and organization
- [x] Frontend routing system
- [x] Authentication and session management
- [x] Dark mode implementation
- [x] Responsive navigation

### In Progress
- [ ] AWS Amplify integration
- [ ] Data pipeline development
- [ ] Dashboard creation
- [ ] Model development
- [ ] Production deployment

## Contributing

1. Create a feature branch from main
2. Implement your changes
3. Test thoroughly
4. Submit a pull request with a clear description

## Documentation
- Frontend architecture details in `amplify-frontend/README.md`
- Data pipeline documentation in `data_ingestion/README.md`
- Final project report in `docs/final_report.pdf`

## Security Note
- Development mode includes simplified authentication
- Production deployment will require proper AWS Cognito integration
- Ensure all credentials are properly secured before deployment

For detailed frontend documentation, see `amplify-frontend/README.md`.
For questions or support, contact the development team.