const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensor');
const alertRoutes = require('./routes/alerts');
const servoRoutes = require('./routes/servo');
const datasetRoutes = require('./routes/datasets');
const mlRoutes = require('./routes/ml');

// Import database to initialize tables
const database = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', sensorRoutes);
app.use('/api', alertRoutes);
app.use('/api', servoRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/ml', mlRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'IoT Flood Monitoring System API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            system: 'IoT Flood Monitoring System',
            status: 'operational',
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        }
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dashboard.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/about.html'));
});

app.get('/team', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/team.html'));
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

// Handle 404 for other routes
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Graceful shutdown...');
    database.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    database.close();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🌊 IoT Flood Monitoring System');
    console.log('🏫 M. Kumarasamy College of Engineering');
    console.log('👥 Team: Pixel Hunters');
    console.log('='.repeat(50));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🛡️  API Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
});

module.exports = app;