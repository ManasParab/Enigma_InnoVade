const express = require('express');
const router = express.Router();
const firebaseConfig = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).max(100).required(),
  healthConditions: Joi.array().items(Joi.string()).default([])
});

const loginSchema = Joi.object({
  idToken: Joi.string().required()
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

// POST /api/register - Register a new user
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { email, password, fullName, healthConditions } = req.validatedData;
    
    logger.info(`Registration attempt for email: ${email}`);
    
    // Create user in Firebase Auth
    const userRecord = await firebaseConfig.createUser({
      email,
      password,
      displayName: fullName
    });
    
    // Store additional user data in Firestore
    const db = firebaseConfig.getFirestore();
    const userDoc = {
      uid: userRecord.uid,
      email: userRecord.email,
      fullName,
      healthConditions: healthConditions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: true,
      emailVerified: false
    };
    
    await db.collection('users').doc(userRecord.uid).set(userDoc);
    
    logger.info(`User registered successfully: ${userRecord.uid}`);
    
    // Return user data (without sensitive information)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName,
        healthConditions: healthConditions || [],
        emailVerified: userRecord.emailVerified,
        createdAt: userDoc.createdAt
      }
    });
    
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS'
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format',
        code: 'INVALID_EMAIL'
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'Password is too weak. Please choose a stronger password',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// POST /api/login - Verify Firebase ID token and return user data
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { idToken } = req.validatedData;
    
    logger.info('Login attempt with Firebase ID token');
    
    // Verify the ID token
    const decodedToken = await firebaseConfig.verifyIdToken(idToken);
    
    // Get user data from Firestore
    const db = firebaseConfig.getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      // User exists in Auth but not in Firestore - create basic profile
      const basicUserDoc = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        fullName: decodedToken.name || '',
        healthConditions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        profileComplete: false,
        emailVerified: decodedToken.email_verified
      };
      
      await db.collection('users').doc(decodedToken.uid).set(basicUserDoc);
      
      return res.json({
        success: true,
        message: 'Login successful - profile setup needed',
        data: {
          user: basicUserDoc,
          token: {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            exp: decodedToken.exp
          },
          profileComplete: false
        }
      });
    }
    
    const userData = userDoc.data();
    
    // Update last login time
    await db.collection('users').doc(decodedToken.uid).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });
    
    logger.info(`Login successful for user: ${decodedToken.uid}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: userData.uid,
          email: userData.email,
          fullName: userData.fullName,
          healthConditions: userData.healthConditions || [],
          profileComplete: userData.profileComplete !== false,
          emailVerified: decodedToken.email_verified,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt
        },
        token: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          exp: decodedToken.exp
        }
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token provided.',
        code: 'TOKEN_INVALID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      code: 'LOGIN_FAILED'
    });
  }
});

// GET /api/profile - Get user profile (protected route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user data from Firestore
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
    
    res.json({
      success: true,
      data: {
        user: {
          uid: userData.uid,
          email: userData.email,
          fullName: userData.fullName,
          healthConditions: userData.healthConditions || [],
          profileComplete: userData.profileComplete !== false,
          emailVerified: req.user.emailVerified,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          lastLoginAt: userData.lastLoginAt
        }
      }
    });
    
  } catch (error) {
    logger.error('Get profile error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

// POST /api/logout - Logout (mainly for logging)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Update last logout time in Firestore
    const db = firebaseConfig.getFirestore();
    await db.collection('users').doc(userId).update({
      lastLogoutAt: new Date()
    });
    
    logger.info(`User logged out: ${userId}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    logger.error('Logout error:', error);
    
    // Don't fail logout for database errors
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

module.exports = router;
