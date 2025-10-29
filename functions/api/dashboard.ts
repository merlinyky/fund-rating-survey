// API endpoint for dashboard listing with search

import { Env, jsonResponse, errorResponse, corsHeaders } from '../utils/db';

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `
      SELECT
        c.id,
        c.cp_id,
        c.name,
        c.created_at,
        s1.route,
        s2.option as stage2_option,
        s2.base_rating,
        rr.weighted_notch,
        rr.final_rating,
        rr.updated_at as rating_updated_at
      FROM counterparty c
      LEFT JOIN stage1 s1 ON c.id = s1.counterparty_id
      LEFT JOIN stage2_result s2 ON c.id = s2.counterparty_id
      LEFT JOIN rating_result rr ON c.id = rr.counterparty_id
    `;

    const params: any[] = [];

    if (search) {
      query += ' WHERE c.name LIKE ? OR c.cp_id LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = context.env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM counterparty';
    const countParams: any[] = [];

    if (search) {
      countQuery += ' WHERE name LIKE ? OR cp_id LIKE ?';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await context.env.DB.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.total || 0;

    return jsonResponse({
      entries: result.results || [],
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    return errorResponse(error.message || 'Failed to fetch dashboard', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
