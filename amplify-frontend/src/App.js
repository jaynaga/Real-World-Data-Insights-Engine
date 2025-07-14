import React, { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Routes, Route, Navigate } from 'react-router-dom';
import awsconfig from './aws-exports';
import './utils/amplifyConfig';  // Import custom storage config
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './sections/Dashboard';
import Upload from './pages/Upload';
import DatasetExplorerPage from './sections/Explore';
import Projects from './sections/Projects';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Settings from './pages/Settings';
import SingleProject from './sections/Projects/SingleProject';
import ProjectVisualization from './sections/Projects/ProjectVisualization';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';

// Configure Amplify
Amplify.configure(awsconfig);

function AppContent() {
  useEffect(() => {
    // Initialize theme based on saved preference or system setting
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const { theme } = JSON.parse(savedSettings);
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    } else {
      // Default to system preference if no saved settings
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/explore/*" element={<ProtectedRoute><DatasetExplorerPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><SingleProject /></ProtectedRoute>} />
        <Route path="/projects/:projectId/visualize" element={<ProtectedRoute><ProjectVisualization /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
