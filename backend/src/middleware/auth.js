const firebaseService = require('../services/firebaseService');
const logger = require('../utils/logger');

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }
    
    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    // Verify the token with Firebase
    const decodedToken = await firebaseService.verifyIdToken(token);
    
    // Get user data from Firestore
    const user = await firebaseService.getUserById(decodedToken.uid);
    
    // Attach user information to request
    req.user = user;
    req.userId = decodedToken.uid;
    req.decodedToken = decodedToken;
    
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    // Handle different types of authentication errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please log in again.',
        code: 'TOKEN_REVOKED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Generic authentication error
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.',
      code: 'AUTH_FAILED'
    });
  }
};

// Optional middleware that doesn't fail if no token is provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      req.userId = null;
      req.isAuthenticated = false;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      req.userId = null;
      req.isAuthenticated = false;
      return next();
    }
    
    // Try to verify the token
    const decodedToken = await firebaseService.verifyIdToken(token);
    const user = await firebaseService.getUserById(decodedToken.uid);
    
    req.user = user;
    req.userId = decodedToken.uid;
    req.decodedToken = decodedToken;
    req.isAuthenticated = true;
    
    next();
  } catch (error) {
    logger.warn('Optional authentication failed:', error);
    
    // Don't fail the request, just set unauthenticated state
    req.user = null;
    req.userId = null;
    req.isAuthenticated = false;
    next();
  }
};

// Middleware to check if user has specific health conditions
const requireHealthConditions = (requiredConditions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.healthConditions) {
      return res.status(403).json({
        success: false,
        message: 'Health profile information is required for this feature'
      });
    }
    
    const userConditions = req.user.healthConditions;
    const hasRequiredCondition = requiredConditions.some(condition => 
      userConditions.includes(condition)
    );
    
    if (!hasRequiredCondition) {
      return res.status(403).json({
        success: false,
        message: `This feature requires one of the following health conditions: ${requiredConditions.join(', ')}`
      });
    }
    
    next();
  };
};

// Middleware to ensure user profile is complete
const requireCompleteProfile = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  const requiredFields = ['fullName', 'email'];
  const missingFields = requiredFields.filter(field => 
    !req.user[field] || req.user[field].trim() === ''
  );
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Profile incomplete. Please complete your profile.',
      missingFields
    });
  }
  
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireHealthConditions,
  requireCompleteProfile
};