const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const authController = {
    // POST /api/auth/register
    register: [
        body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { name, email, password } = req.body;
            
            User.create({ name, email, password }, (err, user) => {
                if (err) {
                    console.error('Registration error:', err);
                    if (err.message === 'Email already exists') {
                        return res.status(409).json({
                            success: false,
                            message: 'Email already registered'
                        });
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Registration failed'
                    });
                }

                const token = generateToken(user);
                
                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            });
        }
    ],

    // POST /api/auth/login
    login: [
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;
            
            User.findByEmail(email, (err, user) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Login failed'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }

                User.validatePassword(password, user.password, (err, isMatch) => {
                    if (err) {
                        console.error('Password validation error:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Login failed'
                        });
                    }

                    if (!isMatch) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid credentials'
                        });
                    }

                    const token = generateToken(user);
                    
                    res.json({
                        success: true,
                        message: 'Login successful',
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        }
                    });
                });
            });
        }
    ],

    // POST /api/auth/logout
    logout: (req, res) => {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    },

    // GET /api/auth/me
    getProfile: (req, res) => {
        User.findById(req.user.id, (err, user) => {
            if (err) {
                console.error('Profile fetch error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch profile'
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });
        });
    },

    // PUT /api/auth/profile
    updateProfile: [
        body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { name } = req.body;
            
            User.updateProfile(req.user.id, { name }, (err, result) => {
                if (err) {
                    console.error('Profile update error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update profile'
                    });
                }

                res.json({
                    success: true,
                    message: 'Profile updated successfully'
                });
            });
        }
    ],

    // PUT /api/auth/change-password
    changePassword: [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { currentPassword, newPassword } = req.body;
            
            User.findById(req.user.id, (err, user) => {
                if (err || !user) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to change password'
                    });
                }

                User.validatePassword(currentPassword, user.password, (err, isMatch) => {
                    if (err || !isMatch) {
                        return res.status(401).json({
                            success: false,
                            message: 'Current password is incorrect'
                        });
                    }

                    User.changePassword(req.user.id, newPassword, (err) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to change password'
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Password changed successfully'
                        });
                    });
                });
            });
        }
    ]
};

module.exports = authController;