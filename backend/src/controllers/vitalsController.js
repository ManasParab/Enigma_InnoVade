const firebaseService = require('../services/firebaseService');
const logger = require('../utils/logger');

class VitalsController {
  // Log new vitals entry
  async logVitals(req, res) {
    try {
      const userId = req.userId;
      const vitalsData = req.validatedData;
      
      // Convert date string to Date object if needed
      if (vitalsData.date && typeof vitalsData.date === 'string') {
        vitalsData.date = new Date(vitalsData.date);
      }
      
      // Save vitals to Firestore
      const savedVitals = await firebaseService.logVitals(userId, vitalsData);
      
      // Format response
      const vitalsResponse = {
        id: savedVitals.id,
        date: vitalsData.date,
        bloodPressureSystolic: vitalsData.bloodPressureSystolic || null,
        bloodPressureDiastolic: vitalsData.bloodPressureDiastolic || null,
        heartRate: vitalsData.heartRate || null,
        weight: vitalsData.weight || null,
        temperature: vitalsData.temperature || null,
        mood: vitalsData.mood || null,
        notes: vitalsData.notes || null,
        timestamp: savedVitals.timestamp
      };
      
      logger.info(`Vitals logged successfully for user ${userId}`);
      
      res.status(201).json({
        success: true,
        message: 'Vitals logged successfully',
        data: {
          vitals: vitalsResponse
        }
      });
    } catch (error) {
      logger.error(`Error logging vitals for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to log vitals. Please try again.'
      });
    }
  }
  
  // Get vitals history
  async getVitalsHistory(req, res) {
    try {
      const userId = req.userId;
      const { days = 30, limit = 100 } = req.validatedQuery || req.query;
      
      // Get vitals history from Firestore
      const vitalsHistory = await firebaseService.getVitalsHistory(
        userId, 
        parseInt(days), 
        parseInt(limit)
      );
      
      // Format response
      const formattedVitals = vitalsHistory.map(vital => ({
        id: vital.id,
        date: vital.date || vital.timestamp,
        bloodPressureSystolic: vital.bloodPressureSystolic || null,
        bloodPressureDiastolic: vital.bloodPressureDiastolic || null,
        heartRate: vital.heartRate || null,
        weight: vital.weight || null,
        temperature: vital.temperature || null,
        mood: vital.mood || null,
        notes: vital.notes || null,
        timestamp: vital.timestamp
      }));
      
      res.json({
        success: true,
        data: {
          vitals: formattedVitals,
          total: formattedVitals.length,
          period: `${days} days`
        }
      });
    } catch (error) {
      logger.error(`Error getting vitals history for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vitals history'
      });
    }
  }
  
  // Get latest vitals entry
  async getLatestVitals(req, res) {
    try {
      const userId = req.userId;
      const { count = 1 } = req.query;
      
      // Get latest vitals from Firestore
      const latestVitals = await firebaseService.getLatestVitals(
        userId, 
        parseInt(count)
      );
      
      if (latestVitals.length === 0) {
        return res.json({
          success: true,
          data: {
            vitals: null,
            message: 'No vitals data found. Start logging to see your health insights!'
          }
        });
      }
      
      // Format response
      const formattedVitals = latestVitals.map(vital => ({
        id: vital.id,
        date: vital.date || vital.timestamp,
        bloodPressureSystolic: vital.bloodPressureSystolic || null,
        bloodPressureDiastolic: vital.bloodPressureDiastolic || null,
        heartRate: vital.heartRate || null,
        weight: vital.weight || null,
        temperature: vital.temperature || null,
        mood: vital.mood || null,
        notes: vital.notes || null,
        timestamp: vital.timestamp
      }));
      
      const response = count === 1 ? formattedVitals[0] : formattedVitals;
      
      res.json({
        success: true,
        data: {
          vitals: response
        }
      });
    } catch (error) {
      logger.error(`Error getting latest vitals for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest vitals'
      });
    }
  }
  
  // Get vitals statistics and trends
  async getVitalsStats(req, res) {
    try {
      const userId = req.userId;
      const { days = 30 } = req.validatedQuery || req.query;
      
      // Get vitals statistics from Firestore
      const stats = await firebaseService.getVitalsStats(userId, parseInt(days));
      
      if (!stats) {
        return res.json({
          success: true,
          data: {
            stats: null,
            message: 'Not enough data for statistics. Keep logging to see trends!'
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          stats,
          period: `${days} days`
        }
      });
    } catch (error) {
      logger.error(`Error getting vitals stats for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vitals statistics'
      });
    }
  }
  
  // Get chart data for dashboard
  async getChartData(req, res) {
    try {
      const userId = req.userId;
      const { days = 30, type = 'all' } = req.query;
      
      // Get vitals history
      const vitalsHistory = await firebaseService.getVitalsHistory(
        userId, 
        parseInt(days), 
        100
      );
      
      if (vitalsHistory.length === 0) {
        return res.json({
          success: true,
          data: {
            chartData: [],
            message: 'No data available for charts'
          }
        });
      }
      
      // Process data for charts
      const chartData = vitalsHistory
        .reverse() // Show oldest to newest for time series
        .map(vital => {
          const date = vital.timestamp || vital.date;
          const formattedDate = date instanceof Date 
            ? date.toISOString().split('T')[0] 
            : date;
            
          const dataPoint = {
            date: formattedDate,
            timestamp: vital.timestamp
          };
          
          // Include requested data types
          if (type === 'all' || type === 'bloodPressure') {
            dataPoint.bloodPressureSystolic = vital.bloodPressureSystolic || null;
            dataPoint.bloodPressureDiastolic = vital.bloodPressureDiastolic || null;
          }
          
          if (type === 'all' || type === 'heartRate') {
            dataPoint.heartRate = vital.heartRate || null;
          }
          
          if (type === 'all' || type === 'weight') {
            dataPoint.weight = vital.weight || null;
          }
          
          if (type === 'all' || type === 'temperature') {
            dataPoint.temperature = vital.temperature || null;
          }
          
          if (type === 'all' || type === 'mood') {
            dataPoint.mood = vital.mood || null;
          }
          
          return dataPoint;
        })
        .filter(dataPoint => {
          // Filter out entries with no relevant data
          const hasData = Object.keys(dataPoint)
            .filter(key => !['date', 'timestamp'].includes(key))
            .some(key => dataPoint[key] !== null && dataPoint[key] !== undefined);
          return hasData;
        });
      
      res.json({
        success: true,
        data: {
          chartData,
          total: chartData.length,
          period: `${days} days`,
          type
        }
      });
    } catch (error) {
      logger.error(`Error getting chart data for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chart data'
      });
    }
  }
  
  // Delete a vitals entry
  async deleteVitals(req, res) {
    try {
      const userId = req.userId;
      const { vitalsId } = req.params;
      
      if (!vitalsId) {
        return res.status(400).json({
          success: false,
          message: 'Vitals ID is required'
        });
      }
      
      // Delete from Firestore
      await firebaseService.db
        .collection('users')
        .doc(userId)
        .collection('vitals')
        .doc(vitalsId)
        .delete();
      
      logger.info(`Vitals entry deleted: ${vitalsId} for user ${userId}`);
      
      res.json({
        success: true,
        message: 'Vitals entry deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting vitals for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete vitals entry'
      });
    }
  }
}

module.exports = new VitalsController();