const firebaseService = require('../services/firebaseService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

class DashboardController {
  // Get complete dashboard data
  async getDashboard(req, res) {
    try {
      const userId = req.userId;
      const { days = 30 } = req.validatedQuery || req.query;
      
      logger.info(`Getting dashboard data for user ${userId}`);
      
      // Execute all data fetching operations in parallel for better performance
      const [
        user,
        vitalsHistory,
        vitalsStats,
        aiInsights
      ] = await Promise.allSettled([
        firebaseService.getUserById(userId),
        firebaseService.getVitalsHistory(userId, parseInt(days)),
        firebaseService.getVitalsStats(userId, parseInt(days)),
        aiService.getDashboardInsights(userId)
      ]);
      
      // Handle any failed promises gracefully
      const userData = user.status === 'fulfilled' ? user.value : null;
      const vitals = vitalsHistory.status === 'fulfilled' ? vitalsHistory.value : [];
      const stats = vitalsStats.status === 'fulfilled' ? vitalsStats.value : null;
      const insights = aiInsights.status === 'fulfilled' ? aiInsights.value : null;
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Format user data for response
      const formattedUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        healthConditions: userData.healthConditions || [],
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
      
      // Format vitals for chart data
      const chartData = this.formatVitalsForCharts(vitals);
      
      // Build comprehensive dashboard response
      const dashboardData = {
        user: formattedUser,
        vitals: {
          latest: vitals.length > 0 ? this.formatVital(vitals[0]) : null,
          history: vitals.slice(0, 10).map(vital => this.formatVital(vital)), // Last 10 entries
          total: vitals.length,
          period: `${days} days`
        },
        charts: chartData,
        statistics: stats,
        ai: insights || this.getFallbackInsights(userData),
        summary: {
          totalEntries: vitals.length,
          latestEntry: vitals.length > 0 ? vitals[0].timestamp : null,
          dataAvailable: vitals.length > 0,
          aiEnabled: insights !== null
        }
      };
      
      logger.info(`Dashboard data retrieved successfully for user ${userId}`);
      
      res.json({
        success: true,
        data: dashboardData
      });
      
    } catch (error) {
      logger.error(`Error getting dashboard data for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data. Please try again.'
      });
    }
  }
  
  // Get AI insights separately (for refresh functionality)
  async getAIInsights(req, res) {
    try {
      const userId = req.userId;
      
      logger.info(`Getting AI insights for user ${userId}`);
      
      const insights = await aiService.getDashboardInsights(userId);
      
      res.json({
        success: true,
        data: {
          insights
        }
      });
      
    } catch (error) {
      logger.error(`Error getting AI insights for user ${req.userId}:`, error);
      
      // Return fallback insights
      const user = req.user;
      const fallbackInsights = this.getFallbackInsights(user);
      
      res.json({
        success: true,
        data: {
          insights: fallbackInsights,
          note: 'AI analysis temporarily unavailable. Showing general recommendations.'
        }
      });
    }
  }
  
  // Get health summary
  async getHealthSummary(req, res) {
    try {
      const userId = req.userId;
      const { days = 30 } = req.query;
      
      // Get basic health data
      const [vitalsHistory, stats] = await Promise.all([
        firebaseService.getVitalsHistory(userId, parseInt(days)),
        firebaseService.getVitalsStats(userId, parseInt(days))
      ]);
      
      const summary = {
        period: `${days} days`,
        entriesLogged: vitalsHistory.length,
        lastEntry: vitalsHistory.length > 0 ? vitalsHistory[0].timestamp : null,
        dataQuality: this.assessDataQuality(vitalsHistory),
        trends: this.calculateTrends(vitalsHistory),
        statistics: stats
      };
      
      res.json({
        success: true,
        data: {
          summary
        }
      });
      
    } catch (error) {
      logger.error(`Error getting health summary for user ${req.userId}:`, error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health summary'
      });
    }
  }
  
  // Helper methods
  formatVital(vital) {
    return {
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
    };
  }
  
  formatVitalsForCharts(vitals) {
    if (vitals.length === 0) {
      return {
        bloodPressure: [],
        heartRate: [],
        weight: [],
        temperature: [],
        mood: []
      };
    }
    
    const chartData = {
      bloodPressure: [],
      heartRate: [],
      weight: [],
      temperature: [],
      mood: []
    };
    
    // Reverse to show oldest to newest (chronological order for charts)
    const chronologicalVitals = [...vitals].reverse();
    
    chronologicalVitals.forEach(vital => {
      const date = vital.timestamp || vital.date;
      const formattedDate = date instanceof Date 
        ? date.toISOString().split('T')[0] 
        : date;
      
      // Blood pressure data
      if (vital.bloodPressureSystolic && vital.bloodPressureDiastolic) {
        chartData.bloodPressure.push({
          date: formattedDate,
          systolic: vital.bloodPressureSystolic,
          diastolic: vital.bloodPressureDiastolic,
          timestamp: vital.timestamp
        });
      }
      
      // Heart rate data
      if (vital.heartRate) {
        chartData.heartRate.push({
          date: formattedDate,
          heartRate: vital.heartRate,
          timestamp: vital.timestamp
        });
      }
      
      // Weight data
      if (vital.weight) {
        chartData.weight.push({
          date: formattedDate,
          weight: vital.weight,
          timestamp: vital.timestamp
        });
      }
      
      // Temperature data
      if (vital.temperature) {
        chartData.temperature.push({
          date: formattedDate,
          temperature: vital.temperature,
          timestamp: vital.timestamp
        });
      }
      
      // Mood data
      if (vital.mood) {
        chartData.mood.push({
          date: formattedDate,
          mood: vital.mood,
          timestamp: vital.timestamp
        });
      }
    });
    
    return chartData;
  }
  
  getFallbackInsights(user) {
    const firstName = user?.fullName?.split(' ')[0] || 'Friend';
    const conditions = user?.healthConditions || [];
    
    return {
      stabilityScore: {
        score: 70,
        summary: `Hi ${firstName}! We're still learning about your health patterns. Keep logging your vitals regularly to get more personalized insights.`,
        riskForecast: 'Continue monitoring your health and maintaining good habits.'
      },
      nudges: {
        diet: `Focus on heart-healthy foods today, ${firstName}. Consider adding more vegetables and whole grains to your meals.`,
        personalCare: `Take a few minutes for yourself today. Deep breathing or a short walk can do wonders for your wellbeing.`,
        social: `Connection is important for health. Consider reaching out to a friend or family member today.`
      },
      timestamp: new Date().toISOString()
    };
  }
  
  assessDataQuality(vitals) {
    if (vitals.length === 0) {
      return { score: 0, message: 'No data available' };
    }
    
    const recentEntries = vitals.filter(vital => {
      const daysSinceEntry = (new Date() - vital.timestamp) / (1000 * 60 * 60 * 24);
      return daysSinceEntry <= 7;
    });
    
    const completenessScore = vitals.reduce((acc, vital) => {
      let filledFields = 0;
      const fields = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'weight', 'temperature', 'mood'];
      
      fields.forEach(field => {
        if (vital[field] && vital[field] !== '') filledFields++;
      });
      
      return acc + (filledFields / fields.length);
    }, 0) / vitals.length;
    
    const consistencyScore = recentEntries.length / 7; // Entries in last 7 days
    
    const overallScore = (completenessScore * 0.6 + Math.min(consistencyScore, 1) * 0.4) * 100;
    
    return {
      score: Math.round(overallScore),
      completeness: Math.round(completenessScore * 100),
      consistency: Math.round(Math.min(consistencyScore, 1) * 100),
      message: overallScore > 70 ? 'Excellent data quality' : 
               overallScore > 40 ? 'Good data quality' : 'Consider logging more consistently'
    };
  }
  
  calculateTrends(vitals) {
    if (vitals.length < 2) {
      return null;
    }
    
    // Get recent vs older data for trend comparison
    const midpoint = Math.floor(vitals.length / 2);
    const recent = vitals.slice(0, midpoint);
    const older = vitals.slice(midpoint);
    
    const trends = {};
    const fields = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'weight', 'temperature'];
    
    fields.forEach(field => {
      const recentAvg = this.calculateAverage(recent, field);
      const olderAvg = this.calculateAverage(older, field);
      
      if (recentAvg !== null && olderAvg !== null) {
        const change = recentAvg - olderAvg;
        const percentChange = (change / olderAvg) * 100;
        
        trends[field] = {
          change,
          percentChange: Math.round(percentChange * 10) / 10,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      }
    });
    
    return trends;
  }
  
  calculateAverage(vitals, field) {
    const values = vitals
      .map(vital => parseFloat(vital[field]))
      .filter(val => !isNaN(val) && val > 0);
    
    if (values.length === 0) return null;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

module.exports = new DashboardController();