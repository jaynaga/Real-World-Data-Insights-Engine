import React, { createContext, useContext, useState, useEffect } from 'react';

const DemoContext = createContext();

export const useDemoMode = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check if demo mode is enabled via URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo');
    const storedDemo = localStorage.getItem('demo_mode');
    
    return demoParam === 'true' || storedDemo === 'true';
  });

  useEffect(() => {
    // Save demo mode state to localStorage
    localStorage.setItem('demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  const enableDemoMode = () => setIsDemoMode(true);
  const disableDemoMode = () => setIsDemoMode(false);
  const toggleDemoMode = () => setIsDemoMode(!isDemoMode);

  const value = {
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
    toggleDemoMode
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};
