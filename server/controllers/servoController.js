const { body, validationResult } = require('express-validator');

// Simulated servo control (in real implementation, this would communicate with NodeMCU)
let currentServoState = 'closed';

const servoController = {
    // GET /api/servo/status - Get current servo state
    getServoStatus: (req, res) => {
        res.json({
            success: true,
            data: {
                state: currentServoState,
                timestamp: new Date().toISOString()
            }
        });
    },

    // POST /api/servo/control - Control servo manually
    controlServo: [
        body('action').isIn(['open', 'close']).withMessage('Action must be open or close'),
        
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { action } = req.body;
            const newState = action === 'open' ? 'open' : 'closed';
            
            // In a real implementation, you would send a command to the NodeMCU here
            // For now, we'll simulate the action
            currentServoState = newState;
            
            // Log the manual control action
            console.log(`Manual servo control: ${action} by user ${req.user?.email || 'unknown'}`);
            
            res.json({
                success: true,
                message: `Flood gate ${action}ed successfully`,
                data: {
                    previous_state: currentServoState === 'open' ? 'closed' : 'open',
                    current_state: currentServoState,
                    action,
                    timestamp: new Date().toISOString(),
                    controlled_by: req.user?.email || 'system'
                }
            });
        }
    ],

    // GET /api/servo/history - Get servo control history (simulated)
    getServoHistory: (req, res) => {
        // In a real implementation, you would fetch this from a database
        const mockHistory = [
            {
                id: 1,
                action: 'open',
                trigger: 'automatic',
                reason: 'danger_level_reached',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                action: 'close',
                trigger: 'manual',
                reason: 'user_control',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                action: 'open',
                trigger: 'manual',
                reason: 'user_control',
                timestamp: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: mockHistory,
            count: mockHistory.length
        });
    }
};

module.exports = servoController;