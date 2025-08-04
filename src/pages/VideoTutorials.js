import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function VideoTutorials() {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Generate consistent particle positions
  const particles = useMemo(() => {
    const colors = [
      'bg-blue-200', 'bg-blue-300', 'bg-indigo-200', 'bg-indigo-300', 
      'bg-purple-200', 'bg-purple-300', 'bg-violet-200', 'bg-violet-300',
      'bg-cyan-200', 'bg-sky-200', 'bg-white'
    ];
    
    return [...Array(150)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 3 + Math.random() * 4,
      borderRadius: `${30 + Math.random() * 70}% ${30 + Math.random() * 70}% ${30 + Math.random() * 70}% ${30 + Math.random() * 70}%`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, []);

  const tutorials = [
    {
      id: 1,
      title: "Getting Started with RWDE",
      description: "Learn the basics of using the Real World Data Insights Engine platform",
      videoId: "5pf0_bpNbkw",
      duration: "5:30",
      thumbnail: `https://img.youtube.com/vi/5pf0_bpNbkw/maxresdefault.jpg`,
      topics: ["Platform Overview", "Creating Projects", "Basic Navigation"]
    },
    {
      id: 2,
      title: "Advanced Features & Analytics",
      description: "Dive deep into advanced analytics and data processing features",
      videoId: "JC3urnvKanI",
      duration: "8:45",
      thumbnail: `https://img.youtube.com/vi/JC3urnvKanI/maxresdefault.jpg`,
      topics: ["Advanced Analytics", "Data Processing", "Custom Workflows"]
    }
  ];

  const getEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  };

  const getWatchUrl = (videoId) => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-2 h-2 ${particle.color} opacity-20 animate-float`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`,
              borderRadius: particle.borderRadius,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Settings
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              📹 Video Tutorials
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Learn how to make the most of the Real World Data Insights Engine with our comprehensive video guides
            </p>
          </div>
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedVideo.title}
                </h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="aspect-video">
                <iframe
                  src={getEmbedUrl(selectedVideo.videoId)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {tutorials.map((tutorial) => (
            <motion.div
              key={tutorial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tutorial.id * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative group cursor-pointer" onClick={() => setSelectedVideo(tutorial)}>
                <img
                  src={tutorial.thumbnail}
                  alt={tutorial.title}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDQwMCAyMjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjI1IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTEyLjVMMjI1IDg3LjVWMTM3LjVMMTc1IDExMi41WiIgZmlsbD0iIzk0QTNBRiIvPgo8L3N2Zz4K';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white bg-opacity-90 rounded-full p-4">
                    <FaPlay className="text-blue-600 text-2xl ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {tutorial.duration}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {tutorial.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {tutorial.description}
                </p>

                {/* Topics */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Topics Covered:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tutorial.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedVideo(tutorial)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FaPlay className="text-sm" />
                    Watch Here
                  </button>
                  <a
                    href={getWatchUrl(tutorial.videoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaExternalLinkAlt className="text-sm" />
                    YouTube
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Need More Help?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Can't find what you're looking for? Check out our other resources or get in touch with our support team.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/settings')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Settings
            </button>
            <a
              href="mailto:support@rwde.com"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
