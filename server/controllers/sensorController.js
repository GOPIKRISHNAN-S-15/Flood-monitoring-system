const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const { body, validationResult } = require('express-validator');

// Water level logic
const determineStatus = (distance) => {
    if (distance > 80) return 'normal';
    if (distance >= 50) return 'warning';
    return 'danger';
};

const shouldTriggerAlert = (status) => {
    return status === 'warning' || status === 'danger';
};

const createAlert = async (status, distance, waterLevel) => {
    let message;
    if (status === 'warning') {
        message = `Warning: Water level rising. Distance: ${distance}cm, Water Level: ${waterLevel}cm`;
    } else if (status === 'danger') {
        message = `Danger: Critical water level reached! Distance: ${distance}cm, Water Level: ${waterLevel}cm. Flood gate activated.`;
    }
    
    if (message) {
        Alert.create({ message, level: status }, (err, alert) => {
            if (err) console.error('Error creating alert:', err);
            else console.log('Alert created:', alert);
        });
    }
};

const sensorController = {
    // POST /api/sensor-data - Receive data from NodeMCU
    receiveSensorData: [
        body('distance').isNumeric().withMessage('Distance must be a number'),
        body('water_level').isNumeric().withMessage('Water level must be a number'),
        body('servo_state').isIn(['open', 'closed']).withMessage('Servo state must be open or closed'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { distance, water_level, servo_state } = req.body;
            const status = determineStatus(distance);
            
            const sensorData = {
                distance: parseFloat(distance),
                water_level: parseFloat(water_level),
                servo_state,
                status
            };

            SensorData.create(sensorData, (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to save sensor data'
                    });
                }

                // Create alert if necessary
                if (shouldTriggerAlert(status)) {
                    createAlert(status, distance, water_level);
                }

                res.json({
                    success: true,
                    message: 'Sensor data received',
                    data: result,
                    action: status === 'danger' ? 'open_gate' : 'none'
                });
            });
        }
    ],

    // GET /api/sensor-data - Get all sensor readings
    getAllSensorData: (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        
        SensorData.getAll(limit, (err, data) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve sensor data'
                });
            }

            res.json({
                success: true,
                data,
                count: data.length
            });
        });
    },

    // GET /api/latest - Get latest reading
    getLatestReading: (req, res) => {
        SensorData.getLatest((err, data) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve latest reading'
                });
            }

            if (!data) {
                return res.json({
                    success: true,
                    message: 'No data available',
                    data: null
                });
            }

            res.json({
                success: true,
                data
            });
        });
    },

    // GET /api/sensor-data/stats - Get statistics
    getStats: (req, res) => {
        SensorData.getStats((err, stats) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve statistics'
                });
            }

            res.json({
                success: true,
                data: stats
            });
        });
    },

    // GET /api/sensor-data/chart - Get data for charts
    getChartData: (req, res) => {
        const hours = req.query.hours ? parseInt(req.query.hours) : 24;
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        const endDate = new Date().toISOString();
        
        SensorData.getByDateRange(startDate, endDate, (err, data) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve chart data'
                });
            }

            // Format data for Chart.js
            const chartData = {
                labels: data.map(row => new Date(row.timestamp).toLocaleTimeString()),
                waterLevels: data.map(row => row.water_level),
                distances: data.map(row => row.distance),
                statuses: data.map(row => row.status)
            };

            res.json({
                success: true,
                data: chartData,
                count: data.length
            });
        });
    }
};

module.exports = sensorController;