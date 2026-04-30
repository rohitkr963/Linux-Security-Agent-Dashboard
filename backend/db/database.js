const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'security.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
  console.log('[DB] Connected to SQLite database.');
});

// Enable WAL mode for better concurrent read performance
db.run('PRAGMA journal_mode=WAL');
db.run('PRAGMA foreign_keys=ON');

const initDB = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS hosts (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId    TEXT UNIQUE NOT NULL,
        hostname  TEXT NOT NULL,
        ip        TEXT,
        os        TEXT,
        complianceScore REAL DEFAULT 0,
        lastSeen  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS packages (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId      TEXT NOT NULL,
        packageName TEXT NOT NULL,
        version     TEXT,
        FOREIGN KEY(hostId) REFERENCES hosts(hostId) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS checks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId      TEXT NOT NULL,
        title       TEXT NOT NULL,
        status      TEXT NOT NULL,
        severity    TEXT DEFAULT 'INFO',
        evidence    TEXT,
        remediation TEXT,
        createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(hostId) REFERENCES hosts(hostId) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId      TEXT NOT NULL,
        score       REAL NOT NULL,
        createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(hostId) REFERENCES hosts(hostId) ON DELETE CASCADE
      )
    `);

    // Performance indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_hosts_hostId   ON hosts(hostId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_hosts_lastSeen ON hosts(lastSeen)');
    db.run('CREATE INDEX IF NOT EXISTS idx_checks_hostId  ON checks(hostId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_checks_status  ON checks(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_pkgs_hostId    ON packages(hostId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_scan_history_hostId ON scan_history(hostId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_scan_history_createdAt ON scan_history(createdAt)');

    console.log('[DB] Schema initialized.');
  });
};

initDB();

const run  = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    })
  );

const get  = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

const all  = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])))
  );

const beginTransaction    = () => run('BEGIN TRANSACTION');
const commitTransaction   = () => run('COMMIT');
const rollbackTransaction = () => run('ROLLBACK');

module.exports = { db, run, get, all, beginTransaction, commitTransaction, rollbackTransaction };
