// =============================================================================
// credits.js — SQLite-backed credit system for EnclosureAI
//
// Each new user automatically receives 5 free generations.
// Every successful /generate call deducts 1 credit.
// =============================================================================

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "database.sqlite");
const FREE_CREDITS = 5;

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// ---------------------------------------------------------------------------
// Schema initialisation
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT    PRIMARY KEY,
    credits    INTEGER NOT NULL DEFAULT ${FREE_CREDITS},
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Prepared statements (re-usable, faster than ad-hoc)
const stmtGetUser = db.prepare("SELECT credits FROM users WHERE id = ?");
const stmtInsertUser = db.prepare("INSERT OR IGNORE INTO users (id, credits) VALUES (?, ?)");
const stmtDeduct = db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0");

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the current credit count for a user.
 * If the user does not exist yet, they are created with FREE_CREDITS.
 */
function getCredits(userId) {
  let row = stmtGetUser.get(userId);
  if (!row) {
    stmtInsertUser.run(userId, FREE_CREDITS);
    return FREE_CREDITS;
  }
  return row.credits;
}

/**
 * Atomically deducts one credit.
 * Returns `true` if successful, `false` if the user has no credits left.
 */
function deductCredit(userId) {
  // Ensure user exists first
  getCredits(userId);

  const result = stmtDeduct.run(userId);
  return result.changes > 0; // true if a row was actually updated
}

module.exports = { getCredits, deductCredit };
