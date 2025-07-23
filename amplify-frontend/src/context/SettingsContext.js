import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('app_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      theme: 'system',
      authentication: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    };
  });

  // Function to apply theme
  const applyTheme = (theme) => {
    if (theme === 'system') {
      // For system theme, check user's preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      // For manual theme selection
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  // Initial theme application
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        // Preserve nested objects if they're not included in the update
        profile: {
          ...prev.profile,
          ...(newSettings.profile || {})
        },
        authentication: {
          ...prev.authentication,
          ...(newSettings.authentication || {})
        }
      };
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      currentTheme: settings.theme 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
