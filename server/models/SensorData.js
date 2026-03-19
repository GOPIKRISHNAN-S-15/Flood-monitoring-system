const database = require('./database');

class SensorData {
    static create(data, callback) {
        const { water_level, distance, status, servo_state } = data;
        const db = database.getDB();
        
        const sql = `
            INSERT INTO sensor_data (water_level, distance, status, servo_state)
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(sql, [water_level, distance, status, servo_state], function(err) {
            callback(err, { id: this.lastID, ...data });
        });
    }

    static getAll(limit, callback) {
        const db = database.getDB();
        const sql = limit 
            ? 'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT ?' 
            : 'SELECT * FROM sensor_data ORDER BY timestamp DESC';
        
        const params = limit ? [limit] : [];
        
        db.all(sql, params, (err, rows) => {
            callback(err, rows);
        });
    }

    static getLatest(callback) {
        const db = database.getDB();
        const sql = 'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1';
        
        db.get(sql, [], (err, row) => {
            callback(err, row);
        });
    }

    static getByDateRange(startDate, endDate, callback) {
        const db = database.getDB();
        const sql = `
            SELECT * FROM sensor_data 
            WHERE timestamp BETWEEN ? AND ? 
            ORDER BY timestamp ASC
        `;
        
        db.all(sql, [startDate, endDate], (err, rows) => {
            callback(err, rows);
        });
    }

    static getStats(callback) {
        const db = database.getDB();
        const sql = `
            SELECT 
                COUNT(*) as total_readings,
                AVG(water_level) as avg_water_level,
                AVG(distance) as avg_distance,
                MIN(distance) as min_distance,
                MAX(distance) as max_distance,
                COUNT(CASE WHEN status = 'danger' THEN 1 END) as danger_count,
                COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
                COUNT(CASE WHEN status = 'normal' THEN 1 END) as normal_count
            FROM sensor_data
        `;
        
        db.get(sql, [], (err, row) => {
            callback(err, row);
        });
    }
}

module.exports = SensorData;