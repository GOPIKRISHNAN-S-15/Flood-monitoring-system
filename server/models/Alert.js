const database = require('./database');

class Alert {
    static create(alertData, callback) {
        const { message, level } = alertData;
        const db = database.getDB();
        
        const sql = `
            INSERT INTO alerts (message, level)
            VALUES (?, ?)
        `;
        
        db.run(sql, [message, level], function(err) {
            if (err) {
                return callback(err);
            }
            
            callback(null, { 
                id: this.lastID, 
                message, 
                level,
                timestamp: new Date().toISOString()
            });
        });
    }

    static getAll(limit, callback) {
        const db = database.getDB();
        const sql = limit 
            ? 'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?' 
            : 'SELECT * FROM alerts ORDER BY timestamp DESC';
        
        const params = limit ? [limit] : [];
        
        db.all(sql, params, (err, rows) => {
            callback(err, rows);
        });
    }

    static getByLevel(level, limit, callback) {
        const db = database.getDB();
        const sql = limit
            ? 'SELECT * FROM alerts WHERE level = ? ORDER BY timestamp DESC LIMIT ?'
            : 'SELECT * FROM alerts WHERE level = ? ORDER BY timestamp DESC';
        
        const params = limit ? [level, limit] : [level];
        
        db.all(sql, params, (err, rows) => {
            callback(err, rows);
        });
    }

    static getRecent(hours, callback) {
        const db = database.getDB();
        const sql = `
            SELECT * FROM alerts 
            WHERE timestamp >= datetime('now', '-${hours} hours') 
            ORDER BY timestamp DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    }

    static deleteOld(daysOld, callback) {
        const db = database.getDB();
        const sql = `
            DELETE FROM alerts 
            WHERE timestamp < datetime('now', '-${daysOld} days')
        `;
        
        db.run(sql, [], function(err) {
            callback(err, { changes: this.changes });
        });
    }

    static getStats(callback) {
        const db = database.getDB();
        const sql = `
            SELECT 
                COUNT(*) as total_alerts,
                COUNT(CASE WHEN level = 'warning' THEN 1 END) as warning_count,
                COUNT(CASE WHEN level = 'danger' THEN 1 END) as danger_count,
                COUNT(CASE WHEN timestamp >= datetime('now', '-24 hours') THEN 1 END) as alerts_last_24h,
                COUNT(CASE WHEN timestamp >= datetime('now', '-7 days') THEN 1 END) as alerts_last_7days
            FROM alerts
        `;
        
        db.get(sql, [], (err, row) => {
            callback(err, row);
        });
    }
}

module.exports = Alert;