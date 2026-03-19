const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authMiddleware } = require('../middleware/auth');

// All alert routes require authentication
router.get('/alerts', authMiddleware, alertController.getAllAlerts);
router.get('/alerts/recent', authMiddleware, alertController.getRecentAlerts);
router.get('/alerts/level/:level', authMiddleware, alertController.getAlertsByLevel);
router.get('/alerts/stats', authMiddleware, alertController.getAlertStats);
router.post('/alerts', authMiddleware, alertController.createAlert);
router.delete('/alerts/cleanup', authMiddleware, alertController.cleanupOldAlerts);

module.exports = router;