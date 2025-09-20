const { GoogleGenerativeAI } = require('@google/generative-ai');
const firebaseService = require('./firebaseService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.datasets = {
      hypertension: null,
      diabetes: null,
      heartrisk: null
    };
  }

  async initialize() {
    try {
      // Initialize Gemini AI
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Load datasets
      await this.loadDatasets();
      
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  async loadDatasets() {
    try {
      const dataPath = path.join(__dirname, '../data');
      
      // Load each dataset
      const hypertensionData = await fs.readFile(path.join(dataPath, 'hypertension.json'), 'utf8');
      const diabetesData = await fs.readFile(path.join(dataPath, 'diabetes.json'), 'utf8');
      const heartriskData = await fs.readFile(path.join(dataPath, 'heartrisk.json'), 'utf8');
      
      this.datasets.hypertension = JSON.parse(hypertensionData);
      this.datasets.diabetes = JSON.parse(diabetesData);
      this.datasets.heartrisk = JSON.parse(heartriskData);
      
      logger.info('Health datasets loaded successfully');
    } catch (error) {
      logger.error('Failed to load datasets:', error);
      throw error;
    }
  }

  async calculateStabilityScore(userId) {
    try {
      // Get user profile and vitals history
      const user = await firebaseService.getUserById(userId);
      const vitalsHistory = await firebaseService.getVitalsHistory(userId, 30);
      
      if (vitalsHistory.length === 0) {
        return {
          score: 50,
          summary: "We don't have enough data yet to provide a comprehensive wellness score. Please continue logging your vitals to get personalized insights.",
          riskForecast: "Continue monitoring your health regularly for better analysis."
        };
      }

      // Determine relevant datasets based on user's health conditions
      const relevantDatasets = this.getRelevantDatasets(user.healthConditions);
      
      // Prepare data for AI analysis
      const analysisData = {
        userConditions: user.healthConditions,
        vitalsHistory: vitalsHistory,
        datasets: relevantDatasets,
        timeRange: '30 days'
      };

      // Create the prompt for Gemini
      const prompt = this.buildStabilityScorePrompt(analysisData);
      
      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const analysis = JSON.parse(this.extractJSON(text));
      
      logger.info(`Stability score calculated for user ${userId}: ${analysis.score}`);
      return analysis;
      
    } catch (error) {
      logger.error(`Error calculating stability score for user ${userId}:`, error);
      
      // Return fallback response
      return {
        score: 65,
        summary: "We're having difficulty analyzing your data right now. Based on your recent activities, you're maintaining a generally stable health pattern.",
        riskForecast: "Continue your current health management routine and consult with your healthcare provider regularly."
      };
    }
  }

  async generateNudges(userId) {
    try {
      // Get user profile and latest vitals
      const user = await firebaseService.getUserById(userId);
      const latestVitals = await firebaseService.getLatestVitals(userId, 3);
      
      if (latestVitals.length === 0) {
        return this.getDefaultNudges(user);
      }

      // Get relevant datasets
      const relevantDatasets = this.getRelevantDatasets(user.healthConditions);
      
      // Prepare data for nudge generation
      const nudgeData = {
        userConditions: user.healthConditions,
        latestVitals: latestVitals[0],
        recentVitals: latestVitals,
        datasets: relevantDatasets,
        userName: user.fullName.split(' ')[0]
      };

      // Create the prompt for nudge generation
      const prompt = this.buildNudgePrompt(nudgeData);
      
      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const nudges = JSON.parse(this.extractJSON(text));
      
      logger.info(`Nudges generated for user ${userId}`);
      return nudges;
      
    } catch (error) {
      logger.error(`Error generating nudges for user ${userId}:`, error);
      return this.getDefaultNudges(user);
    }
  }

  buildStabilityScorePrompt(data) {
    const datasetsText = JSON.stringify(data.datasets, null, 2);
    const vitalsText = JSON.stringify(data.vitalsHistory.slice(0, 10), null, 2); // Last 10 entries
    
    return `
You are a sophisticated health AI analyst with access to comprehensive medical datasets. Your task is to analyze a patient's vital signs using a hybrid approach: direct comparison with provided health templates and your extensive medical knowledge.

**CONTEXT:**
I have provided you with detailed JSON datasets that serve as analytical templates for ${data.userConditions.join(', ')}. These datasets show direct correlations between specific vital signs and health outcomes across three categories: Stable, At-Risk, and Critical.

**DATASETS:**
${datasetsText}

**PATIENT DATA:**
Patient Conditions: ${data.userConditions.join(', ')}
Time Period: Last ${data.timeRange}
Recent Vital Signs: ${vitalsText}

**YOUR TASK:**
1. First, compare the patient's vital signs directly against the patterns in the relevant datasets
2. Identify which category (Stable, At-Risk, Critical) their readings most closely match
3. Use your medical knowledge to refine this assessment considering trends and context
4. Generate a stability score from 0-100 based on this hybrid analysis
5. Provide a clear explanation of your reasoning
6. Forecast potential risks for the next 48-72 hours

**REQUIRED OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "score": [number between 0-100],
  "summary": "[2-3 sentences explaining the score, referencing dataset patterns where relevant]",
  "riskForecast": "[1-2 sentences about potential risks in the next 48-72 hours]"
}

Be empathetic and encouraging while being medically accurate. Focus on actionable insights.
`;
  }

  buildNudgePrompt(data) {
    const datasetsText = JSON.stringify(data.datasets, null, 2);
    const vitalsText = JSON.stringify(data.latestVitals, null, 2);
    
    return `
You are an empathetic health AI companion with access to comprehensive medical datasets. Your role is to provide personalized, supportive health recommendations.

**CONTEXT:**
Patient ${data.userName} has ${data.userConditions.join(', ')} and just logged their latest health data. You have access to medical datasets that show how their readings compare to established health patterns.

**DATASETS:**
${datasetsText}

**PATIENT'S LATEST DATA:**
${vitalsText}

**YOUR TASK:**
1. Compare their latest readings to the relevant dataset patterns
2. Identify their current health status (Stable, At-Risk, Critical) based on the data
3. Generate three personalized recommendations using your combined knowledge:
   - **Diet**: Specific, actionable nutrition advice based on their condition and latest data
   - **Personal Care**: Self-care suggestions related to their physical/mental wellbeing
   - **Social**: Connection and support recommendations

**REQUIREMENTS:**
- Be warm, supportive, and encouraging
- Make recommendations feel personal and achievable
- Reference their specific data points when relevant
- Keep suggestions practical and specific
- Use their name (${data.userName}) in a natural way

**REQUIRED OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "diet": "[Specific dietary recommendation based on their latest readings]",
  "personalCare": "[Self-care suggestion related to their current health status]",
  "social": "[Social connection or support recommendation]"
}

Make each recommendation feel personal and directly relevant to their health journey.
`;
  }

  getRelevantDatasets(healthConditions) {
    const datasets = {};
    
    // Map health conditions to datasets
    const conditionMappings = {
      'Hypertension': 'hypertension',
      'Type 2 Diabetes': 'diabetes',
      'Type 1 Diabetes': 'diabetes',
      'Heart Disease': 'heartrisk',
      'Cardiac Risk': 'heartrisk'
    };
    
    // Include relevant datasets
    healthConditions.forEach(condition => {
      const datasetKey = conditionMappings[condition];
      if (datasetKey && this.datasets[datasetKey]) {
        datasets[condition] = this.datasets[datasetKey];
      }
    });
    
    // If no specific datasets match, include hypertension as a general cardiovascular reference
    if (Object.keys(datasets).length === 0) {
      datasets['General Health'] = this.datasets.hypertension;
    }
    
    return datasets;
  }

  extractJSON(text) {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    // If no JSON found, try to clean up the text
    let cleaned = text.trim();
    if (!cleaned.startsWith('{')) {
      const startIndex = cleaned.indexOf('{');
      if (startIndex !== -1) {
        cleaned = cleaned.substring(startIndex);
      }
    }
    
    if (!cleaned.endsWith('}')) {
      const endIndex = cleaned.lastIndexOf('}');
      if (endIndex !== -1) {
        cleaned = cleaned.substring(0, endIndex + 1);
      }
    }
    
    return cleaned;
  }

  getDefaultNudges(user) {
    const firstName = user?.fullName?.split(' ')[0] || 'Friend';
    
    return {
      diet: `Hi ${firstName}! Since you're managing ${user.healthConditions.join(' and ')}, focus on whole foods today. Try adding some leafy greens or a piece of fruit to your next meal.`,
      personalCare: `Take a moment for yourself today, ${firstName}. Even 5 minutes of deep breathing can help manage stress and support your overall health.`,
      social: `Consider reaching out to a friend or family member today. Social connections are wonderful for both mental and physical wellbeing, especially when managing health conditions.`
    };
  }

  // Method to get dashboard insights combining multiple AI analyses
  async getDashboardInsights(userId) {
    try {
      const [stabilityScore, nudges] = await Promise.all([
        this.calculateStabilityScore(userId),
        this.generateNudges(userId)
      ]);
      
      return {
        stabilityScore,
        nudges,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error getting dashboard insights for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new AIService();