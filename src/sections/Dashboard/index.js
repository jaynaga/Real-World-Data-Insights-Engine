import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRobot } from 'react-icons/fa';
import { FiUser, FiSend, FiLoader, FiExternalLink } from 'react-icons/fi';
import StatCard from './widgets/StatCard';
import ActivityFeed from './widgets/ActivityFeed';
import MyDatasetList from '../../components/MyDatasetList';
import AIDatasetAssistant from '../../components/AIDatasetAssistant';
import bedrockAIService from '../../services/bedrockAIService';
import { listProjects } from '../../services/projectService';
import { listDatasets, listUserUploads } from '../../utils/storageUtils';
import { Storage } from 'aws-amplify';
import '../../styles/tokens.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ dashboards: 0, bookmarks: 0, uploads: 0, reports: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Dataset Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const handleCloseAIAssistant = () => setShowAIAssistant(false);
  
  // Embedded AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Initialize chat with AI greeting
    if (chatMessages.length === 0) {
      const initialMessage = {
        id: Date.now(),
        type: 'assistant',
        content: "👋 Hi! I'm your AI Dataset Assistant. Tell me about your psychology research and I'll recommend relevant datasets.",
        timestamp: new Date()
      };
      setChatMessages([initialMessage]);
    }
  }, [chatMessages.length]);

  const handleSendChatMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      // Use Bedrock AI service for intelligent responses
      const aiResponse = await bedrockAIService.generateDatasetRecommendations(
        inputMessage,
        availableDatasets,
        chatMessages.slice(-4) // Last 4 messages for context
      );

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        recommendations: aiResponse.recommendations
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm having trouble connecting right now. Could you try rephrasing your question about psychology research datasets?",
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load projects to count dashboards
        const projects = await listProjects();
        const dashboardCount = projects.filter(project => project.dashboardConfig).length;
        
        // Load datasets to count bookmarks (user datasets)
        const datasets = await listDatasets();
        const userDatasets = datasets.filter(dataset => dataset.source === 'User Dataset');
        const bookmarkCount = userDatasets.length;
        
        // Store datasets for AI Assistant
        setAvailableDatasets(datasets);
        
        // Load user uploads count
        const uploads = await listUserUploads();
        const uploadCount = uploads.length;
        
        // Count generated reports/notebooks
        let reportCount = 0;
        try {
          const notebookFiles = await Storage.list('notebooks/', { 
            level: 'protected',
            pageSize: 1000 
          });
          reportCount = notebookFiles.filter(file => file.key.endsWith('.ipynb')).length;
        } catch (error) {
          console.log('Could not load notebook count:', error);
        }
        
        setStats({ 
          dashboards: dashboardCount, 
          bookmarks: bookmarkCount, 
          uploads: uploadCount, 
          reports: reportCount 
        });

        // Generate recent activities based on actual data
        const recentActivities = [];
        
        // Add recent projects with dashboards
        projects
          .filter(project => project.dashboardConfig)
          .slice(0, 2)
          .forEach(project => {
            recentActivities.push({
              id: `dashboard-${project.id}`,
              type: 'dashboard',
              text: `Created dashboard "${project.title}"`,
              timestamp: formatTimestamp(project.updatedAt)
            });
          });
        
        // Add recent uploads
        uploads
          .slice(0, 2)
          .forEach((upload, index) => {
            recentActivities.push({
              id: `upload-${index}`,
              type: 'upload',
              text: `Uploaded "${upload.name || 'dataset'}"`,
              timestamp: formatTimestamp(upload.lastModified)
            });
          });
        
        // Add recent dataset bookmarks
        userDatasets
          .slice(0, 1)
          .forEach((dataset, index) => {
            recentActivities.push({
              id: `bookmark-${index}`,
              type: 'bookmark',
              text: `Added dataset "${dataset.name}"`,
              timestamp: formatTimestamp(dataset.lastUpdated || dataset.date)
            });
          });
        
        // Sort activities by timestamp and take the most recent ones
        const sortedActivities = recentActivities
          .sort((a, b) => new Date(b.rawTimestamp || 0) - new Date(a.rawTimestamp || 0))
          .slice(0, 4);
        
        setActivities(sortedActivities);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to basic stats on error
        setStats({ dashboards: 0, bookmarks: 0, uploads: 0, reports: 0 });
        setActivities([
          { id: 1, type: 'info', text: 'Welcome to your dashboard!', timestamp: 'now' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col page-bg dashboard-container p-6 space-y-6">
      {/* Top Welcome Card */}
      <div className="flex justify-between items-center p-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome to your research hub!</h2>
          <p className="text-blue-100 dark:text-purple-100">Track your datasets, projects, and research progress</p>
        </div>
        <button 
          onClick={() => navigate('/projects/create')}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        ) : (
          <>
            <StatCard label="Active Projects" value={stats.dashboards} icon="📊" colorClass="blue" />
            <StatCard label="My Datasets" value={stats.bookmarks} icon="🗂️" colorClass="green" />
            <StatCard label="Total Files" value={stats.uploads} icon="📁" colorClass="purple" />
            <StatCard label="AI Reports" value={stats.reports} icon="🤖" colorClass="orange" />
          </>
        )}
      </div>

      {/* My Datasets */}
      <div className="card">
        <MyDatasetList />
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-heading mb-4">Recent Activity</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ActivityFeed activities={activities} />
          )}
        </div>
        <div className="card">
          <h3 className="section-heading mb-4">AI Dataset Assistant</h3>
          <div className="h-80 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <FaRobot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-white dark:bg-card-dark border border-default'
                    }`}>
                      <div className="text-xs whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    
                    {/* Show recommendations if available */}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.recommendations.slice(0, 2).map((rec) => (
                          <div key={rec.dataset.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <div className="text-xs font-medium">{rec.dataset.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {rec.reasons.slice(0, 1).join(', ')}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Link
                                to={`/explore/${rec.dataset.id}`}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-200 rounded"
                              >
                                <FiExternalLink className="h-3 w-3" />
                                View Dataset
                              </Link>
                              <button
                                onClick={() => setShowAIAssistant(true)}
                                className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-700 dark:text-green-200 rounded"
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                        {message.recommendations.length > 2 && (
                          <button
                            onClick={() => setShowAIAssistant(true)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View all {message.recommendations.length} recommendations
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                      <FiUser className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <FaRobot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-white dark:bg-card-dark border border-default p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FiLoader className="h-3 w-3 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about psychology datasets..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                disabled={isChatLoading}
              />
              <button
                onClick={handleSendChatMessage}
                disabled={!inputMessage.trim() || isChatLoading}
                className="bg-blue-500 text-white px-3 py-2 rounded text-xs hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FiSend className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full AI Dataset Assistant Modal - For detailed interactions */}
      {showAIAssistant && (
        <AIDatasetAssistant
          isOpen={showAIAssistant}
          onClose={handleCloseAIAssistant}
          availableDatasets={availableDatasets}
          onDatasetSelect={() => {}} // No specific dataset selection needed on dashboard
          currentProjectDatasets={[]}
        />
      )}
    </div>
  );
}