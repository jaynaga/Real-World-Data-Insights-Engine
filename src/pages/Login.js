import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordCode, setForgotPasswordCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const { login, signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    if (forgotPasswordStep === 1) {
      // Request code
      try {
        await Auth.forgotPassword(email);
        setForgotPasswordStep(2);
        setForgotPasswordMessage('A verification code has been sent to your email.');
      } catch (err) {
        setForgotPasswordMessage(err.message);
      }
    } else if (forgotPasswordStep === 2) {
      // Submit new password
      try {
        await Auth.forgotPasswordSubmit(email, forgotPasswordCode, forgotNewPassword);
        setForgotPasswordMessage('Password reset successful. You can now sign in.');
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setForgotPasswordCode('');
        setForgotNewPassword('');
      } catch (err) {
        setForgotPasswordMessage(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (showVerification) {
        // Handle verification code submission
        const result = await confirmSignUp(email, verificationCode);
        if (result.success) {
          setShowVerification(false);
          setIsSignUp(false);
        } else {
          setError(result.message);
        }
        return;
      }

      if (isSignUp) {
        // Handle sign up
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        const result = await signUp(email, password);
        if (result.success) {
          setShowVerification(true);
        } else {
          setError(result.message);
        }
      } else {
        // Handle login
        const result = await login(email, password);
        if (result.success) {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-card-dark rounded-lg shadow-lg">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img src="/images/logo.jpeg" alt="RWDE Logo" className="h-16 w-auto rounded-full mb-4" />
          <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            {showVerification ? 'Verify Account' : isSignUp ? 'Create Account' : 'Sign in to RWDE'}
          </h2>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <button type="button" className="text-xs text-primary-600 float-right" onClick={() => { setShowForgotPassword(false); setForgotPasswordStep(1); setForgotPasswordMessage(''); }}>
                Back to Login
              </button>
            </div>
            {forgotPasswordMessage && (
              <div className="rounded-md bg-blue-50 p-2 mb-2 text-blue-800 text-sm">{forgotPasswordMessage}</div>
            )}
            {forgotPasswordStep === 1 ? (
              <div>
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                <input
                  id="forgotEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="forgotCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Code</label>
                  <input
                    id="forgotCode"
                    type="text"
                    required
                    value={forgotPasswordCode}
                    onChange={(e) => setForgotPasswordCode(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="forgotNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <input
                    id="forgotNewPassword"
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </>
            )}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {forgotPasswordStep === 1 ? 'Send Code' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
        {!showForgotPassword && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {showVerification ? (
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter code from email"
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {showVerification ? 'Verify' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          {!showVerification && (
            <div className="text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setForgotPasswordMessage(''); }}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </button>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
}
