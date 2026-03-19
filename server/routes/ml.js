const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const { authMiddleware } = require('../middleware/auth');

// All ML routes require authentication

// GET /api/ml/status - Get current model status
router.get('/status', authMiddleware, mlController.getStatus);

// POST /api/ml/train - Train ML model
router.post('/train', authMiddleware, mlController.trainModel);

// POST /api/ml/predict - Generate new predictions
router.post('/predict', authMiddleware, mlController.generatePredictions);

// GET /api/ml/predictions - Get cached predictions
router.get('/predictions', authMiddleware, mlController.getPredictions);

module.exports = router;