const admin = require('firebase-admin');
const logger = require('../utils/logger');

class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
  }

  initialize() {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      this.db = admin.firestore();
      this.auth = admin.auth();
      
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  // User Management
  async createUser(userData) {
    try {
      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.fullName,
      });

      // Store additional user data in Firestore
      const userDoc = {
        id: userRecord.uid,
        email: userData.email,
        fullName: userData.fullName,
        healthConditions: userData.healthConditions || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('users').doc(userRecord.uid).set(userDoc);
      
      logger.info(`User created successfully: ${userRecord.uid}`);
      return { ...userDoc, id: userRecord.uid };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      logger.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const updatePayload = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('users').doc(userId).update(updatePayload);
      logger.info(`User updated successfully: ${userId}`);
      
      return await this.getUserById(userId);
    } catch (error) {
      logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  // Vitals Management
  async logVitals(userId, vitalsData) {
    try {
      const vitalsDoc = {
        userId,
        ...vitalsData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db
        .collection('users')
        .doc(userId)
        .collection('vitals')
        .add(vitalsDoc);

      logger.info(`Vitals logged successfully for user ${userId}: ${docRef.id}`);
      return { id: docRef.id, ...vitalsDoc };
    } catch (error) {
      logger.error(`Error logging vitals for user ${userId}:`, error);
      throw error;
    }
  }

  async getVitalsHistory(userId, days = 30, limit = 100) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const vitalsQuery = await this.db
        .collection('users')
        .doc(userId)
        .collection('vitals')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const vitals = [];
      vitalsQuery.forEach(doc => {
        const data = doc.data();
        vitals.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });

      logger.info(`Retrieved ${vitals.length} vitals records for user ${userId}`);
      return vitals;
    } catch (error) {
      logger.error(`Error getting vitals history for user ${userId}:`, error);
      throw error;
    }
  }

  async getLatestVitals(userId, count = 1) {
    try {
      const vitalsQuery = await this.db
        .collection('users')
        .doc(userId)
        .collection('vitals')
        .orderBy('timestamp', 'desc')
        .limit(count)
        .get();

      const vitals = [];
      vitalsQuery.forEach(doc => {
        const data = doc.data();
        vitals.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });

      logger.info(`Retrieved ${vitals.length} latest vitals for user ${userId}`);
      return vitals;
    } catch (error) {
      logger.error(`Error getting latest vitals for user ${userId}:`, error);
      throw error;
    }
  }

  // Token Verification
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      logger.info(`Token verified for user: ${decodedToken.uid}`);
      return decodedToken;
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw error;
    }
  }

  // Analytics and Dashboard Support
  async getVitalsStats(userId, days = 30) {
    try {
      const vitals = await this.getVitalsHistory(userId, days);
      
      if (vitals.length === 0) {
        return null;
      }

      const stats = {
        totalEntries: vitals.length,
        dateRange: {
          start: vitals[vitals.length - 1]?.timestamp,
          end: vitals[0]?.timestamp
        },
        averages: {},
        trends: {}
      };

      // Calculate averages for numeric fields
      const numericFields = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'weight', 'temperature'];
      
      numericFields.forEach(field => {
        const values = vitals
          .map(v => parseFloat(v[field]))
          .filter(val => !isNaN(val) && val > 0);
        
        if (values.length > 0) {
          stats.averages[field] = {
            value: values.reduce((sum, val) => sum + val, 0) / values.length,
            count: values.length
          };
        }
      });

      return stats;
    } catch (error) {
      logger.error(`Error getting vitals stats for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();