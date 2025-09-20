const express = require('express');
const router = express.Router();
const geminiConfig = require('../config/gemini');
const firebaseConfig = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const promptSchema = Joi.object({
  prompt: Joi.string().min(1).max(2000).required(),
  context: Joi.object({
    analysisType: Joi.string().valid('general', 'health', 'wellness', 'recommendations').default('general'),
    includeVitals: Joi.boolean().default(false),
    vitalsDays: Joi.number().integer().min(1).max(90).default(7)
  }).default({})
});

const healthAnalysisSchema = Joi.object({
  analysisType: Joi.string().valid('wellness-score', 'recommendations', 'risk-assessment').required(),
  days: Joi.number().integer().min(1).max(90).default(30)
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.validatedData = value;
    next();
  };
};

// POST /api/gemini-prompt - General Gemini AI interaction (protected route)
router.post('/gemini-prompt', verifyToken, validateRequest(promptSchema), async (req, res) => {
  try {
    const { prompt, context } = req.validatedData;
    const userId = req.userId;
    
    logger.info(`Gemini AI request from user: ${userId}`);
    
    // Get user data for context
    const db = firebaseConfig.getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    const userData = userDoc.data();
    let enhancedContext = {
      userConditions: userData.healthConditions || [],
      ...context
    };
    
    // Include recent vitals if requested
    if (context.includeVitals) {
      const vitalsQuery = await db
        .collection('users')
        .doc(userId)
        .collection('vitals')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      const recentVitals = [];
      vitalsQuery.forEach(doc => {
        const data = doc.data();
        recentVitals.push({
          id: doc.id,
          bloodPressureSystolic: data.bloodPressureSystolic,
          bloodPressureDiastolic: data.bloodPressureDiastolic,
          heartRate: data.heartRate,
          weight: data.weight,
          temperature: data.temperature,
          mood: data.mood,
          createdAt: data.createdAt
        });
      });
      
      enhancedContext.vitalsData = recentVitals;
    }
    
    // Generate AI response
    const aiResponse = await geminiConfig.generateHealthAnalysis(prompt, enhancedContext);
    
    logger.info(`Gemini AI response generated for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        response: aiResponse,
        context: {
          analysisType: context.analysisType,
          includeVitals: context.includeVitals,
          userConditions: userData.healthConditions || []
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Gemini AI prompt error:', error);
    
    // Handle specific AI errors
    if (error.message.includes('quota')) {
      return res.status(429).json({
        success: false,
        message: 'AI service temporarily unavailable due to quota limits',
        code: 'AI_QUOTA_EXCEEDED'
      });
    }
    
    if (error.message.includes('blocked')) {
      return res.status(400).json({
        success: false,
        message: 'Content was blocked by safety filters',
        code: 'CONTENT_BLOCKED'
      });
    }
    
    if (error.message.includes('API key')) {
      return res.status(503).json({
        success: false,
        message: 'AI service configuration error',
        code: 'AI_CONFIG_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response. Please try again.',
      code: 'AI_GENERATION_FAILED'
    });
  }
});

// POST /api/health-analysis - Structured health analysis (protected route)
router.post('/health-analysis', verifyToken, validateRequest(healthAnalysisSchema), async (req, res) => {
  try {
    const { analysisType, days } = req.validatedData;
    const userId = req.userId;
    
    logger.info(`Health analysis request: ${analysisType} for user: ${userId}`);
    
    // Get user data and vitals
    const db = firebaseConfig.getFirestore();
    const [userDoc, vitalsQuery] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('users')
        .doc(userId)
        .collection('vitals')
        .orderBy('createdAt', 'desc')
        .limit(Math.min(days, 30)) // Limit to prevent large queries
        .get()
    ]);
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    const userData = userDoc.data();
    const vitalsHistory = [];
    
    vitalsQuery.forEach(doc => {
      const data = doc.data();
      vitalsHistory.push({
        id: doc.id,
        bloodPressureSystolic: data.bloodPressureSystolic,
        bloodPressureDiastolic: data.bloodPressureDiastolic,
        heartRate: data.heartRate,
        weight: data.weight,
        temperature: data.temperature,
        mood: data.mood,
        notes: data.notes,
        createdAt: data.createdAt
      });
    });
    
    let analysisResult;
    
    // Generate analysis based on type
    switch (analysisType) {
      case 'wellness-score':
        analysisResult = await geminiConfig.generateWellnessScore(
          vitalsHistory, 
          userData.healthConditions || []
        );
        break;
        
      case 'recommendations':
        const latestVitals = vitalsHistory.length > 0 ? vitalsHistory[0] : {};
        analysisResult = await geminiConfig.generateRecommendations(
          latestVitals,
          userData.healthConditions || []
        );
        break;
        
      case 'risk-assessment':
        const riskPrompt = `Assess health risks based on recent data for user with ${userData.healthConditions?.join(', ') || 'general health'}. Recent vitals: ${JSON.stringify(vitalsHistory.slice(0, 5), null, 2)}. Provide risk level (low/moderate/high) and recommendations.`;
        const riskResponse = await geminiConfig.generateContent(riskPrompt);
        analysisResult = { assessment: riskResponse };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis type',
          code: 'INVALID_ANALYSIS_TYPE'
        });
    }
    
    logger.info(`Health analysis completed: ${analysisType} for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        analysisType,
        result: analysisResult,
        dataPoints: vitalsHistory.length,
        period: `${days} days`,
        userConditions: userData.healthConditions || [],
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Health analysis error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete health analysis. Please try again.',
      code: 'ANALYSIS_FAILED'
    });
  }
});

// GET /api/ai-status - Check AI service status
router.get('/ai-status', async (req, res) => {
  try {
    const isWorking = await geminiConfig.testConnection();
    
    res.json({
      success: true,
      data: {
        aiService: 'Gemini AI',
        status: isWorking ? 'operational' : 'unavailable',
        initialized: geminiConfig.isInitialized,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('AI status check error:', error);
    
    res.json({
      success: true,
      data: {
        aiService: 'Gemini AI',
        status: 'error',
        initialized: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;