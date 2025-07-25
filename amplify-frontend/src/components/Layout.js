import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDashboardPage = location.pathname.includes('/dashboard');
  const isVisualizationPage = location.pathname.includes('/visualization') || location.pathname.includes('/smart-viz');

  // Don't show navbar on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Special layout for dashboard and visualization pages - full width, no padding
  if (isDashboardPage || isVisualizationPage) {
    return (
      <div className="min-h-screen bg-white">
        {user && <Navbar />}
        <main className="w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {user && <Navbar />}
      <main className="w-full max-w-none px-6 py-8">
        {children}
      </main>
    </div>
  );
}
