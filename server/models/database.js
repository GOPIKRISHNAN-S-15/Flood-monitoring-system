const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, 'database.sqlite');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                return;
            }
            console.log('Connected to SQLite database');
            this.createTables();
        });
    }

    createTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating users table:', err);
            else console.log('Users table ready');
        });

        // Sensor data table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                water_level REAL NOT NULL,
                distance REAL NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('normal', 'warning', 'danger')),
                servo_state TEXT NOT NULL CHECK(servo_state IN ('open', 'closed')),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating sensor_data table:', err);
            else console.log('Sensor data table ready');
        });

        // Alerts table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                level TEXT NOT NULL CHECK(level IN ('warning', 'danger')),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating alerts table:', err);
            else console.log('Alerts table ready');
        });

        // Datasets table  
        this.db.run(`
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                filename TEXT NOT NULL,
                record_count INTEGER DEFAULT 0,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) console.error('Error creating datasets table:', err);
            else console.log('Datasets table ready');
        });

        // Dataset records table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS dataset_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER NOT NULL,
                timestamp DATETIME NOT NULL,
                water_level REAL NOT NULL,
                distance REAL NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('normal', 'warning', 'danger')),
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) console.error('Error creating dataset_records table:', err);
            else console.log('Dataset records table ready');
        });

        // Servo control history table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS servo_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL CHECK(action IN ('open', 'close')),
                trigger TEXT NOT NULL CHECK(trigger IN ('automatic', 'manual')),
                reason TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating servo_history table:', err);
            else console.log('Servo history table ready');
        });

        // Create admin user if it doesn't exist
        this.createDefaultAdmin();
    }

    createDefaultAdmin() {
        const bcrypt = require('bcryptjs');
        const email = 'admin@pixelhunters.com';
        const password = 'admin123';
        
        this.db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
            if (err) {
                console.error('Error checking admin user:', err);
                return;
            }
            
            if (!row) {
                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        return;
                    }
                    
                    this.db.run(
                        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                        ['Admin User', email, hash],
                        (err) => {
                            if (err) console.error('Error creating admin user:', err);
                            else console.log(`Default admin user created: ${email}`);
                        }
                    );
                });
            }
        });
    }

    getDB() {
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing database:', err);
                else console.log('Database connection closed');
            });
        }
    }
}

module.exports = new Database();