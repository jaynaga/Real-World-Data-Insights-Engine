import React from 'react';
import { FaRocket, FaClock, FaLightbulb, FaFlask, FaUsers, FaGraduationCap } from 'react-icons/fa';

export default function ComingSoonSection() {
  const comingSoonFeatures = [
    {
      icon: <FaFlask className="w-8 h-8" />,
      title: "Advanced Statistical Analysis",
      description: "Integrated R support, advanced statistical modeling, and automated hypothesis testing.",
      status: "In Development",
      eta: "Q2 2025"
    },
    {
      icon: <FaUsers className="w-8 h-8" />,
      title: "Real-time Collaboration",
      description: "Live collaborative editing, shared notebooks, and team workspaces.",
      status: "Coming Soon",
      eta: "Q3 2025"
    },
    {
      icon: <FaGraduationCap className="w-8 h-8" />,
      title: "Academic Integration",
      description: "Direct integration with institutional databases, IRB workflow management.",
      status: "Planned",
      eta: "Q4 2025"
    },
    {
      icon: <FaLightbulb className="w-8 h-8" />,
      title: "Smart Insights Engine",
      description: "AI-powered pattern recognition and automated insight generation.",
      status: "Research Phase",
      eta: "2026"
    },
    {
      icon: <FaRocket className="w-8 h-8" />,
      title: "Cloud Computing Integration",
      description: "Scalable compute clusters for large-scale data processing.",
      status: "Planned",
      eta: "2026"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Coming Soon':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Research Phase':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900 rounded-full">
          <FaRocket className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          We're continuously evolving RWDE to bring you cutting-edge features for psychological research
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comingSoonFeatures.map((feature, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="text-indigo-600 dark:text-indigo-400 mr-3">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
              {feature.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                {feature.status}
              </span>
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                <FaClock className="w-3 h-3 mr-1" />
                {feature.eta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Have a Feature Request?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            We'd love to hear your ideas for making RWDE even better for psychological research.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
