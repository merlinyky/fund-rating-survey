-- Seed Test Data
-- This file contains the test data from previous testing sessions
-- Run with: npx wrangler d1 execute fund-rating-db --local --file=seed-test-data.sql

-- Test Case 1: Alpha Fund (FUND001) - Route A - Completed all stages
INSERT OR IGNORE INTO counterparty (id, cp_id, name, created_at)
VALUES ('CP1761695330057vkz2q6q', 'FUND001', 'Alpha Fund', '2025-10-28T23:48:50.057Z');

INSERT OR REPLACE INTO stage1 (counterparty_id, q1, q2, q3, route, updated_at)
VALUES ('CP1761695330057vkz2q6q', 1, 1, 0, 'A', '2025-10-28 23:49:03');

INSERT OR IGNORE INTO stage2_opt1_row (id, counterparty_id, line_no, underline, sector, weight)
VALUES
  (1, 'CP1761695330057vkz2q6q', 1, 'Equity', '1.0', 0.6),
  (2, 'CP1761695330057vkz2q6q', 2, 'Fixed Income', '2.0', 0.4);

INSERT OR REPLACE INTO stage2_result (counterparty_id, option, base_rating, updated_at)
VALUES ('CP1761695330057vkz2q6q', 1, 1, '2025-10-28 23:49:03');

INSERT OR REPLACE INTO stage3_answer (counterparty_id, question_no, choice_key)
VALUES
  ('CP1761695330057vkz2q6q', 1, 'A'),
  ('CP1761695330057vkz2q6q', 2, 'B'),
  ('CP1761695330057vkz2q6q', 3, 'A'),
  ('CP1761695330057vkz2q6q', 4, 'C'),
  ('CP1761695330057vkz2q6q', 5, 'B'),
  ('CP1761695330057vkz2q6q', 6, 'A'),
  ('CP1761695330057vkz2q6q', 7, 'B'),
  ('CP1761695330057vkz2q6q', 8, 'A'),
  ('CP1761695330057vkz2q6q', 9, 'B'),
  ('CP1761695330057vkz2q6q', 10, 'A');

INSERT OR REPLACE INTO rating_result (counterparty_id, base_rating, weighted_notch, final_rating, updated_at)
VALUES ('CP1761695330057vkz2q6q', 1, 0.03, 1, '2025-10-28 23:51:09');

-- Test Case 2: test2 (434342) - Route B - Completed all stages
INSERT OR IGNORE INTO counterparty (id, cp_id, name, created_at)
VALUES ('CP1761695604668e7t1y4r', '434342', 'test2', '2025-10-28T23:53:24.669Z');

INSERT OR REPLACE INTO stage1 (counterparty_id, q1, q2, q3, route, updated_at)
VALUES ('CP1761695604668e7t1y4r', 0, 0, 0, 'B', '2025-10-28 23:54:37');

INSERT OR IGNORE INTO stage2_opt1_row (id, counterparty_id, line_no, underline, sector, weight)
VALUES (3, 'CP1761695604668e7t1y4r', 1, 'asset1', 'Sector 2', 1.0);

INSERT OR REPLACE INTO stage2_result (counterparty_id, option, base_rating, updated_at)
VALUES ('CP1761695604668e7t1y4r', 2, 2, '2025-10-28 23:54:45');

INSERT OR REPLACE INTO stage3_answer (counterparty_id, question_no, choice_key)
VALUES
  ('CP1761695604668e7t1y4r', 1, 'A'),
  ('CP1761695604668e7t1y4r', 2, 'C'),
  ('CP1761695604668e7t1y4r', 3, 'C'),
  ('CP1761695604668e7t1y4r', 4, 'A'),
  ('CP1761695604668e7t1y4r', 5, 'A'),
  ('CP1761695604668e7t1y4r', 6, 'B'),
  ('CP1761695604668e7t1y4r', 7, 'D'),
  ('CP1761695604668e7t1y4r', 8, 'A'),
  ('CP1761695604668e7t1y4r', 9, 'A'),
  ('CP1761695604668e7t1y4r', 10, 'E');

INSERT OR REPLACE INTO rating_result (counterparty_id, base_rating, weighted_notch, final_rating, updated_at)
VALUES ('CP1761695604668e7t1y4r', 2, 0.63, 3, '2025-10-28 23:56:19');

-- Test Case 3: debug fund (debug001) - Route A - Completed all stages
INSERT OR IGNORE INTO counterparty (id, cp_id, name, created_at)
VALUES ('CP1761696347250pa9isv7', 'debug001', 'debug fund', '2025-10-29T00:05:47.253Z');

INSERT OR REPLACE INTO stage1 (counterparty_id, q1, q2, q3, route, updated_at)
VALUES ('CP1761696347250pa9isv7', 1, 1, 1, 'A', '2025-10-29 00:31:08');

INSERT OR IGNORE INTO stage2_opt1_row (id, counterparty_id, line_no, underline, sector, weight)
VALUES (4, 'CP1761696347250pa9isv7', 1, 'asset1', 'Sector 2', 1.0);

INSERT OR REPLACE INTO stage2_result (counterparty_id, option, base_rating, updated_at)
VALUES ('CP1761696347250pa9isv7', 2, 1, '2025-10-29 00:30:53');

INSERT OR REPLACE INTO stage3_answer (counterparty_id, question_no, choice_key)
VALUES
  ('CP1761696347250pa9isv7', 1, 'C'),
  ('CP1761696347250pa9isv7', 2, 'A'),
  ('CP1761696347250pa9isv7', 3, 'E'),
  ('CP1761696347250pa9isv7', 4, 'A'),
  ('CP1761696347250pa9isv7', 5, 'B'),
  ('CP1761696347250pa9isv7', 6, 'F'),
  ('CP1761696347250pa9isv7', 7, 'A'),
  ('CP1761696347250pa9isv7', 8, 'E'),
  ('CP1761696347250pa9isv7', 9, 'B'),
  ('CP1761696347250pa9isv7', 10, 'E');

INSERT OR REPLACE INTO rating_result (counterparty_id, base_rating, weighted_notch, final_rating, updated_at)
VALUES ('CP1761696347250pa9isv7', 2, 0.66, 3, '2025-10-29 00:17:13');
