const database = require('./database');
const bcrypt = require('bcryptjs');

class User {
    static create(userData, callback) {
        const { name, email, password } = userData;
        const db = database.getDB();
        
        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return callback(err);
            }
            
            const sql = `
                INSERT INTO users (name, email, password)
                VALUES (?, ?, ?)
            `;
            
            db.run(sql, [name, email, hash], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return callback(new Error('Email already exists'));
                    }
                    return callback(err);
                }
                
                callback(null, { 
                    id: this.lastID, 
                    name, 
                    email 
                });
            });
        });
    }

    static findByEmail(email, callback) {
        const db = database.getDB();
        const sql = 'SELECT * FROM users WHERE email = ?';
        
        db.get(sql, [email], (err, row) => {
            callback(err, row);
        });
    }

    static findById(id, callback) {
        const db = database.getDB();
        const sql = 'SELECT id, name, email, created_at FROM users WHERE id = ?';
        
        db.get(sql, [id], (err, row) => {
            callback(err, row);
        });
    }

    static validatePassword(plainPassword, hashedPassword, callback) {
        bcrypt.compare(plainPassword, hashedPassword, callback);
    }

    static getAll(callback) {
        const db = database.getDB();
        const sql = 'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC';
        
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    }

    static updateProfile(userId, updateData, callback) {
        const { name } = updateData;
        const db = database.getDB();
        
        const sql = 'UPDATE users SET name = ? WHERE id = ?';
        
        db.run(sql, [name, userId], function(err) {
            callback(err, { changes: this.changes });
        });
    }

    static changePassword(userId, newPassword, callback) {
        bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) return callback(err);
            
            const db = database.getDB();
            const sql = 'UPDATE users SET password = ? WHERE id = ?';
            
            db.run(sql, [hash, userId], function(err) {
                callback(err, { changes: this.changes });
            });
        });
    }
}

module.exports = User;