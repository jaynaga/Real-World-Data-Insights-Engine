import React, { useState, useMemo } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { motion } from 'framer-motion';
import '../styles/login-animations.css';

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
  const { showTutorial } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();

  // Generate consistent particle positions that won't change on re-render
  const particles = useMemo(() => {
    const colors = [
      'bg-blue-200', 'bg-blue-300', 'bg-indigo-200', 'bg-indigo-300', 
      'bg-purple-200', 'bg-purple-300', 'bg-violet-200', 'bg-violet-300',
      'bg-cyan-200', 'bg-sky-200', 'bg-white'
    ];
    
    return [...Array(200)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 3 + Math.random() * 4,
      borderRadius: `${30 + Math.random() * 70}% ${30 + Math.random() * 70}% ${30 + Math.random() * 70}% ${30 + Math.random() * 70}%`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, []);

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
          // Show welcome tutorial after successful login
          showTutorial();
          const from = location.state?.from?.pathname || '/';
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

  const handleDemoContinue = () => {
    sessionStorage.setItem('rwde_guest_access', 'true');
    showTutorial();
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Background circles removed for cleaner design */}
      </div>
      
      {/* Floating thinking blobs with Framer Motion */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute w-2 h-2 ${particle.color} opacity-30`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              borderRadius: particle.borderRadius
            }}
            animate={{ 
              x: [0, (Math.random() - 0.5) * 40, 0],
              y: [0, (Math.random() - 0.5) * 40, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: particle.animationDuration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.animationDelay
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 p-8 relative z-10">
        {/* Glass morphism card */}
        <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 transform transition-all duration-300 hover:scale-105">
          {/* Logo and header */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <img 
                src="/images/logo.jpeg" 
                alt="RWDE Logo" 
                className="h-20 w-20 rounded-full relative z-10 border-4 border-white/50 shadow-xl transform transition-transform duration-300 hover:rotate-12" 
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {showVerification ? 'Verify Account' : isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {showVerification ? 'Enter the verification code sent to your email' : 
                 isSignUp ? 'Join the RWDE community today' : 
                 'Sign in to continue to RWDE'}
              </p>
            </div>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="mt-6">
              <form className="space-y-6" onSubmit={handleForgotPassword}>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Reset Password</h3>
                  <button 
                    type="button" 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    onClick={() => { setShowForgotPassword(false); setForgotPasswordStep(1); setForgotPasswordMessage(''); }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {forgotPasswordMessage && (
                  <div className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 border border-blue-200 dark:border-blue-700">
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">{forgotPasswordMessage}</p>
                  </div>
                )}
                
                {forgotPasswordStep === 1 ? (
                  <div className="space-y-2">
                    <label htmlFor="forgotEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="forgotEmail"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="forgotCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Verification Code
                      </label>
                      <input
                        id="forgotCode"
                        type="text"
                        required
                        value={forgotPasswordCode}
                        onChange={(e) => setForgotPasswordCode(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter verification code"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="forgotNewPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          id="forgotNewPassword"
                          type="password"
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-white group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  {forgotPasswordStep === 1 ? 'Send Verification Code' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}
          {!showForgotPassword && (
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              {!showVerification && !isSignUp && (
                <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Guest access is available. Click the "Continue to Demo" button below to explore without logging in.
                  </p>
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-4 border border-red-200 dark:border-red-700 animate-shake">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                  </div>
                </div>
              )}

              {showVerification ? (
                <div className="space-y-2">
                  <label htmlFor="verificationCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      id="verificationCode"
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-300"
                      placeholder="Enter verification code"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-300"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type="password"
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-300"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-300"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {showVerification ? (
                      <svg className="h-5 w-5 text-white group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : isSignUp ? (
                      <svg className="h-5 w-5 text-white group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-white group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    )}
                  </span>
                  {showVerification ? 'Verify Account' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </div>

              {!showVerification && !isSignUp && (
                <div>
                  <button
                    type="button"
                    onClick={handleDemoContinue}
                    className="w-full py-3 px-4 border border-blue-300 dark:border-blue-700 text-sm font-semibold rounded-xl text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                  >
                    Continue to Demo (No Login Required)
                  </button>
                </div>
              )}

              {!showVerification && (
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 hover:underline"
                  >
                    {isSignUp ? '← Already have an account? Sign in' : "Don't have an account? Sign up →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setForgotPasswordMessage(''); }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
