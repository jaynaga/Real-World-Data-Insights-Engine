import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Don't show navbar on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {user && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
