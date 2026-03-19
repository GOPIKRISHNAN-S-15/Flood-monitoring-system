const Alert = require('../models/Alert');
const { body, validationResult } = require('express-validator');

const alertController = {
    // GET /api/alerts - Get all alerts
    getAllAlerts: (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        
        Alert.getAll(limit, (err, alerts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve alerts'
                });
            }

            res.json({
                success: true,
                data: alerts,
                count: alerts.length
            });
        });
    },

    // GET /api/alerts/recent - Get recent alerts
    getRecentAlerts: (req, res) => {
        const hours = req.query.hours ? parseInt(req.query.hours) : 24;
        
        Alert.getRecent(hours, (err, alerts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve recent alerts'
                });
            }

            res.json({
                success: true,
                data: alerts,
                count: alerts.length,
                timeframe: `${hours} hours`
            });
        });
    },

    // GET /api/alerts/level/:level - Get alerts by level
    getAlertsByLevel: (req, res) => {
        const level = req.params.level;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        
        if (!['warning', 'danger'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid alert level. Must be warning or danger'
            });
        }
        
        Alert.getByLevel(level, limit, (err, alerts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve alerts'
                });
            }

            res.json({
                success: true,
                data: alerts,
                count: alerts.length,
                level
            });
        });
    },

    // GET /api/alerts/stats - Get alert statistics
    getAlertStats: (req, res) => {
        Alert.getStats((err, stats) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve alert statistics'
                });
            }

            res.json({
                success: true,
                data: stats
            });
        });
    },

    // POST /api/alerts - Create manual alert
    createAlert: [
        body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
        body('level').isIn(['warning', 'danger']).withMessage('Level must be warning or danger'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { message, level } = req.body;
            
            Alert.create({ message, level }, (err, alert) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create alert'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Alert created successfully',
                    data: alert
                });
            });
        }
    ],

    // DELETE /api/alerts/cleanup - Delete old alerts
    cleanupOldAlerts: (req, res) => {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        
        Alert.deleteOld(days, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to cleanup alerts'
                });
            }

            res.json({
                success: true,
                message: 'Old alerts cleaned up successfully',
                deleted_count: result.changes,
                days_threshold: days
            });
        });
    }
};

module.exports = alertController;