const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Public route for NodeMCU to send data
router.post('/sensor-data', sensorController.receiveSensorData);

// Public route for latest reading (for basic monitoring)
router.get('/latest', sensorController.getLatestReading);

// Protected routes for dashboard
router.get('/sensor-data', authMiddleware, sensorController.getAllSensorData);
router.get('/sensor-data/stats', authMiddleware, sensorController.getStats);
router.get('/sensor-data/chart', authMiddleware, sensorController.getChartData);

module.exports = router;