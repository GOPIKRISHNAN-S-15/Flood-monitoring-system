const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies?.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }
};

const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies?.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Token is invalid but we continue anyway
            req.user = null;
        }
    }
    
    next();
};

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            name: user.name 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = {
    authMiddleware,
    optionalAuth,
    generateToken,
    JWT_SECRET
};