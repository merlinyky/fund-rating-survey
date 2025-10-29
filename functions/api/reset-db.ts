// API endpoint to reset database (clear all data)
// Only for development use

import { Env, jsonResponse, errorResponse, corsHeaders } from '../utils/db';

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    // Delete all data in reverse dependency order
    await context.env.DB.prepare('DELETE FROM rating_result').run();
    await context.env.DB.prepare('DELETE FROM stage3_answer').run();
    await context.env.DB.prepare('DELETE FROM stage2_result').run();
    await context.env.DB.prepare('DELETE FROM stage2_opt2_row').run();
    await context.env.DB.prepare('DELETE FROM stage2_opt1_row').run();
    await context.env.DB.prepare('DELETE FROM stage1').run();
    await context.env.DB.prepare('DELETE FROM counterparty').run();

    // Reset autoincrement counters
    await context.env.DB.prepare('DELETE FROM sqlite_sequence WHERE name IN (?, ?)').bind('stage2_opt1_row', 'stage2_opt2_row').run();

    return jsonResponse({
      message: 'Database reset successfully',
      note: 'All tables are now empty',
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return errorResponse(error.message || 'Failed to reset database', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
