const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const { verifyToken } = require('../middleware/auth');
const { validate, validateQuery } = require('../utils/validation');
const { vitalsLogSchema, dashboardQuerySchema } = require('../utils/validation');

// All vitals routes require authentication
router.use(verifyToken);

// POST /api/vitals - Log new vitals entry
router.post('/', validate(vitalsLogSchema), vitalsController.logVitals);

// GET /api/vitals - Get vitals history
router.get('/', validateQuery(dashboardQuerySchema), vitalsController.getVitalsHistory);

// GET /api/vitals/latest - Get latest vitals entry
router.get('/latest', vitalsController.getLatestVitals);

// GET /api/vitals/stats - Get vitals statistics
router.get('/stats', validateQuery(dashboardQuerySchema), vitalsController.getVitalsStats);

// GET /api/vitals/charts - Get chart data
router.get('/charts', vitalsController.getChartData);

// DELETE /api/vitals/:vitalsId - Delete a vitals entry
router.delete('/:vitalsId', vitalsController.deleteVitals);

module.exports = router;