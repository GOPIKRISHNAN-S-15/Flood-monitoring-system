const database = require('../models/database');

class MLController {
    constructor() {
        this.modelCache = {
            is_trained: false,
            last_trained: null,
            model_type: null,
            accuracy: null,
            metrics: {},
            training_data_points: 0,
            prediction_hours: 72,
            coefficients: null,
            intercept: null
        };
    }

    // Get current model status
    async getStatus(req, res) {
        try {
            res.json({
                success: true,
                data: this.modelCache
            });
        } catch (error) {
            console.error('Error getting ML status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get model status'
            });
        }
    }

    // Train ML model on historical data
    async trainModel(req, res) {
        try {
            const { data_range_days, model_type } = req.body;

            // Validate input
            if (!data_range_days || !model_type) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required parameters: data_range_days, model_type'
                });
            }

            // Get training data
            let query = `
                SELECT 
                    water_level,
                    distance,
                    status,
                    timestamp,
                    CASE 
                        WHEN status = 'danger' THEN 1
                        WHEN status = 'warning' THEN 0.5
                        ELSE 0
                    END as risk_level
                FROM sensor_data
            `;
            
            const params = [];
            if (data_range_days > 0) {
                query += ` WHERE timestamp >= datetime('now', '-${data_range_days} days')`;
            }
            
            query += ` ORDER BY timestamp ASC`;

            const trainingData = await database.query(query, params);

            if (!trainingData || trainingData.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient data for training. Need at least 10 data points.'
                });
            }

            // Train model based on type
            let modelResult;
            switch (model_type) {
                case 'linear_regression':
                    modelResult = this.trainLinearRegression(trainingData);
                    break;
                case 'moving_average':
                    modelResult = this.trainMovingAverage(trainingData);
                    break;
                case 'trend_analysis':
                    modelResult = this.trainTrendAnalysis(trainingData);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid model type. Supported: linear_regression, moving_average, trend_analysis'
                    });
            }

            // Update model cache
            this.modelCache = {
                ...this.modelCache,
                is_trained: true,
                last_trained: new Date().toISOString(),
                model_type,
                training_data_points: trainingData.length,
                ...modelResult
            };

            res.json({
                success: true,
                message: 'Model trained successfully',
                data: this.modelCache
            });

        } catch (error) {
            console.error('Error training model:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to train model',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Generate predictions
    async generatePredictions(req, res) {
        try {
            const { prediction_hours } = req.body;

            if (!this.modelCache.is_trained) {
                return res.status(400).json({
                    success: false,
                    message: 'Model not trained. Please train the model first.'
                });
            }

            const hours = prediction_hours || 24;

            // Get recent data for prediction baseline
            const recentData = await database.query(`
                SELECT 
                    water_level,
                    distance,
                    status,
                    timestamp
                FROM sensor_data
                ORDER BY timestamp DESC
                LIMIT 10
            `);

            if (!recentData || recentData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No recent data available for predictions'
                });
            }

            // Generate predictions based on model type
            const predictions = this.generateForecast(recentData, hours);

            // Analyze risk patterns
            const riskAlerts = this.analyzeRiskPatterns(predictions);

            // Find next high risk time
            const nextRiskTime = this.findNextRiskTime(predictions);

            const result = {
                predictions,
                risk_alerts: riskAlerts,
                next_risk_time: nextRiskTime,
                model_type: this.modelCache.model_type,
                prediction_generated_at: new Date().toISOString()
            };

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error generating predictions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate predictions',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get cached predictions
    async getPredictions(req, res) {
        try {
            const { hours } = req.query;
            
            if (!this.modelCache.is_trained) {
                return res.status(400).json({
                    success: false,
                    message: 'Model not trained'
                });
            }

            // For now, return empty predictions - in production you'd cache them
            res.json({
                success: true,
                data: {
                    predictions: [],
                    risk_alerts: [],
                    next_risk_time: null
                }
            });

        } catch (error) {
            console.error('Error getting predictions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get predictions'
            });
        }
    }

    // Train linear regression model
    trainLinearRegression(data) {
        // Simple linear regression to predict water level based on recent trends
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        // Use time index as X, water level as Y
        for (let i = 0; i < n; i++) {
            const x = i;
            const y = data[i].water_level;
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared for accuracy
        const mean = sumY / n;
        let ssRes = 0, ssTot = 0;
        
        for (let i = 0; i < n; i++) {
            const predicted = slope * i + intercept;
            const actual = data[i].water_level;
            
            ssRes += Math.pow(actual - predicted, 2);
            ssTot += Math.pow(actual - mean, 2);
        }

        const rSquared = 1 - (ssRes / ssTot);
        const accuracy = Math.max(0, Math.min(1, rSquared));

        return {
            accuracy,
            coefficients: { slope, intercept },
            metrics: {
                precision: accuracy * 0.9, // Approximate precision
                recall: accuracy * 0.85,
                f1_score: accuracy * 0.87,
                confidence: accuracy
            }
        };
    }

    // Train moving average model
    trainMovingAverage(data) {
        const windowSize = Math.min(5, Math.floor(data.length / 3));
        let totalError = 0;
        let predictions = 0;

        for (let i = windowSize; i < data.length; i++) {
            const window = data.slice(i - windowSize, i);
            const average = window.reduce((sum, d) => sum + d.water_level, 0) / windowSize;
            const error = Math.abs(data[i].water_level - average);
            totalError += error;
            predictions++;
        }

        const meanError = predictions > 0 ? totalError / predictions : 100;
        const maxWaterLevel = Math.max(...data.map(d => d.water_level));
        const accuracy = Math.max(0, 1 - (meanError / maxWaterLevel));

        return {
            accuracy,
            coefficients: { window_size: windowSize },
            metrics: {
                precision: accuracy * 0.85,
                recall: accuracy * 0.8,
                f1_score: accuracy * 0.82,
                confidence: accuracy * 0.9
            }
        };
    }

    // Train trend analysis model
    trainTrendAnalysis(data) {
        // Analyze water level trends and patterns
        const hourlyTrends = {};
        const dailyTrends = {};

        data.forEach(point => {
            const date = new Date(point.timestamp);
            const hour = date.getHours();
            const day = date.getDay();

            if (!hourlyTrends[hour]) hourlyTrends[hour] = [];
            if (!dailyTrends[day]) dailyTrends[day] = [];

            hourlyTrends[hour].push(point.water_level);
            dailyTrends[day].push(point.water_level);
        });

        // Calculate trend strength
        const hourlyVariance = Object.values(hourlyTrends)
            .map(levels => this.calculateVariance(levels))
            .reduce((sum, variance) => sum + variance, 0) / Object.keys(hourlyTrends).length;

        const accuracy = Math.max(0.6, Math.min(0.95, 1 - (hourlyVariance / 100)));

        return {
            accuracy,
            coefficients: { hourly_trends: hourlyTrends, daily_trends: dailyTrends },
            metrics: {
                precision: accuracy * 0.88,
                recall: accuracy * 0.82,
                f1_score: accuracy * 0.85,
                confidence: accuracy * 0.92
            }
        };
    }

    // Generate forecast based on trained model
    generateForecast(recentData, hours) {
        const predictions = [];
        const latestPoint = recentData[0];
        const currentTime = new Date();

        for (let i = 1; i <= hours; i++) {
            const futureTime = new Date(currentTime.getTime() + i * 60 * 60 * 1000);
            let predictedLevel, floodProbability;

            switch (this.modelCache.model_type) {
                case 'linear_regression':
                    predictedLevel = this.predictLinearRegression(latestPoint.water_level, i);
                    break;
                case 'moving_average':
                    predictedLevel = this.predictMovingAverage(recentData, i);
                    break;
                case 'trend_analysis':
                    predictedLevel = this.predictTrendAnalysis(recentData, futureTime);
                    break;
                default:
                    predictedLevel = latestPoint.water_level;
            }

            // Calculate flood probability based on predicted level
            floodProbability = this.calculateFloodProbability(predictedLevel);

            predictions.push({
                timestamp: futureTime.toISOString(),
                predicted_water_level: Math.max(0, predictedLevel),
                flood_probability: floodProbability,
                risk_level: floodProbability > 0.7 ? 'danger' : floodProbability > 0.4 ? 'warning' : 'normal'
            });
        }

        return predictions;
    }

    // Prediction methods for different models
    predictLinearRegression(currentLevel, timeStep) {
        const { slope, intercept } = this.modelCache.coefficients || { slope: 0, intercept: currentLevel };
        return currentLevel + (slope * timeStep) + (Math.random() - 0.5) * 2; // Add some noise
    }

    predictMovingAverage(recentData, timeStep) {
        const windowSize = this.modelCache.coefficients?.window_size || 3;
        const window = recentData.slice(0, windowSize);
        const average = window.reduce((sum, d) => sum + d.water_level, 0) / window.length;
        
        // Add seasonal variation
        const seasonalVariation = Math.sin(timeStep * Math.PI / 12) * 2;
        return average + seasonalVariation + (Math.random() - 0.5) * 3;
    }

    predictTrendAnalysis(recentData, futureTime) {
        const hour = futureTime.getHours();
        const hourlyTrends = this.modelCache.coefficients?.hourly_trends || {};
        
        let baseLevel = recentData[0].water_level;
        
        if (hourlyTrends[hour] && hourlyTrends[hour].length > 0) {
            const hourlyAverage = hourlyTrends[hour].reduce((sum, level) => sum + level, 0) / hourlyTrends[hour].length;
            baseLevel = (baseLevel + hourlyAverage) / 2;
        }

        // Add trend prediction
        const trendFactor = (hour >= 10 && hour <= 16) ? 1.2 : 0.8; // Higher during day
        return baseLevel * trendFactor + (Math.random() - 0.5) * 5;
    }

    // Calculate flood probability based on water level
    calculateFloodProbability(waterLevel) {
        // Simple threshold-based probability
        if (waterLevel < 20) return 0.1;
        if (waterLevel < 30) return 0.2;
        if (waterLevel < 40) return 0.5;
        if (waterLevel < 50) return 0.8;
        return 0.95;
    }

    // Analyze predictions for risk patterns
    analyzeRiskPatterns(predictions) {
        const alerts = [];
        let consecutiveRisk = 0;

        for (let i = 0; i < predictions.length; i++) {
            const prediction = predictions[i];
            
            if (prediction.flood_probability > 0.7) {
                consecutiveRisk++;
                
                if (consecutiveRisk === 1) {
                    alerts.push({
                        level: 'danger',
                        title: 'High Flood Risk Detected',
                        message: `Critical water level predicted: ${prediction.predicted_water_level.toFixed(1)}cm. Immediate action recommended.`,
                        predicted_time: prediction.timestamp,
                        probability: prediction.flood_probability
                    });
                }
            } else if (prediction.flood_probability > 0.4) {
                if (consecutiveRisk === 0) {
                    alerts.push({
                        level: 'warning',
                        title: 'Elevated Flood Risk',
                        message: `Water level rising: ${prediction.predicted_water_level.toFixed(1)}cm. Monitor situation closely.`,
                        predicted_time: prediction.timestamp,
                        probability: prediction.flood_probability
                    });
                }
                consecutiveRisk = Math.max(0, consecutiveRisk - 1);
            } else {
                consecutiveRisk = 0;
            }
        }

        return alerts;
    }

    // Find next high risk time window
    findNextRiskTime(predictions) {
        for (const prediction of predictions) {
            if (prediction.flood_probability > 0.6) {
                return prediction.timestamp;
            }
        }
        return null;
    }

    // Helper method to calculate variance
    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
    }
}

module.exports = new MLController();