// API endpoint for fetching complete survey summary

import { Env, jsonResponse, errorResponse, corsHeaders } from '../../utils/db';

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const counterpartyId = context.params.id;

    // Get counterparty info
    const counterparty = await context.env.DB.prepare(
      'SELECT * FROM counterparty WHERE id = ?'
    ).bind(counterpartyId).first();

    if (!counterparty) {
      return errorResponse('Counterparty not found', 404);
    }

    // Get Stage 1 data
    const stage1 = await context.env.DB.prepare(
      'SELECT * FROM stage1 WHERE counterparty_id = ?'
    ).bind(counterpartyId).first();

    // Get Stage 2 data
    const stage2Result = await context.env.DB.prepare(
      'SELECT * FROM stage2_result WHERE counterparty_id = ?'
    ).bind(counterpartyId).first();

    // Get stage2 rows based on option (use explicit table names for security)
    let stage2Rows = null;
    if (stage2Result) {
      let rowsResult;
      if (stage2Result.option === 1) {
        rowsResult = await context.env.DB.prepare(
          'SELECT * FROM stage2_opt1_row WHERE counterparty_id = ? ORDER BY line_no'
        ).bind(counterpartyId).all();
      } else {
        rowsResult = await context.env.DB.prepare(
          'SELECT * FROM stage2_opt2_row WHERE counterparty_id = ? ORDER BY line_no'
        ).bind(counterpartyId).all();
      }
      stage2Rows = rowsResult.results || [];
    }

    // Get Stage 3 answers
    const stage3Answers = await context.env.DB.prepare(
      'SELECT * FROM stage3_answer WHERE counterparty_id = ? ORDER BY question_no'
    ).bind(counterpartyId).all();

    // Get final rating
    const ratingResult = await context.env.DB.prepare(
      'SELECT * FROM rating_result WHERE counterparty_id = ?'
    ).bind(counterpartyId).first();

    return jsonResponse({
      counterparty: {
        id: counterparty.id,
        name: counterparty.name,
        created_at: counterparty.created_at,
      },
      stage1: stage1 ? {
        q1: stage1.q1 === 1,
        q2: stage1.q2 === 1,
        q3: stage1.q3 === 1,
        route: stage1.route,
        updated_at: stage1.updated_at,
      } : null,
      stage2: stage2Result ? {
        option: stage2Result.option,
        base_rating: stage2Result.base_rating,
        rows: stage2Rows,
        updated_at: stage2Result.updated_at,
      } : null,
      stage3: {
        answers: stage3Answers.results || [],
      },
      final_rating: ratingResult ? {
        base_rating: ratingResult.base_rating,
        weighted_notch: ratingResult.weighted_notch,
        final_rating: ratingResult.final_rating,
        updated_at: ratingResult.updated_at,
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    return errorResponse(error.message || 'Failed to fetch summary', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
