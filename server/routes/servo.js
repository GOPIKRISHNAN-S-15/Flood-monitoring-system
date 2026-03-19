const express = require('express');
const router = express.Router();
const servoController = require('../controllers/servoController');
const { authMiddleware } = require('../middleware/auth');

// All servo control routes require authentication
router.get('/servo/status', authMiddleware, servoController.getServoStatus);
router.post('/servo/control', authMiddleware, servoController.controlServo);
router.get('/servo/history', authMiddleware, servoController.getServoHistory);

module.exports = router;