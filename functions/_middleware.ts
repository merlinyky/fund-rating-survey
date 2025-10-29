// Middleware to initialize database on first request

import { Env } from './utils/db';

let dbInitialized = false;

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS counterparty(
  id TEXT PRIMARY KEY,
  cp_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS stage1(
  counterparty_id TEXT PRIMARY KEY,
  q1 INTEGER NOT NULL CHECK(q1 IN (0,1)),
  q2 INTEGER NOT NULL CHECK(q2 IN (0,1)),
  q3 INTEGER NOT NULL CHECK(q3 IN (0,1)),
  route TEXT NOT NULL CHECK(route IN ('A','B')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

CREATE TABLE IF NOT EXISTS stage2_opt1_row(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counterparty_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  underline TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

CREATE TABLE IF NOT EXISTS stage2_opt2_row(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counterparty_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  category TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

CREATE TABLE IF NOT EXISTS stage2_result(
  counterparty_id TEXT PRIMARY KEY,
  option INTEGER NOT NULL CHECK(option IN (1,2)),
  base_rating INTEGER NOT NULL CHECK(base_rating BETWEEN 1 AND 6),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

CREATE TABLE IF NOT EXISTS stage3_answer(
  counterparty_id TEXT NOT NULL,
  question_no INTEGER NOT NULL CHECK(question_no BETWEEN 1 AND 10),
  choice_key TEXT NOT NULL,
  PRIMARY KEY(counterparty_id, question_no),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

CREATE TABLE IF NOT EXISTS rating_result(
  counterparty_id TEXT PRIMARY KEY,
  base_rating INTEGER NOT NULL CHECK(base_rating BETWEEN 1 AND 6),
  weighted_notch REAL NOT NULL,
  final_rating INTEGER NOT NULL CHECK(final_rating BETWEEN 1 AND 6),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

CREATE INDEX IF NOT EXISTS idx_counterparty_name ON counterparty(name);
CREATE INDEX IF NOT EXISTS idx_stage2_opt1_counterparty ON stage2_opt1_row(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_stage2_opt2_counterparty ON stage2_opt2_row(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_stage3_counterparty ON stage3_answer(counterparty_id);
`;

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  // Initialize database on first request
  if (!dbInitialized && context.env.DB) {
    try {
      // Split SQL into individual statements and execute each
      const statements = INIT_SQL.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await context.env.DB.prepare(statement).run();
        }
      }
      dbInitialized = true;
    } catch (error) {
      // Ignore "table already exists" errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('already exists')) {
        console.error('Error initializing database:', error);
      } else {
        dbInitialized = true;
      }
    }
  }

  return context.next();
}
