import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiX, 
  FiSend, 
  FiDatabase, 
  FiUser, 
  FiCpu,
  FiLoader,
  FiCheck,
  FiPlus,
  FiFolderPlus,
  FiExternalLink
} from 'react-icons/fi';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import bedrockAIService from '../services/bedrockAIService';
import { listProjects, createProject, addDatasetToProject } from '../services/projectService';

const AIDatasetAssistant = ({ 
  isOpen, 
  onClose, 
  availableDatasets = [], 
  onDatasetSelect,
  currentProjectDatasets = []
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [conversationPhase, setConversationPhase] = useState('greeting'); // greeting, discovery, recommendation, selection, project_selection
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectCreation, setShowProjectCreation] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize conversation with greeting
      const initialMessage = {
        id: Date.now(),
        type: 'assistant',
        content: "👋 Hi! I'm your AI Dataset Assistant. I'm here to help you find the perfect datasets for your psychology research.\n\nTo get started, could you tell me about your research focus? For example:\n• What specific area of psychology are you studying?\n• What type of analysis do you want to perform?\n• Are you looking for clinical data, behavioral data, or something else?",
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, messages.length]);

  // Load available projects when component opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableProjects();
    }
  }, [isOpen]);

  const loadAvailableProjects = async () => {
    try {
      const projects = await listProjects();
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setAvailableProjects([]);
    }
  };

  const handleCreateNewProject = async () => {
    try {
      if (!newProjectName.trim()) return;
      
      const projectData = {
        id: `project-${Date.now()}`,
        title: newProjectName.trim(),
        description: newProjectDescription.trim() || 'Created via AI Dataset Assistant',
        datasets: [],
        status: 'active'
      };

      const createdProject = await createProject(projectData);
      setAvailableProjects(prev => [...prev, createdProject]);
      setSelectedProject(createdProject);
      setShowProjectCreation(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      // Add selected datasets to the new project
      await addDatasetsToProject(createdProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const addDatasetsToProject = async (projectId) => {
    try {
      for (const dataset of selectedDatasets) {
        await addDatasetToProject(projectId, dataset.id);
      }
      
      // Show success message
      const successMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `✅ Successfully added ${selectedDatasets.length} dataset(s) to your project! You can now start analyzing your data.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      
      // Reset state
      setSelectedDatasets([]);
      setConversationPhase('greeting');
      
      // Call the parent callback if provided
      if (onDatasetSelect) {
        selectedDatasets.forEach(dataset => onDatasetSelect(dataset));
      }
    } catch (error) {
      console.error('Failed to add datasets to project:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `❌ Sorry, there was an error adding datasets to your project. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const analyzeUserInput = (input) => {
    const lowerInput = input.toLowerCase();
    
    // Psychology research areas mapping
    const researchAreas = {
      clinical: ['clinical', 'depression', 'anxiety', 'mental health', 'psychiatric', 'disorder', 'therapy', 'treatment'],
      cognitive: ['cognitive', 'memory', 'attention', 'perception', 'learning', 'decision making', 'brain'],
      social: ['social', 'behavior', 'interaction', 'group', 'relationship', 'communication'],
      developmental: ['developmental', 'child', 'adolescent', 'aging', 'growth', 'maturation'],
      behavioral: ['behavioral', 'behavior', 'conditioning', 'reinforcement', 'habits'],
      neuropsychology: ['neuropsychology', 'brain', 'neurological', 'cognitive impairment', 'stroke'],
      health: ['health', 'medical', 'disease', 'symptoms', 'diagnosis', 'patient']
    };

    const detectedAreas = [];
    for (const [area, keywords] of Object.entries(researchAreas)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        detectedAreas.push(area);
      }
    }

    return detectedAreas;
  };

  const recommendDatasets = (researchAreas, userInput) => {
    const recommendations = [];
    
    // Filter datasets based on research areas and content
    availableDatasets.forEach(dataset => {
      let score = 0;
      let reasons = [];
      
      const datasetName = dataset.name?.toLowerCase() || '';
      const datasetSource = dataset.source?.toLowerCase() || '';
      
      // Score based on research area match
      researchAreas.forEach(area => {
        switch (area) {
          case 'clinical':
            if (datasetName.includes('patient') || datasetName.includes('clinical') || 
                datasetName.includes('medical') || datasetSource.includes('synthea')) {
              score += 3;
              reasons.push('Contains clinical/medical data');
            }
            break;
          case 'behavioral':
            if (datasetName.includes('behavior') || datasetName.includes('observation')) {
              score += 3;
              reasons.push('Includes behavioral observations');
            }
            break;
          case 'health':
            if (datasetName.includes('health') || datasetName.includes('medical') || 
                datasetSource.includes('synthea')) {
              score += 3;
              reasons.push('Health-related dataset');
            }
            break;
          default:
            if (datasetName.includes(area)) {
              score += 2;
              reasons.push(`Matches ${area} research area`);
            }
        }
      });

      // Additional scoring for dataset characteristics
      if (dataset.fileCount > 5) {
        score += 1;
        reasons.push('Rich dataset with multiple files');
      }
      
      if (dataset.size > 1024 * 1024) { // > 1MB
        score += 1;
        reasons.push('Substantial data volume');
      }

      // Exclude datasets already in project
      const isAlreadyInProject = currentProjectDatasets.some(pd => pd.id === dataset.id);
      
      if (score > 0 && !isAlreadyInProject) {
        recommendations.push({
          dataset,
          score,
          reasons
        });
      }
    });

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  };

  const generateResponse = async (userInput) => {
    setIsLoading(true);
    
    try {
      // Get conversation history for context
      const conversationHistory = messages.slice(-4); // Last 4 messages for context
      
      // Use Bedrock AI service for intelligent responses
      const aiResponse = await bedrockAIService.generateDatasetRecommendations(
        userInput, 
        availableDatasets,
        conversationHistory
      );
      
      // Update conversation phase based on AI response
      if (aiResponse.recommendations.length > 0) {
        setConversationPhase('recommendation');
      } else if (aiResponse.researchAreas.length > 0) {
        setConversationPhase('discovery');
      }
      
      return {
        response: aiResponse.response,
        recommendations: aiResponse.recommendations
      };
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback to rule-based system if Bedrock fails
      console.warn('Falling back to rule-based recommendations...');
      return await generateFallbackResponse(userInput);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = async (userInput) => {
    // Existing rule-based logic as fallback
    let response = '';
    let recommendations = [];
    
    if (conversationPhase === 'greeting') {
      const detectedAreas = analyzeUserInput(userInput);
      
      if (detectedAreas.length > 0) {
        response = `Great! I can see you're interested in ${detectedAreas.join(', ')} research. That's fascinating! 

Let me ask a few more questions to find the best datasets for you:

1. What's your primary research question or hypothesis?
2. Are you looking for longitudinal data (over time) or cross-sectional data (single point in time)?
3. Do you need data from specific populations (age groups, demographics, conditions)?

Based on what you've told me so far, I'm already identifying some promising datasets for your ${detectedAreas[0]} research.`;
        
        setConversationPhase('discovery');
      } else {
        response = `I'd love to help you find the right datasets! Could you be more specific about your research area? For example:

• Are you studying specific mental health conditions?
• Looking at cognitive processes or behavioral patterns?
• Interested in developmental or social psychology?
• Working with clinical populations?

The more details you share, the better I can match you with relevant datasets! 🎯`;
      }
    } else if (conversationPhase === 'discovery') {
      const detectedAreas = analyzeUserInput(userInput);
      recommendations = recommendDatasets(detectedAreas, userInput);
      
      if (recommendations.length > 0) {
        response = `Perfect! Based on your research interests, I've found ${recommendations.length} datasets that could be ideal for your study:`;
        setConversationPhase('recommendation');
      } else {
        response = `I understand your research focus better now. Let me search for datasets that match your specific needs. Could you tell me:

• What type of data would be most valuable (survey responses, medical records, behavioral observations)?
• Are you looking for recent data or would historical data work?
• Any specific variables or measurements you need?

This will help me find the most relevant datasets for your research! 🔍`;
      }
    } else {
      // Continue conversation or provide additional help
      const detectedAreas = analyzeUserInput(userInput);
      if (detectedAreas.length > 0) {
        recommendations = recommendDatasets(detectedAreas, userInput);
        if (recommendations.length > 0) {
          response = `I found ${recommendations.length} additional datasets that might interest you:`;
        } else {
          response = `I understand your requirements. While I don't see any new datasets that perfectly match these specific criteria, you might consider:

• Combining multiple existing datasets for a comprehensive analysis
• Looking for similar research areas that might have relevant data
• Checking if any of the previously suggested datasets could be adapted for your needs

Would you like me to suggest some alternative approaches or datasets? 💡`;
        }
      } else {
        response = `I'm here to help! Feel free to:
• Ask about specific datasets you've seen
• Tell me more about your research methodology  
• Request datasets for different research questions
• Get advice on combining multiple datasets

What would be most helpful for your research? 🤔`;
      }
    }

    return { response, recommendations };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');

    const { response, recommendations } = await generateResponse(currentInput);

    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: response,
      recommendations: recommendations || [],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDatasetSelect = (dataset) => {
    if (selectedDatasets.find(d => d.id === dataset.id)) {
      setSelectedDatasets(prev => prev.filter(d => d.id !== dataset.id));
    } else {
      setSelectedDatasets(prev => [...prev, dataset]);
    }
  };

  const handleAddSelectedDatasets = () => {
    // Move to project selection phase
    setConversationPhase('project_selection');
    
    const projectSelectionMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `Great choice! I've selected ${selectedDatasets.length} dataset${selectedDatasets.length > 1 ? 's' : ''} for you.\n\nNow, which project would you like to add ${selectedDatasets.length > 1 ? 'these datasets' : 'this dataset'} to?`,
      timestamp: new Date(),
      showProjectSelection: true
    };
    
    setMessages(prev => [...prev, projectSelectionMessage]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-card-dark border border-default rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-default bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500 text-white">
              <FiCpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Dataset Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by AWS Bedrock • Psychology Research Specialist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <FiCpu className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div className={`p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white ml-auto' 
                    : 'bg-white dark:bg-card-dark border border-default'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                </div>
                
                {/* Dataset Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.recommendations.map((rec, index) => (
                      <div key={rec.dataset.id} className="bg-white dark:bg-card-dark border border-default rounded-lg p-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FiDatabase className="h-4 w-4 text-blue-500" />
                              <h4 className="font-medium text-sm">{rec.dataset.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                rec.dataset.source === 'User Dataset'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                                {rec.dataset.source === 'User Dataset' ? 'Your Data' : 'Synthea'}
                              </span>
                            </div>
                            
                            {/* Dataset Stats */}
                            <div className="text-xs text-gray-500 mb-2">
                              {rec.dataset.fileCount} files • {(rec.dataset.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                            
                            {/* Why This Dataset */}
                            <div className="text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Why this dataset: </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {rec.reasons.join(', ')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="ml-3 flex flex-col gap-2">
                            <Link
                              to={`/explore/${rec.dataset.id}`}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-1"
                              onClick={() => {
                                // Optional: close modal when navigating
                                onClose();
                              }}
                            >
                              <FiExternalLink className="h-3 w-3" />
                              View Dataset
                            </Link>
                            
                            <button
                              onClick={() => handleDatasetSelect(rec.dataset)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                selectedDatasets.find(d => d.id === rec.dataset.id)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {selectedDatasets.find(d => d.id === rec.dataset.id) ? (
                                <>
                                  <FiCheck className="inline h-3 w-3 mr-1" />
                                  Selected
                                </>
                              ) : (
                                <>
                                  <FiPlus className="inline h-3 w-3 mr-1" />
                                  Select
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Selection */}
                {message.showProjectSelection && (
                  <div className="mt-3 space-y-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose a project:</div>
                    
                    {/* Existing Projects */}
                    {availableProjects.length > 0 && (
                      <div className="space-y-2">
                        {availableProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              setSelectedProject(project);
                              addDatasetsToProject(project.id);
                            }}
                            className="w-full text-left p-3 border border-default rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <div className="font-medium text-sm">{project.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {project.description} • {project.datasets?.length || 0} datasets
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Create New Project */}
                    <div className="border-t border-default pt-3">
                      {!showProjectCreation ? (
                        <button
                          onClick={() => setShowProjectCreation(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600"
                        >
                          <FiPlus className="h-4 w-4" />
                          Create New Project
                        </button>
                      ) : (
                        <div className="space-y-3 p-3 border border-default rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Project Name *
                            </label>
                            <input
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="e.g., Depression Social Factors Study"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Description (optional)
                            </label>
                            <textarea
                              value={newProjectDescription}
                              onChange={(e) => setNewProjectDescription(e.target.value)}
                              placeholder="Brief description of your research..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateNewProject}
                              disabled={!newProjectName.trim()}
                              className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Create & Add Datasets
                            </button>
                            <button
                              onClick={() => {
                                setShowProjectCreation(false);
                                setNewProjectName('');
                                setNewProjectDescription('');
                              }}
                              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <FiCpu className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white dark:bg-card-dark border border-default p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Datasets Summary */}
        {selectedDatasets.length > 0 && (
          <div className="border-t border-default p-3 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{selectedDatasets.length} dataset{selectedDatasets.length > 1 ? 's' : ''} selected</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {selectedDatasets.map(d => d.name).join(', ')}
                </span>
              </div>
              <button
                onClick={handleAddSelectedDatasets}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 flex items-center gap-2"
              >
                <HiOutlinePlusCircle className="h-4 w-4" />
                Add to Project
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-default p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your psychology research or ask for dataset recommendations..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-2 top-2 p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <FiSend className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDatasetAssistant;
