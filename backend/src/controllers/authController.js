const firebaseService = require('../services/firebaseService');
const logger = require('../utils/logger');

class AuthController {
  // Register a new user
  async register(req, res) {
    try {
      const { email, password, fullName, healthConditions } = req.validatedData;
      
      // Create user in Firebase Auth and Firestore
      const user = await firebaseService.createUser({
        email,
        password,
        fullName,
        healthConditions
      });
      
      // Remove sensitive information from response
      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        healthConditions: user.healthConditions,
        createdAt: user.createdAt
      };
      
      logger.info(`User registered successfully: ${user.email}`);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse
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
  }
  
  // Get user profile (requires authentication)
  async getProfile(req, res) {
    try {
      const user = req.user;
      
      // Format response without sensitive data
      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        healthConditions: user.healthConditions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json({
        success: true,
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile'
      });
    }
  }
  
  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const updateData = req.validatedData;
      
      // Remove fields that shouldn't be updated via this endpoint
      delete updateData.email;
      delete updateData.password;
      
      const updatedUser = await firebaseService.updateUser(userId, updateData);
      
      // Format response
      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        healthConditions: updatedUser.healthConditions,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      logger.info(`User profile updated: ${userId}`);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
  
  // Check if user exists (public endpoint for frontend validation)
  async checkUser(req, res) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }
      
      try {
        // Try to get user by email from Firebase Auth
        const userRecord = await firebaseService.auth.getUserByEmail(email);
        
        res.json({
          success: true,
          data: {
            exists: true,
            uid: userRecord.uid
          }
        });
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          res.json({
            success: true,
            data: {
              exists: false
            }
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Check user error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to check user status'
      });
    }
  }
  
  // Logout (mainly for logging purposes - token invalidation happens on client)
  async logout(req, res) {
    try {
      const userId = req.userId;
      
      logger.info(`User logged out: ${userId}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
  
  // Delete user account (requires authentication)
  async deleteAccount(req, res) {
    try {
      const userId = req.userId;
      
      // Delete user from Firebase Auth
      await firebaseService.auth.deleteUser(userId);
      
      // Note: Firestore data will be deleted automatically via Firebase rules
      // or you can implement cascade deletion here if needed
      
      logger.info(`User account deleted: ${userId}`);
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
}

module.exports = new AuthController();