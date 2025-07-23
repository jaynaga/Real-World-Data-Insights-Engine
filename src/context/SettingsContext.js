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
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
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
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  // Initial theme application
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]); // ✅ Fixed: proper dependency array

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]); // ✅ Fixed

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]); // ✅ Fixed

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      profile: {
        ...prev.profile,
        ...(newSettings.profile || {})
      },
      authentication: {
        ...prev.authentication,
        ...(newSettings.authentication || {})
      }
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        currentTheme: settings.theme
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;