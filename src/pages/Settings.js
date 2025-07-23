import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { FaSave, FaUser, FaKey, FaEnvelope, FaPhone, FaSun, FaMoon } from 'react-icons/fa';
import { MdDevices } from 'react-icons/md';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    profile: {
      firstName: settings.profile?.firstName || '',
      lastName: settings.profile?.lastName || '',
      email: settings.profile?.email || '',
      phone: settings.profile?.phone || ''
    },
    theme: settings.theme || 'system',
    authentication: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const [errors, setErrors] = useState({
    profile: {},
    authentication: {},
    appearance: {} // Add appearance to errors object
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'appearance', label: 'Appearance', icon: <FaSun /> },
    { id: 'security', label: 'Security', icon: <FaKey /> }
  ];

  const handleInputChange = (section, field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: e.target.value
      }
    }));
    setIsDirty(true);
    
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: ''
        }
      }));
    }
  };

  const handleThemeChange = (theme) => {
    setFormData(prev => ({ ...prev, theme }));
    setIsDirty(true);
    // Save theme changes immediately
    updateSettings({ theme });
  };

  const validateForm = () => {
    const newErrors = {
      profile: {},
      authentication: {},
      appearance: {}
    };

    // Only validate the active tab
    switch (activeTab) {
      case 'profile':
        if (formData.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.profile.email)) {
          newErrors.profile.email = 'Please enter a valid email address';
        }
        if (formData.profile.phone && !/^\+?[\d\s-()]+$/.test(formData.profile.phone)) {
          newErrors.profile.phone = 'Please enter a valid phone number';
        }
        break;

      case 'security':
        if (formData.authentication.newPassword) {
          if (!formData.authentication.currentPassword) {
            newErrors.authentication.currentPassword = 'Current password is required';
          }
          if (formData.authentication.newPassword.length < 8) {
            newErrors.authentication.newPassword = 'Password must be at least 8 characters';
          }
          if (formData.authentication.newPassword !== formData.authentication.confirmPassword) {
            newErrors.authentication.confirmPassword = 'Passwords do not match';
          }
        }
        break;

      case 'appearance':
        // No validation needed for appearance tab
        break;
    }

    setErrors(newErrors);

    // Get the appropriate error object based on the active tab
    const currentTabErrors = activeTab === 'security' 
      ? newErrors.authentication 
      : newErrors[activeTab];

    return !currentTabErrors || Object.keys(currentTabErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const settingsToUpdate = {
        ...settings
      };

      // Update only the relevant section based on active tab
      switch (activeTab) {
        case 'profile':
          settingsToUpdate.profile = formData.profile;
          break;
        case 'appearance':
          settingsToUpdate.theme = formData.theme;
          break;
        case 'security':
          if (formData.authentication.newPassword) {
            settingsToUpdate.authentication = {
              password: formData.authentication.newPassword
            };
          }
          break;
      }

      updateSettings(settingsToUpdate);
      setIsDirty(false);
      
      if (activeTab === 'security') {
        // Clear password fields after save
        setFormData(prev => ({
          ...prev,
          authentication: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
        }));
      }

      navigate('/');
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
          <input
            type="text"
            value={formData.profile.firstName}
            onChange={handleInputChange('profile', 'firstName')}
            className="w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.profile.lastName}
            onChange={handleInputChange('profile', 'lastName')}
            className="w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <FaEnvelope /> Email Address
          </label>
          <input
            type="email"
            value={formData.profile.email}
            onChange={handleInputChange('profile', 'email')}
            className={`w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.profile.email ? 'border-red-500' : ''
            }`}
          />
          {errors.profile.email && (
            <p className="text-red-500 text-sm mt-1">{errors.profile.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <FaPhone /> Phone Number
          </label>
          <input
            type="tel"
            value={formData.profile.phone}
            onChange={handleInputChange('profile', 'phone')}
            className={`w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.profile.phone ? 'border-red-500' : ''
            }`}
          />
          {errors.profile.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.profile.phone}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Theme Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
              formData.theme === 'light'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaSun className="text-2xl text-yellow-500" />
            <span className="text-gray-900">Light</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
              formData.theme === 'dark'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaMoon className="text-2xl text-blue-500" />
            <span className="text-gray-900">Dark</span>
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
              formData.theme === 'system'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MdDevices className="text-2xl text-gray-500" />
            <span className="text-gray-900">System</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              value={formData.authentication.currentPassword}
              onChange={handleInputChange('authentication', 'currentPassword')}
              className={`w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.authentication.currentPassword ? 'border-red-500' : ''
              }`}
            />
            {errors.authentication.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.authentication.currentPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              value={formData.authentication.newPassword}
              onChange={handleInputChange('authentication', 'newPassword')}
              className={`w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.authentication.newPassword ? 'border-red-500' : ''
              }`}
            />
            {errors.authentication.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.authentication.newPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={formData.authentication.confirmPassword}
              onChange={handleInputChange('authentication', 'confirmPassword')}
              className={`w-full p-2 border rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.authentication.confirmPassword ? 'border-red-500' : ''
              }`}
            />
            {errors.authentication.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.authentication.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-card-dark rounded-lg shadow p-6 mb-6">
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaSave /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
