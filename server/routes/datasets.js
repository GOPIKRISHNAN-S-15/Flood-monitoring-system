const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../../uploads');
        require('fs').mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'dataset-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    }
});

// Routes (all require authentication)

// POST /api/datasets/upload - Upload a new dataset
router.post('/upload', authMiddleware, (req, res, next) => {
    upload.single('dataset')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 10MB.'
                });
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field name. Use "dataset" as the field name.'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'File upload error: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, datasetController.uploadDataset);

// GET /api/datasets - Get all datasets for the authenticated user
router.get('/', authMiddleware, datasetController.getDatasets);

// GET /api/datasets/:id - Get specific dataset with records
router.get('/:id', authMiddleware, datasetController.getDatasetById);

// DELETE /api/datasets/:id - Delete a dataset
router.delete('/:id', authMiddleware, datasetController.deleteDataset);

module.exports = router;