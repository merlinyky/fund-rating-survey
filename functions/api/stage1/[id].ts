// API endpoint for Stage 1: Three yes/no questions and routing

import { Env, jsonResponse, errorResponse, corsHeaders } from '../../utils/db';
import { determineRoute } from '../../utils/calculations';

export async function onRequestPost(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const counterpartyId = context.params.id;
    const { q1, q2, q3 } = await context.request.json();

    // Validate inputs
    if (typeof q1 !== 'boolean' || typeof q2 !== 'boolean' || typeof q3 !== 'boolean') {
      return errorResponse('All three questions must be answered with true/false');
    }

    // Check if counterparty exists
    const counterparty = await context.env.DB.prepare(
      'SELECT id FROM counterparty WHERE id = ?'
    ).bind(counterpartyId).first();

    if (!counterparty) {
      return errorResponse('Counterparty not found', 404);
    }

    // Determine route based on answers
    const route = determineRoute(q1, q2, q3);

    // Insert or update Stage 1 data
    await context.env.DB.prepare(
      `INSERT INTO stage1 (counterparty_id, q1, q2, q3, route, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(counterparty_id) DO UPDATE SET
         q1 = excluded.q1,
         q2 = excluded.q2,
         q3 = excluded.q3,
         route = excluded.route,
         updated_at = datetime('now')`
    ).bind(counterpartyId, q1 ? 1 : 0, q2 ? 1 : 0, q3 ? 1 : 0, route).run();

    return jsonResponse({
      counterparty_id: counterpartyId,
      q1,
      q2,
      q3,
      route,
    });
  } catch (error: any) {
    console.error('Error processing Stage 1:', error);
    return errorResponse(error.message || 'Failed to process Stage 1', 500);
  }
}

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const counterpartyId = context.params.id;

    const result = await context.env.DB.prepare(
      'SELECT * FROM stage1 WHERE counterparty_id = ?'
    ).bind(counterpartyId).first();

    if (!result) {
      return errorResponse('Stage 1 data not found', 404);
    }

    return jsonResponse({
      counterparty_id: result.counterparty_id,
      q1: result.q1 === 1,
      q2: result.q2 === 1,
      q3: result.q3 === 1,
      route: result.route,
      updated_at: result.updated_at,
    });
  } catch (error: any) {
    console.error('Error fetching Stage 1:', error);
    return errorResponse(error.message || 'Failed to fetch Stage 1', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
