import React, { useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiUpload, FiSearch, FiUsers, FiBarChart2, FiPlay } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to RWDE Platform!",
    content: "Real World Data Exploration platform helps you explore datasets, create projects, and collaborate with others. Let's take a quick tour!",
    icon: <FiPlay className="w-8 h-8 text-blue-500" />,
    image: "/images/logo.jpeg"
  },
  {
    id: 2,
    title: "Upload Your Datasets",
    content: "Start by uploading your data files. RWDE supports various formats including CSV, JSON, and more. Your data is securely stored and ready for analysis.",
    icon: <FiUpload className="w-8 h-8 text-green-500" />,
    features: [
      "Support for multiple file formats",
      "Secure cloud storage",
      "Automatic data preview",
      "Metadata extraction"
    ]
  },
  {
    id: 3,
    title: "Explore Datasets",
    content: "Browse all available datasets in the Explore section. Use filters and search to find exactly what you need. View detailed information about each dataset.",
    icon: <FiSearch className="w-8 h-8 text-purple-500" />,
    features: [
      "Advanced filtering options",
      "Full-text search",
      "Dataset previews",
      "Tag-based organization"
    ]
  },
  {
    id: 4,
    title: "Create Projects",
    content: "Organize your work into projects. Add datasets, create notebooks, and build visualizations. Projects keep everything organized and shareable.",
    icon: <FiBarChart2 className="w-8 h-8 text-orange-500" />,
    features: [
      "Jupyter notebook integration",
      "Interactive visualizations",
      "Project templates",
      "Version control"
    ]
  },
  {
    id: 5,
    title: "AI-Powered Analysis",
    content: "Leverage our AI assistant to generate notebooks, create visualizations, and get insights from your data automatically.",
    icon: <FaRobot className="w-8 h-8 text-indigo-500" />,
    features: [
      "Auto-generated notebooks",
      "Smart data insights",
      "Natural language queries",
      "Automated reporting"
    ]
  },
  {
    id: 6,
    title: "Collaborate & Share",
    content: "Share your projects and datasets with team members. Invite collaborators and work together on data analysis projects.",
    icon: <FiUsers className="w-8 h-8 text-pink-500" />,
    features: [
      "Project sharing",
      "Email invitations",
      "Role-based access",
      "Real-time collaboration"
    ]
  },
  {
    id: 7,
    title: "Ready to Get Started!",
    content: "You're all set! Start by uploading your first dataset or exploring existing ones. Remember, you can always access this tutorial from Settings > Help.",
    icon: <FiPlay className="w-8 h-8 text-blue-500" />,
    actions: [
      { label: "Upload Dataset", path: "/upload" },
      { label: "Explore Data", path: "/explore" },
      { label: "Create Project", path: "/projects/create" }
    ]
  }
];

export default function WelcomeTutorial({ isOpen, onClose, onAction }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const handleActionClick = (path) => {
    onAction(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img src="/images/logo.jpeg" alt="RWDE Logo" className="h-8 w-8 rounded-full" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome Tutorial
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500 text-white'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px] flex flex-col">
          <div className="flex items-start space-x-6 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0">
              {step.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                {step.content}
              </p>

              {/* Features List */}
              {step.features && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Key Features:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {step.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons for Last Step */}
              {step.actions && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Quick Actions:
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {step.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(action.path)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Image */}
            {step.image && (
              <div className="flex-shrink-0 hidden lg:block">
                <img
                  src={step.image}
                  alt="Tutorial illustration"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Skip Tutorial
            </button>
            
            {isLastStep ? (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Get Started!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span>Next</span>
                <FiChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
