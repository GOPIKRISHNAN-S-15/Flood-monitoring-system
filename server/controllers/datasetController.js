const path = require('path');
const fs = require('fs').promises;
const csv = require('csv-parse/sync');
const database = require('../models/database');

class DatasetController {
    // Upload and process CSV dataset
    async uploadDataset(req, res) {
        let uploadedFile = null;
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded. Please select a CSV file.'
                });
            }

            uploadedFile = req.file;
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Dataset name is required.'
                });
            }

            // Read and parse CSV file
            const fileContent = await fs.readFile(uploadedFile.path, 'utf-8');
            const records = csv.parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            if (records.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'CSV file is empty or contains no valid data.'
                });
            }

            // Validate CSV structure
            const requiredColumns = ['timestamp', 'water_level', 'distance', 'status'];
            const csvColumns = Object.keys(records[0]);
            const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));

            if (missingColumns.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required columns: ${missingColumns.join(', ')}. Required columns are: ${requiredColumns.join(', ')}`
                });
            }

            // Validate and process records
            const validatedRecords = [];
            const errors = [];

            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const validation = this.validateRecord(record, i + 1);
                
                if (validation.isValid) {
                    validatedRecords.push(validation.record);
                } else {
                    errors.push(validation.error);
                }
            }

            if (errors.length > 0 && validatedRecords.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid records found in dataset.',
                    errors: errors.slice(0, 10) // Show first 10 errors
                });
            }

            // Save dataset to database
            const datasetId = await this.saveDataset({
                name,
                description: description || null,
                filename: uploadedFile.originalname,
                records: validatedRecords,
                user_id: req.user.id
            });

            // Clean up uploaded file
            await fs.unlink(uploadedFile.path);

            res.json({
                success: true,
                message: 'Dataset uploaded successfully!',
                data: {
                    dataset_id: datasetId,
                    name,
                    total_records: validatedRecords.length,
                    errors: errors.length > 0 ? errors.slice(0, 5) : null,
                    warnings: errors.length > 0 ? `${errors.length} records were skipped due to validation errors.` : null
                }
            });

        } catch (error) {
            console.error('Dataset upload error:', error);
            
            // Clean up uploaded file if it exists
            if (uploadedFile && uploadedFile.path) {
                try {
                    await fs.unlink(uploadedFile.path);
                } catch (unlinkError) {
                    console.error('Error cleaning up uploaded file:', unlinkError);
                }
            }

            res.status(500).json({
                success: false,
                message: 'Failed to process dataset upload.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get all datasets for a user
    async getDatasets(req, res) {
        try {
            const datasets = await database.query(`
                SELECT 
                    id,
                    name,
                    description,
                    filename,
                    record_count,
                    created_at
                FROM datasets 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `, [req.user.id]);

            res.json({
                success: true,
                data: datasets || []
            });

        } catch (error) {
            console.error('Error fetching datasets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch datasets'
            });
        }
    }

    // Get specific dataset with records
    async getDatasetById(req, res) {
        try {
            const { id } = req.params;

            // Get dataset info
            const datasets = await database.query(`
                SELECT 
                    id,
                    name,
                    description,
                    filename,
                    record_count,
                    created_at
                FROM datasets 
                WHERE id = ? AND user_id = ?
            `, [id, req.user.id]);

            if (!datasets || datasets.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Dataset not found'
                });
            }

            const dataset = datasets[0];

            // Get dataset records
            const records = await database.query(`
                SELECT 
                    timestamp,
                    water_level,
                    distance,
                    status
                FROM dataset_records 
                WHERE dataset_id = ? 
                ORDER BY timestamp ASC
            `, [id]);

            res.json({
                success: true,
                data: {
                    ...dataset,
                    records: records || []
                }
            });

        } catch (error) {
            console.error('Error fetching dataset:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dataset'
            });
        }
    }

    // Delete dataset
    async deleteDataset(req, res) {
        try {
            const { id } = req.params;

            // Verify ownership
            const datasets = await database.query(`
                SELECT id FROM datasets 
                WHERE id = ? AND user_id = ?
            `, [id, req.user.id]);

            if (!datasets || datasets.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Dataset not found'
                });
            }

            // Delete records first (foreign key constraint)
            await database.query('DELETE FROM dataset_records WHERE dataset_id = ?', [id]);
            
            // Delete dataset
            await database.query('DELETE FROM datasets WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Dataset deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting dataset:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete dataset'
            });
        }
    }

    // Helper method to validate individual record
    validateRecord(record, lineNumber) {
        try {
            // Parse timestamp
            const timestamp = new Date(record.timestamp);
            if (isNaN(timestamp.getTime())) {
                return {
                    isValid: false,
                    error: `Line ${lineNumber}: Invalid timestamp format '${record.timestamp}'`
                };
            }

            // Parse water level
            const waterLevel = parseFloat(record.water_level);
            if (isNaN(waterLevel) || waterLevel < 0 || waterLevel > 1000) {
                return {
                    isValid: false,
                    error: `Line ${lineNumber}: Invalid water level '${record.water_level}' (must be 0-1000 cm)`
                };
            }

            // Parse distance
            const distance = parseFloat(record.distance);
            if (isNaN(distance) || distance < 0 || distance > 1000) {
                return {
                    isValid: false,
                    error: `Line ${lineNumber}: Invalid distance '${record.distance}' (must be 0-1000 cm)`
                };
            }

            // Validate status
            const validStatuses = ['normal', 'warning', 'danger'];
            const status = record.status.toLowerCase().trim();
            if (!validStatuses.includes(status)) {
                return {
                    isValid: false,
                    error: `Line ${lineNumber}: Invalid status '${record.status}' (must be: ${validStatuses.join(', ')})`
                };
            }

            return {
                isValid: true,
                record: {
                    timestamp: timestamp.toISOString(),
                    water_level: waterLevel,
                    distance: distance,
                    status: status
                }
            };

        } catch (error) {
            return {
                isValid: false,
                error: `Line ${lineNumber}: Error parsing record - ${error.message}`
            };
        }
    }

    // Helper method to save dataset to database
    async saveDataset(datasetInfo) {
        const { name, description, filename, records, user_id } = datasetInfo;

        // Insert dataset record
        const result = await database.query(`
            INSERT INTO datasets (name, description, filename, record_count, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [name, description, filename, records.length, user_id]);

        const datasetId = result.lastID;

        // Insert dataset records in batches
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
            const values = batch.flatMap(record => [
                datasetId,
                record.timestamp,
                record.water_level,
                record.distance,
                record.status
            ]);

            await database.query(`
                INSERT INTO dataset_records (dataset_id, timestamp, water_level, distance, status)
                VALUES ${placeholders}
            `, values);
        }

        return datasetId;
    }
}

module.exports = new DatasetController();