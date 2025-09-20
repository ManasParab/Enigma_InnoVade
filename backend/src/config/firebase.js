const admin = require('firebase-admin');
const logger = require('../utils/logger');

class FirebaseConfig {
  constructor() {
    this.admin = admin;
    this.db = null;
    this.auth = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      logger.warn('Firebase Admin SDK already initialized');
      return;
    }

    try {
      // Validate required environment variables
      const requiredEnvVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Parse the private key properly to handle newlines
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      // Service account configuration
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      // Initialize services
      this.db = admin.firestore();
      this.auth = admin.auth();
      this.isInitialized = true;

      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  // Get Firestore instance
  getFirestore() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Get Auth instance  
  getAuth() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  // Verify ID token
  async verifyIdToken(idToken) {
    try {
      if (!idToken) {
        throw new Error('ID token is required');
      }

      const decodedToken = await this.auth.verifyIdToken(idToken);
      logger.info(`Token verified for user: ${decodedToken.uid}`);
      
      return decodedToken;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw error;
    }
  }

  // Create a new user
  async createUser(userData) {
    try {
      const { email, password, displayName } = userData;

      // Create user in Firebase Auth
      const userRecord = await this.auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      logger.info(`User created successfully: ${userRecord.uid}`);
      return userRecord;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const userRecord = await this.auth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(uid) {
    try {
      await this.auth.deleteUser(uid);
      logger.info(`User deleted successfully: ${uid}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Custom token creation (if needed)
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      const customToken = await this.auth.createCustomToken(uid, additionalClaims);
      logger.info(`Custom token created for user: ${uid}`);
      return customToken;
    } catch (error) {
      logger.error('Error creating custom token:', error);
      throw error;
    }
  }
}

// Export singleton instance
const firebaseConfig = new FirebaseConfig();

module.exports = firebaseConfig;