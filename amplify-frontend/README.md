# Amplify Frontend Template

This directory contains a professional React frontend scaffolded for AWS Amplify integration, suitable for a data commons platform.

## Features
- Modern React + Material-UI (MUI) design
- Amplify Auth integration (sign in/sign up)
- Responsive layout with navigation and footer
- Pages: Home, Data Catalog, Visualizations, About
- Ready for Amplify API and QuickSight integration

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Initialize Amplify (if not done):
   ```bash
   amplify init
   ```
4. Add Auth and API as needed:
   ```bash
   amplify add auth
   amplify add api
   amplify push
   ```

## Structure
- `src/components/` – Navbar, Footer, AuthWrapper
- `src/pages/` – Home, Data Catalog, Visualizations, About
- `src/utils/` – API helpers
- `src/theme.js` – MUI theme

---

This frontend is ready for further customization and integration with your AWS backend.
