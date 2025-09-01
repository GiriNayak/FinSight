// database.js
const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        const sql = `
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                date TEXT NOT NULL
            );`;

        db.run(sql, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Transactions table created or already exists.');
            }
        });
    }
});

module.exports = db;