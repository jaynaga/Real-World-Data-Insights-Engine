import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <AuthProvider>
      {isHome ? (
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      ) : (
        <>
          <Navbar />
          <div className="max-w-4xl mx-auto min-h-screen py-8 px-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </>
      )}
    </AuthProvider>
  );
}

export default App;
