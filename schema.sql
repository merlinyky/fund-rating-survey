-- Fund Rating Survey Database Schema

-- Counterparty (Fund) table
CREATE TABLE IF NOT EXISTS counterparty(
  id TEXT PRIMARY KEY,
  cp_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Stage 1: Three yes/no questions and routing result
CREATE TABLE IF NOT EXISTS stage1(
  counterparty_id TEXT PRIMARY KEY,
  q1 INTEGER NOT NULL CHECK(q1 IN (0,1)),
  q2 INTEGER NOT NULL CHECK(q2 IN (0,1)),
  q3 INTEGER NOT NULL CHECK(q3 IN (0,1)),
  route TEXT NOT NULL CHECK(route IN ('A','B')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

-- Stage 2 Option 1 (Route A): Dynamic rows with Underline + Sector + Weight
CREATE TABLE IF NOT EXISTS stage2_opt1_row(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counterparty_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  underline TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

-- Stage 2 Option 2 (Route B): Dynamic rows with Category + Sector + Weight
CREATE TABLE IF NOT EXISTS stage2_opt2_row(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counterparty_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  category TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

-- Stage 2 Result: Base rating (1-6)
CREATE TABLE IF NOT EXISTS stage2_result(
  counterparty_id TEXT PRIMARY KEY,
  option INTEGER NOT NULL CHECK(option IN (1,2)),
  base_rating INTEGER NOT NULL CHECK(base_rating BETWEEN 1 AND 6),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

-- Stage 3: Multiple choice answers (10 questions)
CREATE TABLE IF NOT EXISTS stage3_answer(
  counterparty_id TEXT NOT NULL,
  question_no INTEGER NOT NULL CHECK(question_no BETWEEN 1 AND 10),
  choice_key TEXT NOT NULL,
  PRIMARY KEY(counterparty_id, question_no),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

-- Final Rating Result
CREATE TABLE IF NOT EXISTS rating_result(
  counterparty_id TEXT PRIMARY KEY,
  base_rating INTEGER NOT NULL CHECK(base_rating BETWEEN 1 AND 6),
  weighted_notch REAL NOT NULL,
  final_rating INTEGER NOT NULL CHECK(final_rating BETWEEN 1 AND 6),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(counterparty_id) REFERENCES counterparty(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counterparty_name ON counterparty(name);
CREATE INDEX IF NOT EXISTS idx_stage2_opt1_counterparty ON stage2_opt1_row(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_stage2_opt2_counterparty ON stage2_opt2_row(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_stage3_counterparty ON stage3_answer(counterparty_id);
