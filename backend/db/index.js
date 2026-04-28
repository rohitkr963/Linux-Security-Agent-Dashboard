const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'security.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

const initDB = () => {
  db.serialize(() => {
    // Hosts Table
    db.run(`
      CREATE TABLE IF NOT EXISTS hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostname TEXT UNIQUE,
        os_name TEXT,
        os_version TEXT,
        kernel_version TEXT,
        ip_address TEXT,
        current_user TEXT,
        uptime TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Packages Table
    db.run(`
      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id INTEGER,
        name TEXT,
        version TEXT,
        FOREIGN KEY(host_id) REFERENCES hosts(id) ON DELETE CASCADE
      )
    `);

    // CIS Results Table
    db.run(`
      CREATE TABLE IF NOT EXISTS cis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id INTEGER,
        name TEXT,
        status TEXT,
        severity TEXT,
        evidence TEXT,
        recommendation TEXT,
        FOREIGN KEY(host_id) REFERENCES hosts(id) ON DELETE CASCADE
      )
    `);
  });
};

initDB();

module.exports = {
  db,
  // Helper to run queries with Promises
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  // Helper to get single row
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  // Helper to get all rows
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};
