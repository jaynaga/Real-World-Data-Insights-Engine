import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // TODO: Replace with real authentication when AWS is set up
      // Mock login for now
      const mockUser = {
        id: '1',
        email,
        name: 'Test User',
        role: 'researcher'
      };
      
      login(mockUser);
      
      // Redirect to the page they tried to visit or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid credentials');
      console.error('Login error:', err);
    }
  };

  const handleDevBypass = () => {
    // Quick dev login
    login({ id: 'dev', name: 'Developer', role: 'admin' });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-card-dark rounded-lg shadow-lg">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img src="/images/logo.jpeg" alt="RWDE Logo" className="h-16 w-auto rounded-full mb-4" />
          <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            Real World Insights Engine
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark dark:bg-surface-dark dark:border-border-dark"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark dark:bg-surface-dark dark:border-border-dark"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-accent-light hover:bg-blue-700 dark:bg-accent-dark dark:hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            Sign In
          </button>
        </form>

        {/* Dev bypass button - only shown in development */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleDevBypass}
            className="mt-4 w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-textPrimary-light dark:text-textPrimary-dark rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Dev Login (Bypass)
          </button>
        )}
      </div>
    </div>
  );
}
