const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Thin shim over the libSQL client that mirrors better-sqlite3's
// db.prepare(sql).get/all/run(...args) shape, so route code only needed
// `await` added rather than a full rewrite to the libsql execute() API.
function prepare(sql) {
  return {
    async get(...args) {
      const result = await client.execute({ sql, args });
      return result.rows[0];
    },
    async all(...args) {
      const result = await client.execute({ sql, args });
      return result.rows;
    },
    async run(...args) {
      const result = await client.execute({ sql, args });
      return { changes: Number(result.rowsAffected), lastInsertRowid: result.lastInsertRowid };
    },
  };
}

async function migrate() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      kind TEXT NOT NULL DEFAULT 'expense',
      category_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      upi_app_id TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
  `);

  // Migration for databases created before monthly_budget existed.
  // NULL means "not set yet" and triggers the first-time setup prompt.
  try {
    await client.execute('ALTER TABLE users ADD COLUMN monthly_budget REAL DEFAULT NULL');
  } catch (err) {
    if (!String(err.message).toLowerCase().includes('duplicate column')) throw err;
  }
}

module.exports = { prepare, migrate };
