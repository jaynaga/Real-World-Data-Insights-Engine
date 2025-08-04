import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useTutorial } from '../context/TutorialContext';
import { FaSave, FaUser, FaKey, FaEnvelope, FaPhone, FaSun, FaMoon, FaQuestionCircle } from 'react-icons/fa';
import { MdDevices } from 'react-icons/md';
import { motion } from 'framer-motion';
import DemoModeToggle from '../components/DemoModeToggle';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { showTutorial } = useTutorial();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isDirty, setIsDirty] = useState(false);

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
    { id: 'security', label: 'Security', icon: <FaKey /> },
    { id: 'help', label: 'Help', icon: <FaQuestionCircle /> }
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
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {(formData.profile.firstName?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {formData.profile.firstName || formData.profile.lastName 
                ? `${formData.profile.firstName} ${formData.profile.lastName}`.trim()
                : 'User Profile'
              }
            </h3>
            <p className="text-blue-600 dark:text-blue-400">{formData.profile.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">First Name</label>
          <input
            type="text"
            value={formData.profile.firstName}
            onChange={handleInputChange('profile', 'firstName')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
            placeholder="Enter your first name"
          />
        </div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Last Name</label>
          <input
            type="text"
            value={formData.profile.lastName}
            onChange={handleInputChange('profile', 'lastName')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
            placeholder="Enter your last name"
          />
        </div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <FaEnvelope className="text-blue-500" /> Email Address
          </label>
          <input
            type="email"
            value={formData.profile.email}
            onChange={handleInputChange('profile', 'email')}
            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 ${
              errors.profile.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 dark:border-gray-600'
            }`}
            placeholder="Enter your email address"
          />
          {errors.profile.email && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.profile.email}
            </p>
          )}
        </div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <FaPhone className="text-green-500" /> Phone Number
          </label>
          <input
            type="tel"
            value={formData.profile.phone}
            onChange={handleInputChange('profile', 'phone')}
            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 ${
              errors.profile.phone ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 dark:border-gray-600'
            }`}
            placeholder="Enter your phone number"
          />
          {errors.profile.phone && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.profile.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-8">
      {/* Theme Section Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Choose Your Theme</h3>
        <p className="text-gray-600 dark:text-gray-400">Customize the appearance of your workspace</p>
      </div>

      {/* Theme Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleThemeChange('light')}
          className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            formData.theme === 'light'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              formData.theme === 'light' 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-yellow-100'
            }`}>
              <FaSun className={`text-2xl transition-colors duration-300 ${
                formData.theme === 'light' ? 'text-white' : 'text-yellow-500'
              }`} />
            </div>
            <div className="text-center">
              <span className={`text-lg font-semibold transition-colors duration-300 ${
                formData.theme === 'light' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
              }`}>Light Mode</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Bright and clean interface</p>
            </div>
          </div>
          {formData.theme === 'light' && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => handleThemeChange('dark')}
          className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            formData.theme === 'dark'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              formData.theme === 'dark' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900'
            }`}>
              <FaMoon className={`text-2xl transition-colors duration-300 ${
                formData.theme === 'dark' ? 'text-white' : 'text-indigo-500'
              }`} />
            </div>
            <div className="text-center">
              <span className={`text-lg font-semibold transition-colors duration-300 ${
                formData.theme === 'dark' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
              }`}>Dark Mode</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Easy on the eyes</p>
            </div>
          </div>
          {formData.theme === 'dark' && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => handleThemeChange('system')}
          className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            formData.theme === 'system'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              formData.theme === 'system' 
                ? 'bg-gradient-to-r from-green-500 to-teal-600 shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 dark:group-hover:bg-green-900'
            }`}>
              <MdDevices className={`text-2xl transition-colors duration-300 ${
                formData.theme === 'system' ? 'text-white' : 'text-green-500'
              }`} />
            </div>
            <div className="text-center">
              <span className={`text-lg font-semibold transition-colors duration-300 ${
                formData.theme === 'system' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
              }`}>System</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Follow device settings</p>
            </div>
          </div>
          {formData.theme === 'system' && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Theme Preview
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="w-1/2 h-2 bg-blue-200 dark:bg-blue-800 rounded"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
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

  const renderHelpSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Getting Started</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <div className="flex items-start space-x-4">
            <FaQuestionCircle className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Welcome Tutorial
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                New to RWDE? Take our interactive tutorial to learn about uploading datasets, 
                creating projects, and exploring data. Perfect for getting started or refreshing 
                your knowledge.
              </p>
              <button
                onClick={showTutorial}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Documentation</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Comprehensive guides and API references
            </p>
            <a 
              href="#" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              View Docs →
            </a>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Video Tutorials</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Step-by-step video guides for common tasks
            </p>
            <a 
              href="#" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Watch Videos →
            </a>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Community Forum</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Get help from other users and experts
            </p>
            <a 
              href="#" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Join Forum →
            </a>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Support</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Need personalized help? Reach out to our team
            </p>
            <a 
              href="mailto:support@rwde.com" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Contact Us →
            </a>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Coming Soon</h3>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Kaggle Integration</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Direct integration with Kaggle datasets and competitions. Import datasets seamlessly 
                  and participate in competitions directly from the RWDE platform.
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    In Development
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      
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

      <div className="pt-20 h-full overflow-auto relative z-10">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-8 min-h-full">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Customize your workspace and preferences
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className={`text-lg transition-transform duration-200 ${
                  activeTab === tab.id ? 'scale-110' : ''
                }`}>
                  {tab.icon}
                </span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === 'profile' && renderProfileSettings()}
              {activeTab === 'appearance' && renderAppearanceSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'help' && renderHelpSettings()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 font-medium transition-all duration-200 hover:shadow-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-8 py-3 rounded-xl flex items-center gap-3 font-medium transition-all duration-200 ${
              isDirty
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaSave className={`transition-transform duration-200 ${isDirty ? 'animate-pulse' : ''}`} /> 
            Save Changes
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
