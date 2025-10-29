// API endpoint for Stage 2: Dynamic rows and base rating calculation

import { Env, jsonResponse, errorResponse, corsHeaders } from '../../utils/db';
import { calculateStage2ABaseRating, calculateStage2BBaseRating, validateWeights, calculateFinalRating } from '../../utils/calculations';

interface Stage2Row {
  underline?: string;
  category?: string;
  sector: string;
  weight: number;
}

export async function onRequestPost(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const counterpartyId = context.params.id;
    const { option, rows } = await context.request.json();

    // Validate inputs
    if (option !== 1 && option !== 2) {
      return errorResponse('Option must be 1 or 2');
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse('Rows array is required and must not be empty');
    }

    // Validate weights sum to 1.0
    const weights = rows.map((r: Stage2Row) => r.weight);
    if (!validateWeights(weights)) {
      return errorResponse('Weights must sum to 1.0');
    }

    // Check if counterparty exists
    const counterparty = await context.env.DB.prepare(
      'SELECT id FROM counterparty WHERE id = ?'
    ).bind(counterpartyId).first();

    if (!counterparty) {
      return errorResponse('Counterparty not found', 404);
    }

    // Calculate base rating based on option
    let baseRating: number;
    if (option === 1) {
      // Option 1: Underline + Sector + Weight
      for (const row of rows) {
        if (!row.underline || !row.sector || typeof row.weight !== 'number') {
          return errorResponse('Each row must have underline, sector, and weight');
        }
      }
      baseRating = calculateStage2ABaseRating(rows);
    } else {
      // Option 2: Category + Sector + Weight
      for (const row of rows) {
        if (!row.category || !row.sector || typeof row.weight !== 'number') {
          return errorResponse('Each row must have category, sector, and weight');
        }
      }
      baseRating = calculateStage2BBaseRating(rows);
    }

    // Delete existing rows for this counterparty (use explicit table names for security)
    if (option === 1) {
      await context.env.DB.prepare(
        'DELETE FROM stage2_opt1_row WHERE counterparty_id = ?'
      ).bind(counterpartyId).run();
    } else {
      await context.env.DB.prepare(
        'DELETE FROM stage2_opt2_row WHERE counterparty_id = ?'
      ).bind(counterpartyId).run();
    }

    // Insert new rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (option === 1) {
        await context.env.DB.prepare(
          `INSERT INTO stage2_opt1_row (counterparty_id, line_no, underline, sector, weight)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(counterpartyId, i + 1, row.underline, row.sector, row.weight).run();
      } else {
        await context.env.DB.prepare(
          `INSERT INTO stage2_opt2_row (counterparty_id, line_no, category, sector, weight)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(counterpartyId, i + 1, row.category, row.sector, row.weight).run();
      }
    }

    // Insert or update stage2_result
    await context.env.DB.prepare(
      `INSERT INTO stage2_result (counterparty_id, option, base_rating, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(counterparty_id) DO UPDATE SET
         option = excluded.option,
         base_rating = excluded.base_rating,
         updated_at = datetime('now')`
    ).bind(counterpartyId, option, baseRating).run();

    // Check if Stage 3 answers exist - if so, recalculate final rating
    const stage3Answers = await context.env.DB.prepare(
      'SELECT question_no, choice_key FROM stage3_answer WHERE counterparty_id = ? ORDER BY question_no'
    ).bind(counterpartyId).all();

    if (stage3Answers.results && stage3Answers.results.length > 0) {
      // Recalculate final rating with new base rating
      const { weighted_notch, final_rating } = calculateFinalRating(
        baseRating,
        stage3Answers.results as Array<{ question_no: number; choice_key: string }>
      );

      // Update rating_result
      await context.env.DB.prepare(
        `INSERT INTO rating_result (counterparty_id, base_rating, weighted_notch, final_rating, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(counterparty_id) DO UPDATE SET
           base_rating = excluded.base_rating,
           weighted_notch = excluded.weighted_notch,
           final_rating = excluded.final_rating,
           updated_at = datetime('now')`
      ).bind(counterpartyId, baseRating, weighted_notch, final_rating).run();
    }

    return jsonResponse({
      counterparty_id: counterpartyId,
      option,
      base_rating: baseRating,
      rows_count: rows.length,
      final_rating_updated: stage3Answers.results && stage3Answers.results.length > 0,
    });
  } catch (error: any) {
    console.error('Error processing Stage 2:', error);
    return errorResponse(error.message || 'Failed to process Stage 2', 500);
  }
}

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const counterpartyId = context.params.id;

    // Get stage2_result
    const result = await context.env.DB.prepare(
      'SELECT * FROM stage2_result WHERE counterparty_id = ?'
    ).bind(counterpartyId).first();

    if (!result) {
      return errorResponse('Stage 2 data not found', 404);
    }

    // Get rows based on option (use explicit table names for security)
    let rowsResult;
    if (result.option === 1) {
      rowsResult = await context.env.DB.prepare(
        'SELECT * FROM stage2_opt1_row WHERE counterparty_id = ? ORDER BY line_no'
      ).bind(counterpartyId).all();
    } else {
      rowsResult = await context.env.DB.prepare(
        'SELECT * FROM stage2_opt2_row WHERE counterparty_id = ? ORDER BY line_no'
      ).bind(counterpartyId).all();
    }

    return jsonResponse({
      counterparty_id: result.counterparty_id,
      option: result.option,
      base_rating: result.base_rating,
      rows: rowsResult.results || [],
      updated_at: result.updated_at,
    });
  } catch (error: any) {
    console.error('Error fetching Stage 2:', error);
    return errorResponse(error.message || 'Failed to fetch Stage 2', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
