import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Auth } from 'aws-amplify';

class BedrockAIService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Get current user credentials
      const credentials = await Auth.currentCredentials();
      
      this.client = new BedrockRuntimeClient({
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
        credentials: Auth.essentialCredentials(credentials)
      });
      
      this.initialized = true;
      console.log('✅ Bedrock AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Bedrock AI Service:', error);
      throw error;
    }
  }

  async generateDatasetRecommendations(userInput, availableDatasets, conversationHistory = []) {
    await this.initialize();
    
    try {
      const prompt = this.buildPrompt(userInput, availableDatasets, conversationHistory);
      
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0", // Using Claude Haiku for faster responses
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.9
        })
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseResponse(responseBody.content[0].text, availableDatasets);
    } catch (error) {
      console.error('Error calling Bedrock:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  buildPrompt(userInput, availableDatasets, conversationHistory) {
    const datasetInfo = availableDatasets.map(dataset => ({
      id: dataset.id,
      name: dataset.name,
      source: dataset.source,
      fileCount: dataset.fileCount,
      size: Math.round(dataset.size / 1024 / 1024), // MB
      files: dataset.files?.slice(0, 3).map(f => f.name) || [] // First 3 filenames for context
    }));

    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation context:\n${conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}`
      : '';

    return `You are an AI assistant specializing in psychology research datasets. Be concise and helpful.

User's current input: "${userInput}"
${conversationContext}

Available datasets:
${JSON.stringify(datasetInfo, null, 2)}

Provide a brief, focused response that:
1. Acknowledges their research interest
2. Asks 1-2 key clarifying questions (keep it short)
3. Suggests relevant datasets with clear reasons
4. Uses a friendly but concise tone

Keep your response under 100 words. Be direct and actionable.

Your response should be in this JSON format:
{
  "response": "Brief conversational response here",
  "recommendedDatasets": [
    {
      "datasetId": "dataset_id_here",
      "relevanceScore": 0.95,
      "reasons": ["reason 1", "reason 2"]
    }
  ],
  "followUpQuestions": ["question 1", "question 2"],
  "researchAreas": ["detected_area_1", "detected_area_2"]
}

Focus on being helpful but concise.`;
  }

  parseResponse(responseText, availableDatasets) {
    try {
      console.log('Raw response from Claude:', responseText);
      
      // Try to extract JSON from the response if it's wrapped in text
      let jsonString = responseText;
      
      // Look for JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      // Try to parse JSON response
      const parsed = JSON.parse(jsonString);
      console.log('Parsed JSON:', parsed);
      
      // Validate and enhance recommendations with full dataset objects
      const recommendations = parsed.recommendedDatasets?.map(rec => {
        const dataset = availableDatasets.find(d => d.id === rec.datasetId);
        if (dataset) {
          return {
            dataset,
            score: rec.relevanceScore || 0.5,
            reasons: rec.reasons || ['AI recommended']
          };
        }
        return null;
      }).filter(Boolean) || [];

      return {
        response: parsed.response || "I'd be happy to help you find relevant datasets for your psychology research!",
        recommendations,
        followUpQuestions: parsed.followUpQuestions || [],
        researchAreas: parsed.researchAreas || []
      };
    } catch (error) {
      console.warn('Could not parse structured response, using fallback:', error);
      console.warn('Raw response was:', responseText);
      
      // Fallback to simple text response - but clean it up if it looks like JSON
      let cleanResponse = responseText;
      if (responseText.includes('"response":')) {
        // If it looks like JSON but failed to parse, try to extract just the response text
        const responseMatch = responseText.match(/"response":\s*"([^"]+)"/);
        if (responseMatch) {
          cleanResponse = responseMatch[1];
        }
      }
      
      return {
        response: cleanResponse || "I'd be happy to help you find relevant datasets for your research!",
        recommendations: [],
        followUpQuestions: [],
        researchAreas: []
      };
    }
  }

  async analyzeResearchNeeds(userInput) {
    await this.initialize();
    
    const prompt = `Analyze this psychology research description and extract key information:

"${userInput}"

Respond with JSON containing:
{
  "researchAreas": ["area1", "area2"],
  "methodologies": ["method1", "method2"],
  "dataTypes": ["type1", "type2"],
  "populations": ["population1", "population2"],
  "keywords": ["keyword1", "keyword2"]
}

Focus on psychology research domains like clinical, cognitive, social, developmental, etc.`;

    try {
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return JSON.parse(responseBody.content[0].text);
    } catch (error) {
      console.error('Error analyzing research needs:', error);
      return {
        researchAreas: [],
        methodologies: [],
        dataTypes: [],
        populations: [],
        keywords: []
      };
    }
  }

  // Test connection to Bedrock
  async testConnection() {
    try {
      await this.initialize();
      
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 50,
          messages: [{ role: "user", content: "Hello, please respond with 'Connection successful'" }],
          temperature: 0.1
        })
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log('✅ Bedrock connection test successful:', responseBody.content[0].text);
      return true;
    } catch (error) {
      console.error('❌ Bedrock connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
const bedrockAIService = new BedrockAIService();
export default bedrockAIService;
