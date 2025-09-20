const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiConfig {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      logger.warn('Gemini AI already initialized');
      return;
    }

    try {
      // Validate API key
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }

      // Initialize Gemini AI
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Get the generative model
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      this.isInitialized = true;
      logger.info('Gemini AI initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gemini AI:', error);
      throw new Error(`Gemini AI initialization failed: ${error.message}`);
    }
  }

  // Generate content with error handling
  async generateContent(prompt) {
    try {
      if (!this.isInitialized) {
        throw new Error('Gemini AI not initialized. Call initialize() first.');
      }

      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Valid prompt string is required');
      }

      logger.info('Generating content with Gemini AI');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info('Content generated successfully');
      return text;
    } catch (error) {
      logger.error('Error generating content:', error);
      
      // Handle specific Gemini API errors
      if (error.message.includes('API key')) {
        throw new Error('Invalid Gemini API key');
      }
      
      if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded');
      }
      
      if (error.message.includes('blocked')) {
        throw new Error('Content was blocked by safety filters');
      }

      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }

  // Generate health analysis with structured prompt
  async generateHealthAnalysis(userPrompt, context = {}) {
    try {
      const structuredPrompt = this.buildHealthAnalysisPrompt(userPrompt, context);
      return await this.generateContent(structuredPrompt);
    } catch (error) {
      logger.error('Error generating health analysis:', error);
      throw error;
    }
  }

  // Build structured prompt for health analysis
  buildHealthAnalysisPrompt(userPrompt, context) {
    const { userConditions = [], vitalsData = {}, analysisType = 'general' } = context;
    
    let prompt = `You are a knowledgeable health AI assistant specializing in personalized health insights. 
    
Context:
- User has the following health conditions: ${userConditions.length > 0 ? userConditions.join(', ') : 'None specified'}
- Analysis type: ${analysisType}
- Latest vital signs: ${JSON.stringify(vitalsData, null, 2)}

Guidelines:
- Provide empathetic, supportive, and encouraging responses
- Base recommendations on evidence-based health practices
- Always suggest consulting healthcare professionals for serious concerns
- Keep responses conversational and easy to understand
- Focus on actionable, practical advice

User Request: ${userPrompt}

Please provide a helpful, personalized response based on the context provided.`;

    return prompt;
  }

  // Generate personalized health recommendations
  async generateRecommendations(vitalsData, userConditions) {
    try {
      const prompt = `Based on the following health data, provide 3 personalized recommendations:
      
Health Conditions: ${userConditions.join(', ') || 'General wellness'}
Recent Vitals: ${JSON.stringify(vitalsData, null, 2)}

Please provide recommendations for:
1. Diet and nutrition
2. Physical activity and self-care
3. Lifestyle and mental wellbeing

Format your response as a JSON object with keys: "diet", "activity", "lifestyle"`;

      const response = await this.generateContent(prompt);
      
      // Try to parse JSON response
      try {
        return JSON.parse(response);
      } catch (parseError) {
        logger.warn('Failed to parse JSON response, returning raw text');
        return {
          diet: response,
          activity: "Continue regular physical activity as approved by your healthcare provider.",
          lifestyle: "Maintain consistent sleep schedule and stress management practices."
        };
      }
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Generate wellness score analysis
  async generateWellnessScore(vitalsHistory, userConditions) {
    try {
      const prompt = `Analyze the following health data and provide a wellness score (0-100) with explanation:

Health Conditions: ${userConditions.join(', ') || 'General wellness'}
Vitals History (last 30 days): ${JSON.stringify(vitalsHistory.slice(0, 10), null, 2)}

Please analyze the trends and patterns, then provide:
1. A wellness score from 0-100
2. A brief explanation of the score
3. Key observations about health trends
4. Risk assessment for the next 48-72 hours

Format as JSON: {"score": number, "explanation": "string", "trends": "string", "riskAssessment": "string"}`;

      const response = await this.generateContent(prompt);
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        logger.warn('Failed to parse wellness score response');
        return {
          score: 75,
          explanation: "Unable to analyze data at this time. Continue monitoring your health regularly.",
          trends: "Keep logging your vitals for better insights.",
          riskAssessment: "Maintain current health practices and consult your healthcare provider regularly."
        };
      }
    } catch (error) {
      logger.error('Error generating wellness score:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const testPrompt = "Hello, please respond with 'Gemini AI is working correctly'";
      const response = await this.generateContent(testPrompt);
      return response.includes('working correctly');
    } catch (error) {
      logger.error('Gemini AI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const geminiConfig = new GeminiConfig();

module.exports = geminiConfig;