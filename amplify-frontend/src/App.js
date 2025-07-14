import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './sections/Dashboard';
import Upload from './pages/Upload';
import Explore from './sections/Explore';
import Projects, { ProjectDetails } from './sections/Projects';
import NotFound from './pages/NotFound';
import SingleDatasetOverview from './sections/Explore/SingleDatasetOverview';
import Login from './pages/Login';
import Settings from './pages/Settings';
import SingleProject from './sections/Projects/SingleProject';
import ProjectVisualization from './sections/Projects/ProjectVisualization';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

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
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute>
          <Upload />
        </ProtectedRoute>
      } />
      <Route path="/explore" element={
        <ProtectedRoute>
          <Explore />
        </ProtectedRoute>
      } />
      <Route path="/explore/dataset" element={
        <ProtectedRoute>
          <SingleDatasetOverview />
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      } />
      <Route path="/projects/details" element={
        <ProtectedRoute>
          <ProjectDetails />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <SingleProject />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id/visualization" element={
        <ProtectedRoute>
          <ProjectVisualization />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
