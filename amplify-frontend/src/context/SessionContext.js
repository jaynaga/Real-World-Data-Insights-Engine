import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    // Try to get existing session from localStorage
    const savedSession = localStorage.getItem('userSession');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  // Update localStorage when session changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('userSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('userSession');
    }
  }, [session]);

  const login = (userData) => {
    setSession({
      user: userData,
      startTime: new Date().toISOString(),
      isAuthenticated: true,
    });
  };

  const logout = () => {
    setSession(null);
  };

  const updateSession = (updates) => {
    setSession(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }));
  };

  return (
    <SessionContext.Provider value={{ session, login, logout, updateSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
