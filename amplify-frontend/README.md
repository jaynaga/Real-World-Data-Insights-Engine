# Amplify Frontend Template

This directory contains a professional React frontend scaffolded for AWS Amplify integration, suitable for a data commons platform.

## Features
- Modern React + Tailwind CSS design
- Amplify Auth integration (sign in/sign up)
- Responsive layout with navigation and footer
- Modular sections: Dashboard, Explore, Projects, Upload
- Dynamic routing with React Router (see `src/App.js`)
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
- `src/components/` – Navbar, Footer, AuthWrapper, ProtectedRoute
- `src/pages/` – Upload, NotFound
- `src/sections/` –
  - `Dashboard/` – Dashboard layout and widgets
  - `Explore/` – Dataset explorer, sidebar, table, card, overview
  - `Projects/` – Projects index, project details
- `src/utils/` – API helpers
- `src/styles/` – Tailwind tokens and custom CSS
- `src/theme.js` – Theme configuration
- `src/App.js` – Main routing component

---

This frontend is ready for further customization and integration with your AWS backend.
