// API endpoint to seed test data
// Only works in development mode

import { Env, jsonResponse, errorResponse, corsHeaders } from '../utils/db';

const TEST_DATA = {
  counterparties: [
    {
      id: 'CP1761695330057vkz2q6q',
      cp_id: 'FUND001',
      name: 'Alpha Fund',
      created_at: '2025-10-28T23:48:50.057Z',
    },
    {
      id: 'CP1761695604668e7t1y4r',
      cp_id: '434342',
      name: 'test2',
      created_at: '2025-10-28T23:53:24.669Z',
    },
    {
      id: 'CP1761696347250pa9isv7',
      cp_id: 'debug001',
      name: 'debug fund',
      created_at: '2025-10-29T00:05:47.253Z',
    },
  ],
  stage1: [
    {
      counterparty_id: 'CP1761695330057vkz2q6q',
      q1: 1,
      q2: 1,
      q3: 0,
      route: 'A',
      updated_at: '2025-10-28 23:49:03',
    },
    {
      counterparty_id: 'CP1761695604668e7t1y4r',
      q1: 0,
      q2: 0,
      q3: 0,
      route: 'B',
      updated_at: '2025-10-28 23:54:37',
    },
    {
      counterparty_id: 'CP1761696347250pa9isv7',
      q1: 1,
      q2: 1,
      q3: 1,
      route: 'A',
      updated_at: '2025-10-29 00:31:08',
    },
  ],
  stage2_opt1_rows: [
    {
      id: 1,
      counterparty_id: 'CP1761695330057vkz2q6q',
      line_no: 1,
      underline: 'Equity',
      sector: '1.0',
      weight: 0.6,
    },
    {
      id: 2,
      counterparty_id: 'CP1761695330057vkz2q6q',
      line_no: 2,
      underline: 'Fixed Income',
      sector: '2.0',
      weight: 0.4,
    },
    {
      id: 3,
      counterparty_id: 'CP1761695604668e7t1y4r',
      line_no: 1,
      underline: 'asset1',
      sector: 'Sector 2',
      weight: 1.0,
    },
    {
      id: 4,
      counterparty_id: 'CP1761696347250pa9isv7',
      line_no: 1,
      underline: 'asset1',
      sector: 'Sector 2',
      weight: 1.0,
    },
  ],
  stage2_results: [
    {
      counterparty_id: 'CP1761695330057vkz2q6q',
      option: 1,
      base_rating: 1,
      updated_at: '2025-10-28 23:49:03',
    },
    {
      counterparty_id: 'CP1761695604668e7t1y4r',
      option: 2,
      base_rating: 2,
      updated_at: '2025-10-28 23:54:45',
    },
    {
      counterparty_id: 'CP1761696347250pa9isv7',
      option: 2,
      base_rating: 1,
      updated_at: '2025-10-29 00:30:53',
    },
  ],
  stage3_answers: [
    // Alpha Fund answers
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 1, choice_key: 'A' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 2, choice_key: 'B' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 3, choice_key: 'A' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 4, choice_key: 'C' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 5, choice_key: 'B' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 6, choice_key: 'A' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 7, choice_key: 'B' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 8, choice_key: 'A' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 9, choice_key: 'B' },
    { counterparty_id: 'CP1761695330057vkz2q6q', question_no: 10, choice_key: 'A' },
    // test2 answers
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 1, choice_key: 'A' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 2, choice_key: 'C' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 3, choice_key: 'C' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 4, choice_key: 'A' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 5, choice_key: 'A' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 6, choice_key: 'B' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 7, choice_key: 'D' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 8, choice_key: 'A' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 9, choice_key: 'A' },
    { counterparty_id: 'CP1761695604668e7t1y4r', question_no: 10, choice_key: 'E' },
    // debug fund answers
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 1, choice_key: 'C' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 2, choice_key: 'A' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 3, choice_key: 'E' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 4, choice_key: 'A' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 5, choice_key: 'B' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 6, choice_key: 'F' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 7, choice_key: 'A' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 8, choice_key: 'E' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 9, choice_key: 'B' },
    { counterparty_id: 'CP1761696347250pa9isv7', question_no: 10, choice_key: 'E' },
  ],
  rating_results: [
    {
      counterparty_id: 'CP1761695330057vkz2q6q',
      base_rating: 1,
      weighted_notch: 0.03,
      final_rating: 1,
      updated_at: '2025-10-28 23:51:09',
    },
    {
      counterparty_id: 'CP1761695604668e7t1y4r',
      base_rating: 2,
      weighted_notch: 0.63,
      final_rating: 3,
      updated_at: '2025-10-28 23:56:19',
    },
    {
      counterparty_id: 'CP1761696347250pa9isv7',
      base_rating: 2,
      weighted_notch: 0.66,
      final_rating: 3,
      updated_at: '2025-10-29 00:17:13',
    },
  ],
};

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    // Check if database already has data
    const checkResult = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM counterparty'
    ).first();

    const count = checkResult?.count || 0;

    if (count > 0) {
      return jsonResponse({
        message: 'Database already contains data. Use force=true to reseed anyway.',
        current_count: count,
      });
    }

    // Insert counterparties
    for (const cp of TEST_DATA.counterparties) {
      await context.env.DB.prepare(
        `INSERT OR IGNORE INTO counterparty (id, cp_id, name, created_at)
         VALUES (?, ?, ?, ?)`
      )
        .bind(cp.id, cp.cp_id, cp.name, cp.created_at)
        .run();
    }

    // Insert stage1
    for (const s1 of TEST_DATA.stage1) {
      await context.env.DB.prepare(
        `INSERT OR REPLACE INTO stage1 (counterparty_id, q1, q2, q3, route, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          s1.counterparty_id,
          s1.q1,
          s1.q2,
          s1.q3,
          s1.route,
          s1.updated_at
        )
        .run();
    }

    // Insert stage2 rows
    for (const row of TEST_DATA.stage2_opt1_rows) {
      await context.env.DB.prepare(
        `INSERT OR IGNORE INTO stage2_opt1_row (id, counterparty_id, line_no, underline, sector, weight)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          row.id,
          row.counterparty_id,
          row.line_no,
          row.underline,
          row.sector,
          row.weight
        )
        .run();
    }

    // Insert stage2 results
    for (const s2 of TEST_DATA.stage2_results) {
      await context.env.DB.prepare(
        `INSERT OR REPLACE INTO stage2_result (counterparty_id, option, base_rating, updated_at)
         VALUES (?, ?, ?, ?)`
      )
        .bind(
          s2.counterparty_id,
          s2.option,
          s2.base_rating,
          s2.updated_at
        )
        .run();
    }

    // Insert stage3 answers
    for (const s3 of TEST_DATA.stage3_answers) {
      await context.env.DB.prepare(
        `INSERT OR REPLACE INTO stage3_answer (counterparty_id, question_no, choice_key)
         VALUES (?, ?, ?)`
      )
        .bind(s3.counterparty_id, s3.question_no, s3.choice_key)
        .run();
    }

    // Insert rating results
    for (const rr of TEST_DATA.rating_results) {
      await context.env.DB.prepare(
        `INSERT OR REPLACE INTO rating_result (counterparty_id, base_rating, weighted_notch, final_rating, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(
          rr.counterparty_id,
          rr.base_rating,
          rr.weighted_notch,
          rr.final_rating,
          rr.updated_at
        )
        .run();
    }

    return jsonResponse({
      message: 'Test data seeded successfully!',
      test_cases: [
        {
          name: 'Alpha Fund',
          cp_id: 'FUND001',
          route: 'A',
          final_rating: 1,
        },
        {
          name: 'test2',
          cp_id: '434342',
          route: 'B',
          final_rating: 3,
        },
        {
          name: 'debug fund',
          cp_id: 'debug001',
          route: 'A',
          final_rating: 3,
        },
      ],
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return errorResponse(error.message || 'Failed to seed data', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
