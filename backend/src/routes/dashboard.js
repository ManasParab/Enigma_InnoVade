const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');
const { validateQuery } = require('../utils/validation');
const { dashboardQuerySchema } = require('../utils/validation');

// All dashboard routes require authentication
router.use(verifyToken);

// GET /api/dashboard - Get complete dashboard data
router.get('/', validateQuery(dashboardQuerySchema), dashboardController.getDashboard);

// GET /api/dashboard/insights - Get AI insights only
router.get('/insights', dashboardController.getAIInsights);

// GET /api/dashboard/summary - Get health summary
router.get('/summary', dashboardController.getHealthSummary);

module.exports = router;